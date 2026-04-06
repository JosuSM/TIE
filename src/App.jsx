import { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { DummyCore } from './core/dummy/DummyCore';
import { NesCore } from './core/NesCore';
import { GameboyCore } from './core/GameboyCore';
import { GbaCore } from './core/GbaCore';
import { ConsoleScreen } from './components/ConsoleScreen';
import { InputManager } from './core/InputManager';
import { NetplayManager } from './core/NetplayManager';

function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [core, setCore] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const [peerId, setPeerId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [netplayStatus, setNetplayStatus] = useState('DISCONNECTED'); // HOSTING, JOINING, CONNECTED

  // Global Setup Settings
  const defaultSettings = {
    textureFilter: 'nearest',
    lowLatency: true,
    hapticFeedback: true,
    showFps: true,
    uiScale: 1
  };
  
  const [globalSettings, setGlobalSettings] = useState(() => {
    const saved = localStorage.getItem('tieGlobalSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSetting = (key, val) => {
    const nextState = { ...globalSettings, [key]: val };
    setGlobalSettings(nextState);
    localStorage.setItem('tieGlobalSettings', JSON.stringify(nextState));
  };

  const currentRomBuffer = useRef(null);

  const inputManager = useMemo(() => new InputManager(), []);
  const netplayManager = useMemo(() => new NetplayManager(), []);
  const coreRef = useRef(null);

  useEffect(() => {
    inputManager.init();
    return () => inputManager.cleanup();
  }, [inputManager]);

  useEffect(() => {
    netplayManager.onPeerIdGenerated = (id) => setPeerId(id);
    netplayManager.onConnected = () => {
      setNetplayStatus('CONNECTED');
      if (currentRomBuffer.current) {
         bootCore(currentRomBuffer.current.buffer, currentRomBuffer.current.filename);
      }
    };
    netplayManager.onError = () => setNetplayStatus('DISCONNECTED');
    
    netplayManager.onDataReceived = (data) => {
      if (data.type === 'INPUT' && coreRef.current) {
         const remotePlayerIndex = netplayManager.isHost ? 1 : 0;
         coreRef.current.setControllerState(remotePlayerIndex, data.state);
      }
    };

    return () => netplayManager.disconnect();
  }, [netplayManager]);

  const loadDummyCore = async () => {
    const dummy = new DummyCore();
    await dummy.init();
    await dummy.loadROM(new Uint8Array());
    setCore(dummy);
    coreRef.current = dummy;
    setIsRunning(true);
  };

  const bootCore = async (buffer, filename) => {
    let coreInstance;
    try {
      if (filename.endsWith('.nes')) {
        coreInstance = new NesCore();
      } else if (filename.endsWith('.gb') || filename.endsWith('.gbc')) {
        coreInstance = new GameboyCore(); 
      } else if (filename.endsWith('.gba')) {
        coreInstance = new GbaCore();
      } else {
        alert("Unsupported ROM format! TIE supports .nes, .gb, .gbc, .gba.");
        return;
      }

      await coreInstance.init();
      await coreInstance.loadROM(new Uint8Array(buffer));
      
      setCore(coreInstance);
      coreRef.current = coreInstance;
      setIsRunning(true);
    } catch(err) {
      console.error(err);
      alert("Failed to load Core!");
    }
  };

  const handleRomUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.match(/\.(nes|gb|gbc|gba)$/i)) {
      const buffer = await file.arrayBuffer();
      currentRomBuffer.current = { buffer, filename: file.name };
      bootCore(buffer, file.name);
    } else {
      alert("Invalid ROM format!");
    }
  };

  const handleHost = () => {
    setNetplayStatus('HOSTING');
    netplayManager.initAsHost();
  };

  const handleJoin = () => {
    if (!joinId) return;
    setNetplayStatus('JOINING');
    netplayManager.joinLobby(joinId);
  };

  const handleCancelNetplay = () => {
    netplayManager.disconnect();
    setNetplayStatus('DISCONNECTED');
    setPeerId('');
  };

  // Controller Mapping Logic
  const [mappingAction, setMappingAction] = useState(null);
  
  useEffect(() => {
    if (!mappingAction) return;
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      inputManager.remapKey(mappingAction, e.code);
      setMappingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mappingAction, inputManager]);

  const renderMainContent = () => {
    if (isRunning) {
      return <ConsoleScreen core={core} isRunning={isRunning} inputManager={inputManager} netplayManager={netplayManager} settings={globalSettings} />;
    }

    if (activeTab === 'settings') {
      return (
        <div className="settings-container">
           <h2 className="screen-title" style={{ textAlign: 'center' }}>System Configuration</h2>
           <p className="screen-subtitle" style={{ textAlign: 'center', margin: '0 auto 2rem auto' }}>
              Adjust core environment features for performance and visuals universally.
           </p>

           <div className="settings-section">
              <h3 className="settings-header">Graphics & Display</h3>
              
              <div className="setting-row">
                 <label>Texture Filtering Mode</label>
                 <select value={globalSettings.textureFilter} onChange={(e) => updateSetting('textureFilter', e.target.value)}>
                    <option value="nearest">Nearest-Neighbor (Sharp / Retro)</option>
                    <option value="bilinear">Bilinear (Smooth / Blurred)</option>
                 </select>
              </div>

              <div className="setting-row">
                 <label>Resolution Scale</label>
                 <select value={globalSettings.uiScale} onChange={(e) => updateSetting('uiScale', Number(e.target.value))}>
                    <option value={1}>1x (Native Dimensions)</option>
                    <option value={2}>2x (Upscaled Interface)</option>
                    <option value={4}>4x (HD Display Space)</option>
                 </select>
              </div>

              <div className="setting-row">
                 <label>Low Latency Display (Torn Buffer offscreen rendering)</label>
                 <input type="checkbox" checked={globalSettings.lowLatency} onChange={(e) => updateSetting('lowLatency', e.target.checked)} />
              </div>
           </div>

           <div className="settings-section">
              <h3 className="settings-header">Overlay Information</h3>
              <div className="setting-row">
                 <label>Show Framerate (FPS) Counter</label>
                 <input type="checkbox" checked={globalSettings.showFps} onChange={(e) => updateSetting('showFps', e.target.checked)} />
              </div>
           </div>
           
           <div className="settings-section">
              <h3 className="settings-header">Controls Optimization</h3>
              <div className="setting-row">
                 <label>Haptic Feedback (Vibration API Rumble Protocol)</label>
                 <input type="checkbox" checked={globalSettings.hapticFeedback} onChange={(e) => updateSetting('hapticFeedback', e.target.checked)} />
              </div>
           </div>
        </div>
      );
    }
    
    if (activeTab === 'controllers') {
      const p1Actions = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
      return (
        <div className="settings-container">
           <h2 className="screen-title" style={{ textAlign: 'center' }}>Controller Setup</h2>
           <p className="screen-subtitle" style={{ textAlign: 'center', margin: '0 auto 2rem auto' }}>
              Click an input below, then press the physical key you want to bind to it!
           </p>
           
           <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1.5rem' }}>
              {p1Actions.map(action => (
                <div key={action} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', gap: '1rem' }}>
                   <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{action}</span>
                   <button 
                     className="btn-primary" 
                     style={{ margin: 0, padding: '0.5rem 0.8rem', minWidth: '100px', maxWidth: '140px', fontSize: '0.85rem', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                     onClick={() => setMappingAction(action)}
                   >
                     {mappingAction === action ? 'PRESS KEY' : inputManager.getButtonName(action)}
                   </button>
                </div>
              ))}
           </div>
        </div>
      )
    }

    if (activeTab === 'netplay') {
      return (
        <>
          <div className="screen-icon">🌐</div>
          <h2 className="screen-title">Netplay Lobbies</h2>
          <p className="screen-subtitle" style={{ marginBottom: '2rem' }}>
            Matchmake with friends using peer-to-peer WebRTC connections. Connect, then load a ROM in your library!
          </p>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', width: '100%', maxWidth: '600px' }}>
             <div className="glass-panel" style={{ flex: 1, padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Host Session</h3>
                {netplayStatus === 'DISCONNECTED' && (
                  <button className="btn-primary" onClick={handleHost} style={{ marginTop: '1rem' }}>Start Hosting</button>
                )}
                {netplayStatus === 'HOSTING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ color: '#00f0ff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Waiting for opponent...</p>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'monospace', marginBottom: '1rem', width: '100%', wordBreak: 'break-all' }}>
                       {peerId || 'Generating...'}
                    </div>
                    <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #ff5e5e', color: '#ff5e5e', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginTop: '0' }} onClick={handleCancelNetplay}>
                      Cancel Room
                    </button>
                  </div>
                )}
             </div>

             <div className="glass-panel" style={{ flex: 1, padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Join Session</h3>
                {netplayStatus === 'DISCONNECTED' && (
                  <>
                    <input 
                      type="text" 
                      placeholder="Enter Host ID" 
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      style={{ 
                        width: '100%', padding: '0.8rem', borderRadius: '8px', 
                        border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.3)', 
                        color: 'white', marginBottom: '1rem', boxSizing: 'border-box'
                      }}
                    />
                    <button className="btn-primary" onClick={handleJoin} style={{ width: '100%', marginTop: 0 }}>Join Lobby</button>
                  </>
                )}
                {netplayStatus === 'JOINING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ color: '#00f0ff', marginTop: '1rem', marginBottom: '1rem' }}>Connecting via WebRTC...</p>
                    <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #ff5e5e', color: '#ff5e5e', padding: '0.5rem 1.5rem', fontSize: '0.9rem', marginTop: '0' }} onClick={handleCancelNetplay}>
                      Cancel Join
                    </button>
                  </div>
                )}
             </div>
          </div>
        </>
      );
    }

    if (activeTab === 'library') {
       return (
         <>
           <div className="screen-icon">🎮</div>
           <h2 className="screen-title">Games Library</h2>
           <p className="screen-subtitle" style={{ marginBottom: '2rem' }}>
             Upload a physical backup of a supported console ROM file to begin!
           </p>

           <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
             <input type="file" id="rom-upload" accept=".nes,.gb,.gbc,.gba" onChange={handleRomUpload} style={{ display: 'none' }} />
             <label htmlFor="rom-upload" className="btn-primary" style={{ cursor: 'pointer' }}>
                Browse For ROM
             </label>

             <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)' }} onClick={loadDummyCore}>
                Test Dummy Core
             </button>
           </div>
         </>
       );
    }

    return (
      <>
        <div className="screen-icon">✨</div>
        <h2 className="screen-title">The Interconnected Emulator</h2>
        <p className="screen-subtitle">Welcome to the future of multi-platform emulation.</p>
      </>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel">
        <div className="logo">TIE</div>
        
        <div className="nav-label">Main</div>
        <div className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'library' && !isRunning ? 'active' : ''}`}
            onClick={() => { setIsRunning(false); setActiveTab('library'); }}
          >
            🎮 Games Library
          </button>
          <button 
            className={`nav-item ${activeTab === 'cores' && !isRunning ? 'active' : ''}`}
            onClick={() => { setIsRunning(false); setActiveTab('cores'); }}
          >
            🧩 Emulator Cores
          </button>
          <button 
            className={`nav-item ${activeTab === 'netplay' && !isRunning ? 'active' : ''}`}
            onClick={() => { setIsRunning(false); setActiveTab('netplay'); }}
          >
            🌐 Netplay Lobbies
          </button>
        </div>

        <div className="nav-label">Settings</div>
        <div className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'controllers' && !isRunning ? 'active' : ''}`}
            onClick={() => { setIsRunning(false); setActiveTab('controllers'); }}
          >
            ⌨️ Controllers Setup
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' && !isRunning ? 'active' : ''}`}
            onClick={() => { setIsRunning(false); setActiveTab('settings'); }}
          >
            ⚙️ Display & Perf.
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header glass-panel">
          <div className="search-bar"></div>
          <div className="user-status">
            <span className="status-dot"></span>
            <span>
              {netplayStatus === 'CONNECTED' ? 'Online Mutliplayer' : 'Local Instance'}
            </span>
          </div>
        </header>

        <section className="screen-container glass-panel" style={{ padding: isRunning ? '0' : '0' }}>
          {!isRunning && <div className="grid-bg"></div>}
          
          <div className="screen-content" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {renderMainContent()}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
