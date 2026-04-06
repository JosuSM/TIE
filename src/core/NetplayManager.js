import Peer from 'peerjs';

export class NetplayManager {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.isHost = false;
    
    // Callbacks
    this.onConnected = null;
    this.onDataReceived = null;
    this.onPeerIdGenerated = null;
    this.onError = null;
  }

  initAsHost() {
    this.isHost = true;
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      console.log('[TIE Netplay] Host Peer ID:', id);
      if (this.onPeerIdGenerated) this.onPeerIdGenerated(id);
    });

    this.peer.on('connection', (conn) => {
      console.log('[TIE Netplay] Guest connected to host!');
      this.connection = conn;
      this._setupConnection(conn);
    });
    
    this.peer.on('error', (err) => {
      console.error('[TIE Netplay Error]', err);
      if (this.onError) this.onError(err);
    });
  }

  joinLobby(hostId) {
    this.isHost = false;
    this.peer = new Peer();
    
    this.peer.on('open', () => {
      console.log('[TIE Netplay] Joining Host:', hostId);
      // We use WebRTC data channels via SCTP. Reliable: false is best for input latency 
      // but PeerJS defaults to true, we can pass reliable: false 
      const conn = this.peer.connect(hostId, { reliable: false }); 
      this.connection = conn;
      this._setupConnection(conn);
    });
    
    this.peer.on('error', (err) => {
      console.error('[TIE Netplay Error]', err);
      if (this.onError) this.onError(err);
    });
  }

  _setupConnection(conn) {
    conn.on('open', () => {
      console.log('[TIE Netplay] WebRTC Data Channel Opened!');
      if (this.onConnected) this.onConnected();
    });

    conn.on('data', (data) => {
      if (this.onDataReceived) this.onDataReceived(data);
    });
    
    conn.on('close', () => {
      console.log('[TIE Netplay] Disconnected');
    });
  }

  sendInput(inputState) {
    if (this.connection && this.connection.open) {
      this.connection.send({ type: 'INPUT', state: inputState });
    }
  }

  disconnect() {
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
    this.peer = null;
    this.connection = null;
  }
}
