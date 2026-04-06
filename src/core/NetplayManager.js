import Peer from 'peerjs';

export class NetplayManager {
  constructor() {
    this.peer = null;
    this.connections = []; // Array of { conn, playerIndex }
    this.activeConnection = null; // For Guests (connecting to Host)
    this.isHost = false;
    this.localPlayerIndex = 0;
    
    // Callbacks
    this.onConnected = null;
    this.onDataReceived = null;
    this.onPeerIdGenerated = null;
    this.onError = null;
    this.onPingUpdated = null;
    this.onLobbyUpdated = null;
  }

  get connection() {
    // Legacy support accessor for App.jsx check `netplayManager.connection`
    return this.isHost ? (this.connections.length > 0 ? this.connections[0].conn : null) : this.activeConnection;
  }

  get activePlayersCount() {
    return this.isHost ? this.connections.length + 1 : 2; // Rough estimate for guest
  }

  initAsHost() {
    this.isHost = true;
    this.localPlayerIndex = 0;
    this.connections = [];
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      console.log('[TIE Netplay] Host Peer ID:', id);
      if (this.onPeerIdGenerated) this.onPeerIdGenerated(id);
    });

    this.peer.on('connection', (conn) => {
      if (this.connections.length >= 3) {
        console.warn('Lobby full, rejecting connection.');
        conn.close();
        return;
      }
      
      const pIndex = this.connections.length + 1; // 1, 2, or 3
      console.log(`[TIE Netplay] Guest connected! Assigned Player ${pIndex + 1}`);
      
      conn.on('open', () => {
         conn.send({ type: 'HANDSHAKE', playerIndex: pIndex });
         this.connections.push({ conn, playerIndex: pIndex });
         
         if (this.onConnected && this.connections.length === 1) {
            // Trigger first connection generic start
            this.onConnected();
         }
         if (this.onLobbyUpdated) this.onLobbyUpdated(this.connections.length + 1);

         // Start ping loop for this connection
         conn.pingInterval = setInterval(() => {
            if (conn.open) conn.send({ type: 'PING', ts: performance.now() });
         }, 2000);
      });

      conn.on('data', (data) => {
         // Host relay system
         if (data.type === 'PING') {
            conn.send({ type: 'PONG', ts: data.ts });
         } else if (data.type === 'PONG') {
            const ping = Math.round(performance.now() - data.ts);
            if (this.onPingUpdated && pIndex === 1) this.onPingUpdated(ping); // Show ping for P2 mostly on HUD
         } else if (data.type === 'INPUT') {
            // Rebroadcast to all other guests
            this.connections.forEach(c => {
               if (c.playerIndex !== data.playerIndex && c.conn.open) {
                   c.conn.send(data);
               }
            });
            if (this.onDataReceived) this.onDataReceived(data);
         }
      });
      
      conn.on('close', () => {
         console.log(`[TIE Netplay] Player ${pIndex + 1} disconnected`);
         if (conn.pingInterval) clearInterval(conn.pingInterval);
         this.connections = this.connections.filter(c => c.playerIndex !== pIndex);
         if (this.onLobbyUpdated) this.onLobbyUpdated(this.connections.length + 1);
         if (this.connections.length === 0 && this.onError) this.onError(new Error("All clients disconnected"));
      });
    });
    
    this.peer.on('error', (err) => {
      console.error('[TIE Netplay Error]', err);
      if (this.onError) this.onError(err);
    });
  }

  joinLobby(hostId) {
    this.isHost = false;
    this.activeConnection = null;
    this.peer = new Peer();
    
    this.peer.on('open', () => {
      console.log('[TIE Netplay] Joining Host:', hostId);
      const conn = this.peer.connect(hostId, { reliable: false }); 
      this.activeConnection = conn;
      
      conn.on('open', () => {
         console.log('[TIE Netplay] Guest Connected to Host');
         // We do not set onConnected immediately, we wait for HANDSHAKE to know our playerIndex
      });

      conn.on('data', (data) => {
         if (data.type === 'HANDSHAKE') {
            this.localPlayerIndex = data.playerIndex;
            console.log(`[TIE Netplay] Received Handshake. I am Player ${this.localPlayerIndex + 1}`);
            if (this.onConnected) this.onConnected(); // Officially ready to start core
         } else if (data.type === 'PING') {
            conn.send({ type: 'PONG', ts: data.ts });
         } else if (data.type === 'PONG') {
            const ping = Math.round(performance.now() - data.ts);
            if (this.onPingUpdated) this.onPingUpdated(ping);
         } else if (data.type === 'INPUT') {
            if (this.onDataReceived) this.onDataReceived(data);
         }
      });
      
      conn.on('close', () => {
         console.log('[TIE Netplay] Disconnected from Host');
         if (this.onError) this.onError(new Error("Host closed connection."));
      });
    });
    
    this.peer.on('error', (err) => {
      console.error('[TIE Netplay Error]', err);
      if (this.onError) this.onError(err);
    });
  }

  sendInput(inputState) {
    if (this.isHost) {
      // Host broadcasts to all guests
      this.connections.forEach(c => {
         if (c.conn.open) c.conn.send({ type: 'INPUT', playerIndex: 0, state: inputState });
      });
    } else if (this.activeConnection && this.activeConnection.open) {
      // Guest sends to Host
      this.activeConnection.send({ type: 'INPUT', playerIndex: this.localPlayerIndex, state: inputState });
    }
  }

  disconnect() {
    if (this.isHost) {
       this.connections.forEach(c => {
          if (c.conn.pingInterval) clearInterval(c.conn.pingInterval);
          c.conn.close();
       });
       this.connections = [];
    } else if (this.activeConnection) {
       this.activeConnection.close();
       this.activeConnection = null;
    }
    
    if (this.peer) this.peer.destroy();
    this.peer = null;
  }
}
