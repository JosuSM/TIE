import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';
import { DummyCore } from './core/dummy/DummyCore';
import { RetroCore } from './core/RetroCore';
import { ConsoleScreen } from './components/ConsoleScreen';
import { InputManager } from './core/InputManager';
import { NetplayManager } from './core/NetplayManager';
import { LibraryScanner } from './core/LibraryScanner';
import { ConsoleIcon } from './components/ConsoleIcon';
import { GamePatcher } from './components/GamePatcher';

/* ============================================================
   SYSTEM METADATA — icons, gradients, manufacturers
   ============================================================ */
const SYSTEM_META = {
  'NES':                { icon: <ConsoleIcon system="NES" />, gradient: 'linear-gradient(135deg, #c0392b, #e74c3c)', manufacturer: 'Nintendo', year: '1983' },
  'SNES':               { icon: <ConsoleIcon system="SNES" />, gradient: 'linear-gradient(135deg, #6c3483, #8e44ad)', manufacturer: 'Nintendo', year: '1990' },
  'Game Boy':           { icon: <ConsoleIcon system="Game Boy" />, gradient: 'linear-gradient(135deg, #1e8449, #27ae60)', manufacturer: 'Nintendo', year: '1989' },
  'Game Boy Color':     { icon: <ConsoleIcon system="Game Boy Color" />, gradient: 'linear-gradient(135deg, #d4ac0d, #f1c40f)', manufacturer: 'Nintendo', year: '1998' },
  'Game Boy Advance':   { icon: <ConsoleIcon system="Game Boy Advance" />, gradient: 'linear-gradient(135deg, #2471a3, #3498db)', manufacturer: 'Nintendo', year: '2001' },
  'Nintendo 64':        { icon: <ConsoleIcon system="Nintendo 64" />, gradient: 'linear-gradient(135deg, #922b21, #e74c3c)', manufacturer: 'Nintendo', year: '1996' },
  'Nintendo DS':        { icon: <ConsoleIcon system="Nintendo DS" />, gradient: 'linear-gradient(135deg, #5b7d9a, #85c1e9)', manufacturer: 'Nintendo', year: '2004' },
  'Nintendo 3DS':       { icon: <ConsoleIcon system="Nintendo 3DS" />, gradient: 'linear-gradient(135deg, #1a5276, #2980b9)', manufacturer: 'Nintendo', year: '2011' },
  'Master System':      { icon: <ConsoleIcon system="Master System" />, gradient: 'linear-gradient(135deg, #1f4788, #2e86c1)', manufacturer: 'Sega', year: '1985' },
  'Mega Drive':         { icon: <ConsoleIcon system="Mega Drive" />, gradient: 'linear-gradient(135deg, #1c2833, #566573)', manufacturer: 'Sega', year: '1988' },
  'Game Gear':          { icon: <ConsoleIcon system="Game Gear" />, gradient: 'linear-gradient(135deg, #ca6f1e, #e67e22)', manufacturer: 'Sega', year: '1990' },
  'Sega 32X':           { icon: <ConsoleIcon system="Sega 32X" />, gradient: 'linear-gradient(135deg, #2c3e50, #7f8c8d)', manufacturer: 'Sega', year: '1994' },
  'SG-1000':            { icon: <ConsoleIcon system="SG-1000" />, gradient: 'linear-gradient(135deg, #17202a, #2c3e50)', manufacturer: 'Sega', year: '1983' },
  'PSP':                { icon: <ConsoleIcon system="PSP" />, gradient: 'linear-gradient(135deg, #626567, #aeb6bf)', manufacturer: 'Sony', year: '2004' },
  'Atari 2600':         { icon: <ConsoleIcon system="Atari 2600" />, gradient: 'linear-gradient(135deg, #6e2c00, #a04000)', manufacturer: 'Atari', year: '1977' },
  'Atari 7800':         { icon: <ConsoleIcon system="Atari 7800" />, gradient: 'linear-gradient(135deg, #784212, #ba4a00)', manufacturer: 'Atari', year: '1986' },
  'Atari Lynx':         { icon: <ConsoleIcon system="Atari Lynx" />, gradient: 'linear-gradient(135deg, #b7950b, #f4d03f)', manufacturer: 'Atari', year: '1989' },
  'PC Engine':          { icon: <ConsoleIcon system="PC Engine" />, gradient: 'linear-gradient(135deg, #b9770e, #f39c12)', manufacturer: 'NEC', year: '1987' },
  'NeoGeo Pocket':      { icon: <ConsoleIcon system="NeoGeo Pocket" />, gradient: 'linear-gradient(135deg, #1a5276, #5dade2)', manufacturer: 'SNK', year: '1998' },
  'NeoGeo Pocket Color':{ icon: <ConsoleIcon system="NeoGeo Pocket Color" />, gradient: 'linear-gradient(135deg, #148f77, #1abc9c)', manufacturer: 'SNK', year: '1999' },
  'Famicom Disk System':{ icon: <ConsoleIcon system="Famicom Disk System" />, gradient: 'linear-gradient(135deg, #7b241c, #cb4335)', manufacturer: 'Nintendo', year: '1986' },
};

const getSystemIcon = (sys) => SYSTEM_META[sys]?.icon || <ConsoleIcon system={sys} />;

/* ============================================================
   BOX ART — libretro-thumbnails from GitHub with robust naming
   ============================================================ */
const SYSTEM_THUMB_MAP = {
  'NES': 'Nintendo_-_Nintendo_Entertainment_System',
  'SNES': 'Nintendo_-_Super_Nintendo_Entertainment_System',
  'Game Boy': 'Nintendo_-_Game_Boy',
  'Game Boy Color': 'Nintendo_-_Game_Boy_Color',
  'Game Boy Advance': 'Nintendo_-_Game_Boy_Advance',
  'Nintendo 64': 'Nintendo_-_Nintendo_64',
  'Master System': 'Sega_-_Master_System_-_Mark_III',
  'Mega Drive': 'Sega_-_Mega_Drive_-_Genesis',
  'Game Gear': 'Sega_-_Game_Gear',
  'PSP': 'Sony_-_PlayStation_Portable',
  'Atari 2600': 'Atari_-_2600',
  'Atari 7800': 'Atari_-_7800',
  'Atari Lynx': 'Atari_-_Lynx',
  'Nintendo DS': 'Nintendo_-_Nintendo_DS',
  'Nintendo 3DS': 'Nintendo_-_Nintendo_3DS',
  'Famicom Disk System': 'Nintendo_-_Family_Computer_Disk_System',
  'PC Engine': 'NEC_-_PC_Engine_-_TurboGrafx_16',
  'NeoGeo Pocket': 'SNK_-_Neo_Geo_Pocket',
  'NeoGeo Pocket Color': 'SNK_-_Neo_Geo_Pocket_Color',
  'Sega 32X': 'Sega_-_32X',
  'SG-1000': 'Sega_-_SG-1000',
};

const getBoxArtUrl = (system, rawName) => {
  const mappedSystem = SYSTEM_THUMB_MAP[system];
  if (!mappedSystem) return null;
  const cleanName = rawName
    .replace(/[&*/:`<>?\\|"]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://raw.githubusercontent.com/libretro-thumbnails/${mappedSystem}/master/Named_Boxarts/${encodeURIComponent(cleanName)}.png`;
};

/* ============================================================
   LAZY ROM CARD — renders only when visible in viewport
   ============================================================ */
const LazyRomCard = ({ rom, onPlay, onFav, isFav, index }) => {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="rom-card glass-panel"
      style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
      onClick={onPlay}
    >
      {isVisible ? (
        <RomCardContent rom={rom} onFav={onFav} isFav={isFav} />
      ) : (
        <RomCardSkeleton />
      )}
    </div>
  );
};

/* Card content — only rendered once visible */
const RomCardContent = ({ rom, onFav, isFav }) => {
  const [imgError, setImgError] = useState(false);
  const boxArtUrl = !imgError ? getBoxArtUrl(rom.system, rom.name) : null;

  return (
    <>
      {boxArtUrl ? (
        <img
          src={boxArtUrl}
          alt={rom.name}
          className="rom-card-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="rom-card-placeholder">
          {getSystemIcon(rom.system)}
        </div>
      )}
      <div className="rom-card-name" title={rom.name}>{rom.name}</div>
      <div className="rom-card-system">{rom.system}</div>
      <div
        className={`rom-card-fav ${isFav ? 'active' : 'inactive'}`}
        onClick={(e) => { e.stopPropagation(); onFav(); }}
      >
        ★
      </div>
    </>
  );
};

/* Skeleton placeholder rendered before visibility */
const RomCardSkeleton = () => (
  <>
    <div className="rom-card-skeleton-cover" />
    <div className="rom-card-skeleton-text" style={{ width: '80%' }} />
    <div className="rom-card-skeleton-text short" style={{ width: '50%' }} />
  </>
);

/* ============================================================
   SYSTEM CARD — themed tile for each console
   ============================================================ */
const SystemCard = ({ systemName, romCount, onClick }) => {
  const meta = SYSTEM_META[systemName] || { icon: <ConsoleIcon system={systemName} />, gradient: 'linear-gradient(135deg, #555, #888)', manufacturer: '?', year: '?' };

  return (
    <div className="system-card" onClick={onClick}>
      <div className="system-card-bg" style={{ background: meta.gradient }} />
      <div className="system-card-content">
        <div className="system-card-icon">{meta.icon}</div>
        <div className="system-card-info">
          <div className="system-card-name">{systemName}</div>
          <div className="system-card-meta">{meta.manufacturer} • {meta.year}</div>
        </div>
        <div className="system-card-count">{romCount} ROMs</div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN APP
   ============================================================ */
function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [core, setCore] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [romDetails, setRomDetails] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Library State
  const [libraryRoms, setLibraryRoms] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('tieFavorites')) || []);
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem('tieRecent')) || []);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  // Phase 9: selected system
  const [selectedSystem, setSelectedSystem] = useState(null);

  // Phase 10: Drag & Drop, Themes
  const [isDragging, setIsDragging] = useState(false);
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('tieTheme') || 'pink');

  const [peerId, setPeerId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [netplayStatus, setNetplayStatus] = useState('DISCONNECTED');
  const [netplayPing, setNetplayPing] = useState(null);
  const [playersCount, setPlayersCount] = useState(1);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  // Global Setup Settings
  const defaultSettings = {
    textureFilter: 'nearest',
    lowLatency: true,
    hapticFeedback: true,
    showFps: true,
    uiScale: 1,
    touchControls: 'auto',
    touchScale: 1.0,
    touchOpacity: 0.5,
    crtFilter: 'none'
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
  const libraryScanner = useMemo(() => new LibraryScanner(), []);
  const coreRef = useRef(null);

  // Initialize
  useEffect(() => {
    inputManager.init();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/TIE/sw.js')
          .then(reg => {
            console.log('SW Registered');
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available, but we'll focus on the "Installed" first
                }
              };
            };
          })
          .catch(err => console.error('SW Registration failed', err));
      });
      
      // Listen for message from SW or just check if it's already active
      navigator.serviceWorker.ready.then(() => {
        // After some time or active use, we can assume precaching is done.
        // For a more robust way, we'd postMessage from SW.
        // For now, let's just show it after a few seconds if it's the first time.
        setTimeout(() => setIsOfflineReady(true), 4000);
      });
    }

    return () => inputManager.cleanup();
  }, [inputManager]);

  useEffect(() => {
    libraryScanner.loadPersistedLibrary().then(roms => {
      if (roms) setLibraryRoms(roms);
    });
  }, [libraryScanner]);

  // Netplay Quick Join Detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && netplayStatus === 'DISCONNECTED') {
      setJoinId(joinCode);
      setActiveTab('netplay');
    }
  }, []);

  const switchTab = (tab) => {
    setIsRunning(false);
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Phase 10: Apply color theme to CSS variables
  useEffect(() => {
    const themes = {
      pink:   { accent: '#ff2e93', secondary: '#00f0ff', glow: 'rgba(255, 46, 147, 0.3)' },
      green:  { accent: '#00e676', secondary: '#76ff03', glow: 'rgba(0, 230, 118, 0.3)' },
      blue:   { accent: '#448aff', secondary: '#18ffff', glow: 'rgba(68, 138, 255, 0.3)' },
      purple: { accent: '#b388ff', secondary: '#ea80fc', glow: 'rgba(179, 136, 255, 0.3)' },
    };
    const t = themes[colorTheme] || themes.pink;
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-secondary', t.secondary);
    document.documentElement.style.setProperty('--accent-glow', t.glow);
    localStorage.setItem('tieTheme', colorTheme);
  }, [colorTheme]);

  // Phase 10: Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      currentRomBuffer.current = { buffer, filename: file.name };
      bootCore(buffer, file.name);
    }
  };

  // Netplay
  useEffect(() => {
    netplayManager.onPeerIdGenerated = (id) => setPeerId(id);
    netplayManager.onPingUpdated = (ping) => setNetplayPing(ping);
    netplayManager.onConnected = () => {
      setNetplayStatus('CONNECTED');
      if (currentRomBuffer.current) {
        bootCore(currentRomBuffer.current.buffer, currentRomBuffer.current.filename);
      }
    };
    netplayManager.onError = () => {
      setNetplayStatus('DISCONNECTED');
      setNetplayPing(null);
    };
    netplayManager.onLobbyUpdated = (count) => setPlayersCount(count);
    netplayManager.onDataReceived = (data) => {
      if (data.type === 'INPUT') {
        inputManager.dispatchRemoteInput(data.playerIndex, data.state);
      }
    };
    return () => netplayManager.disconnect();
  }, [netplayManager]);

  const bootCore = async (buffer, filename) => {
    try {
      const coreInstance = new RetroCore();
      const pIdx = netplayStatus === 'CONNECTED' ? (netplayManager.localPlayerIndex || 0) : 0;
      setCore(coreInstance);
      coreRef.current = coreInstance;
      setRomDetails({ buffer, filename, pIdx });
      setIsRunning(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load Core!");
    }
  };

  // Library Handlers
  const toggleFavorite = (romId) => {
    let nextFavs;
    if (favorites.includes(romId)) {
      nextFavs = favorites.filter(id => id !== romId);
    } else {
      nextFavs = [romId, ...favorites];
    }
    setFavorites(nextFavs);
    localStorage.setItem('tieFavorites', JSON.stringify(nextFavs));
  };

  const addToRecent = (romId) => {
    const nextRecents = [romId, ...recent.filter(id => id !== romId)].slice(0, 8);
    setRecent(nextRecents);
    localStorage.setItem('tieRecent', JSON.stringify(nextRecents));
  };

  const bootCoreFromHandle = async (romItem) => {
    try {
      const buffer = await libraryScanner.getBufferFromHandle(romItem.handle);
      addToRecent(romItem.id);
      currentRomBuffer.current = { buffer, filename: romItem.filename };
      bootCore(buffer, romItem.filename);
    } catch (e) {
      console.error("Failed to read from Handle. Maybe file moved?", e);
      alert("Error reading file! Click Re-Scan Directory.");
    }
  };

  const handleLibraryScan = async () => {
    setIsLibraryLoading(true);
    try {
      const roms = await libraryScanner.pickAndScanDirectory();
      if (roms) setLibraryRoms(roms);
    } catch (e) {
      console.error(e);
      alert("Scan failed: " + e.message);
    }
    setIsLibraryLoading(false);
  };

  const handleLibraryRefresh = async () => {
    setIsLibraryLoading(true);
    try {
      const roms = await libraryScanner.requestPermissionAndLoad();
      if (roms) setLibraryRoms(roms);
      else await handleLibraryScan();
    } catch (e) {
      console.warn(e);
    }
    setIsLibraryLoading(false);
  };

  const handleRomUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    currentRomBuffer.current = { buffer, filename: file.name };
    bootCore(buffer, file.name);
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

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?join=${peerId}`;
    navigator.clipboard.writeText(url);
    // Visual feedback? maybe a toast. For now alert is fine in this MVP.
    alert('Invite link copied! Send it to your friend.');
  };


  /* ============================================================
     COMPUTED: systems derived from scanned ROMs
     ============================================================ */
  const systemsMap = useMemo(() => {
    const map = {};
    libraryRoms.forEach(rom => {
      if (!map[rom.system]) map[rom.system] = [];
      map[rom.system].push(rom);
    });
    // Sort each system's ROMs alphabetically
    for (const sys in map) {
      map[sys].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [libraryRoms]);

  const availableSystems = useMemo(() => {
    return Object.keys(systemsMap).sort((a, b) => {
      // Sort by manufacturer, then by year
      const ma = SYSTEM_META[a]?.manufacturer || 'ZZZ';
      const mb = SYSTEM_META[b]?.manufacturer || 'ZZZ';
      if (ma !== mb) return ma.localeCompare(mb);
      return (SYSTEM_META[a]?.year || '9999').localeCompare(SYSTEM_META[b]?.year || '9999');
    });
  }, [systemsMap]);

  /* ============================================================
     RENDER SECTIONS
     ============================================================ */
  const renderMainContent = () => {
    if (isRunning) {
      return <ConsoleScreen
        core={core}
        romDetails={romDetails}
        isRunning={isRunning}
        inputManager={inputManager}
        netplayManager={netplayManager}
        settings={globalSettings}
        onExit={() => setIsRunning(false)}
      />;
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
                <option value="nearest">Nearest-Neighbor (Sharp) / Standard</option>
                <option value="bilinear">Bilinear (Blurred / Nostalgic)</option>
              </select>
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">Mobile & Touch Controls</h3>
            <div className="setting-row">
              <label>On-Screen Controls Layer</label>
              <select value={globalSettings.touchControls || 'auto'} onChange={(e) => updateSetting('touchControls', e.target.value)} style={{ minWidth: '150px' }}>
                <option value="auto">Auto-detect</option>
                <option value="on">Always On</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div className="setting-row">
              <label>Controls Scale (Size)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '200px' }}>
                <input type="range" min="0.5" max="2" step="0.1" value={globalSettings.touchScale || 1.0} onChange={(e) => updateSetting('touchScale', Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: '0.85rem', width: '30px' }}>{globalSettings.touchScale || 1.0}x</span>
              </div>
            </div>
            <div className="setting-row">
              <label>Controls Opacity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '200px' }}>
                <input type="range" min="0.1" max="1" step="0.1" value={globalSettings.touchOpacity !== undefined ? globalSettings.touchOpacity : 0.5} onChange={(e) => updateSetting('touchOpacity', Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: '0.85rem', width: '30px' }}>{Math.round((globalSettings.touchOpacity !== undefined ? globalSettings.touchOpacity : 0.5) * 100)}%</span>
              </div>
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">Controls Optimization</h3>
            <div className="setting-row">
              <label>Haptic Feedback (Vibration API Rumble Protocol)</label>
              <input type="checkbox" checked={globalSettings.hapticFeedback} onChange={(e) => updateSetting('hapticFeedback', e.target.checked)} />
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">CRT / Shader Filters</h3>
            <div className="setting-row">
              <label>Display Filter</label>
              <select value={globalSettings.crtFilter || 'none'} onChange={(e) => updateSetting('crtFilter', e.target.value)}>
                <option value="none">None (Clean)</option>
                <option value="scanlines">CRT Scanlines</option>
                <option value="phosphor">Phosphor + Vignette</option>
                <option value="curvature">Full CRT (Curvature)</option>
                <option value="lcd">LCD Grid (Handheld)</option>
              </select>
            </div>
            <div className="setting-row">
              <label>Show FPS Counter</label>
              <input type="checkbox" checked={globalSettings.showFps} onChange={(e) => updateSetting('showFps', e.target.checked)} />
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">Color Theme</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { id: 'pink', label: 'Neon Pink', color: '#ff2e93' },
                { id: 'green', label: 'Retro Green', color: '#00e676' },
                { id: 'blue', label: 'Classic Blue', color: '#448aff' },
                { id: 'purple', label: 'Purple Haze', color: '#b388ff' },
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className="theme-swatch"
                  style={{
                    background: colorTheme === theme.id ? theme.color : 'rgba(255,255,255,0.06)',
                    color: colorTheme === theme.id ? '#000' : '#fff',
                    border: `2px solid ${colorTheme === theme.id ? theme.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px',
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }


    if (activeTab === 'netplay') {
      return (
        <div className="netplay-view">
          <div className="screen-icon">🌐</div>
          <h2 className="screen-title">Netplay Lobbies</h2>
          <p className="screen-subtitle" style={{ marginBottom: '2rem' }}>
            Matchmake using low-latency P2P. Both players must load the exact same ROM.
          </p>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', width: '100%', maxWidth: '600px', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '2rem', borderRadius: '12px', textAlign: 'center', minWidth: '250px' }}>
              <h3 style={{ marginTop: 0 }}>Host Session</h3>
              {netplayStatus === 'DISCONNECTED' && (
                <button className="btn-primary" onClick={handleHost} style={{ marginTop: '1rem' }}>Start Hosting</button>
              )}
              {netplayStatus === 'HOSTING' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ color: '#0f0', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Players in Lobby: {playersCount} / 4
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', fontSize: '1.2rem', fontFamily: 'monospace', marginBottom: '1rem', width: '100%', wordBreak: 'break-all', position: 'relative' }}>
                    {peerId || 'Generating...'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button className="btn-primary" onClick={copyInviteLink} style={{ flex: 1, fontSize: '0.85rem' }}>
                      📋 Copy Invite Link
                    </button>
                    <button className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid #ff5e5e', color: '#ff5e5e', fontSize: '0.85rem' }} onClick={handleCancelNetplay}>
                      Cancel Room
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="glass-panel" style={{ flex: 1, padding: '2rem', borderRadius: '12px', textAlign: 'center', minWidth: '250px' }}>
              <h3 style={{ marginTop: 0 }}>Join Session</h3>
              {netplayStatus === 'DISCONNECTED' && (
                <>
                  <input
                    type="text"
                    placeholder="Enter Host ID"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="netplay-input"
                    style={{ 
                      width: '100%', 
                      padding: '0.65rem 1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1rem', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid var(--panel-border)', 
                      color: 'white', 
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
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
        </div>
      );
    }

    /* ============================================================
       LIBRARY TAB — Phase 9: System Menu → Per-System ROM View
       ============================================================ */
    if (activeTab === 'library') {
      // Empty state
      if (libraryRoms.length === 0) {
        return (
          <div className="empty-state">
            <div className="screen-icon">📚</div>
            <h2 className="screen-title">Empty Catalog</h2>
            <p className="screen-subtitle" style={{ marginBottom: '2rem' }}>
              Pick a local folder containing your ROMs. The Library Scanner will organize them beautifully.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleLibraryScan}>
                {isLibraryLoading ? "Scanning..." : "Scan Local Folder & Construct Catalog"}
              </button>
              <input type="file" id="rom-upload" onChange={handleRomUpload} style={{ display: 'none' }} />
              <label htmlFor="rom-upload" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--panel-border)', cursor: 'pointer' }}>
                Load File Temporarily
              </label>
            </div>
          </div>
        );
      }

      /* ---- Per-System ROM View ---- */
      if (selectedSystem) {
        const systemRoms = systemsMap[selectedSystem] || [];
        const filtered = searchQuery
          ? systemRoms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
          : systemRoms;
        const meta = SYSTEM_META[selectedSystem] || {};

        return (
          <div className="library-view">
            {/* Breadcrumb */}
            <nav className="breadcrumb">
              <button className="breadcrumb-link" onClick={() => { setSelectedSystem(null); setSearchQuery(''); }}>
                <span style={{ fontSize: '1.2rem', marginRight: '0.4rem' }}>🏠</span> My Collection
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {getSystemIcon(selectedSystem)} <span style={{ marginLeft: '0.4rem' }}>{selectedSystem}</span>
              </span>
            </nav>

            {/* System header banner */}
            <div className="system-banner" style={{ background: meta.gradient || 'linear-gradient(135deg, #555, #888)' }}>
              <div className="system-banner-icon">{getSystemIcon(selectedSystem)}</div>
              <div className="system-banner-info">
                <h2 className="system-banner-name">{selectedSystem}</h2>
                <p className="system-banner-meta">{meta.manufacturer} • {meta.year} • {systemRoms.length} ROMs</p>
              </div>
            </div>

            {/* Favorites for this system */}
            {(() => {
              const sysFavs = filtered.filter(r => favorites.includes(r.id));
              if (sysFavs.length === 0) return null;
              return (
                <div className="library-category">
                  <h3 className="category-title" style={{ color: 'gold' }}>
                    <span className="system-icon">⭐</span> Favorites
                  </h3>
                  <div className="rom-grid">
                    {sysFavs.map((rom, i) => (
                      <LazyRomCard key={`fav-${rom.id}`} rom={rom} index={i} onPlay={() => bootCoreFromHandle(rom)} onFav={() => toggleFavorite(rom.id)} isFav={true} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* All ROMs — lazy rendered */}
            <div className="library-category" style={{ marginTop: '1.5rem' }}>
              <h3 className="category-title" style={{ color: 'var(--accent)' }}>
                <span className="system-icon">{getSystemIcon(selectedSystem)}</span>
                All Games {filtered.length !== systemRoms.length ? `(${filtered.length} of ${systemRoms.length})` : `(${systemRoms.length})`}
              </h3>
              <div className="rom-grid">
                {filtered.map((rom, i) => (
                  <LazyRomCard key={`rom-${rom.id}`} rom={rom} index={i} onPlay={() => bootCoreFromHandle(rom)} onFav={() => toggleFavorite(rom.id)} isFav={favorites.includes(rom.id)} />
                ))}
              </div>
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ fontSize: '1.2rem' }}>No games match your search.</p>
              </div>
            )}
          </div>
        );
      }

      /* ---- Global Library Search Logic ---- */
      const isSearchActive = searchQuery.length > 0;
      
      const filteredSystems = isSearchActive
        ? availableSystems.filter(sys => {
            const sysMatch = sys.toLowerCase().includes(searchQuery.toLowerCase());
            const romMatch = (systemsMap[sys] || []).some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
            return sysMatch || romMatch;
          })
        : availableSystems;

      const directRomMatches = isSearchActive
        ? libraryRoms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 50)
        : [];

      // Recently played ROMs
      const recentRoms = recent.map(id => libraryRoms.find(r => r.id === id)).filter(Boolean);

      return (
        <div className="library-view">
          <div className="library-header">
            <h2 className="library-header-title">My Collection</h2>
            <div className="library-controls">
              <button className="library-btn" onClick={handleLibraryRefresh}>
                {isLibraryLoading ? "Refreshing..." : "Re-Scan Directory"}
              </button>
              <input type="file" id="rom-upload" onChange={handleRomUpload} style={{ display: 'none' }} />
              <label htmlFor="rom-upload" className="library-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                Instant Load
              </label>
            </div>
          </div>

          {/* Stats bar */}
          <div className="library-stats">
            <span>{availableSystems.length} Systems</span>
            <span className="stats-divider">•</span>
            <span>{libraryRoms.length} ROMs</span>
          </div>

          {/* Search Results (Direct ROM Matches) */}
          {isSearchActive && directRomMatches.length > 0 && (
            <div className="library-category">
              <h3 className="category-title" style={{ color: 'var(--accent)' }}>
                <span className="system-icon">🔍</span> Top Game Matches
              </h3>
              <div className="rom-grid">
                {directRomMatches.map((rom, i) => (
                  <LazyRomCard key={`search-${rom.id}`} rom={rom} index={i} onPlay={() => bootCoreFromHandle(rom)} onFav={() => toggleFavorite(rom.id)} isFav={favorites.includes(rom.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Recent ROMs (quick access, max 8) */}
          {!isSearchActive && recentRoms.length > 0 && (
            <div className="library-category">
              <h3 className="category-title">
                <span className="system-icon">⏱️</span> Recently Played
              </h3>
              <div className="rom-row">
                {recentRoms.map((rom, i) => (
                  <LazyRomCard key={`rec-${rom.id}`} rom={rom} index={i} onPlay={() => bootCoreFromHandle(rom)} onFav={() => toggleFavorite(rom.id)} isFav={favorites.includes(rom.id)} />
                ))}
              </div>
            </div>
          )}

          {/* System Cards Grid */}
          <div className="library-category" style={{ marginTop: (recentRoms.length > 0 || isSearchActive) ? '1.5rem' : '0' }}>
            <h3 className="category-title">
              <span className="system-icon">🎮</span> {isSearchActive ? 'Matched Systems' : 'Choose a System'}
            </h3>
            <div className="system-grid">
              {filteredSystems.map(sys => (
                <SystemCard
                  key={sys}
                  systemName={sys}
                  romCount={systemsMap[sys].length}
                  onClick={() => { setSelectedSystem(sys); setSearchQuery(''); }}
                />
              ))}
            </div>
          </div>

          {(filteredSystems.length === 0 && directRomMatches.length === 0) && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔦</div>
              <p style={{ fontSize: '1.2rem' }}>No games or systems match your search.</p>
            </div>
          )}
        </div>
      );
    }
    
    if (activeTab === 'patcher') {
      return (
        <GamePatcher 
          onPlayPatchedRom={(buffer, filename) => {
            currentRomBuffer.current = { buffer, filename };
            bootCore(buffer, filename);
          }}
        />
      );
    }

    if (activeTab === 'about') {
      return (
        <div className="settings-container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎮</div>
            <h2 className="screen-title">TIE</h2>
            <p className="screen-subtitle">The Interconnected Emulator</p>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">About</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              TIE is a professional-grade, browser-based emulation frontend supporting 20+ retro gaming systems.
              Built with React, Nostalgist.js (Libretro WASM cores), and WebRTC for real-time P2P multiplayer.
            </p>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                '📚 Library Scanner with Box Art',
                '🌐 Netplay P2P (4 Players)',
                '💾 10 Save State Slots',
                '📸 Screenshot Capture',
                '⏩ Fast Forward',
                '🔊 Volume & Audio Controls',
                '🖥️ CRT / Scanline Filters',
                '⌨️ Custom Key Remapping',
                '📱 Touch/Gamepad Controls',
                '🎨 4 Color Themes',
                '🔑 Cheat Code Input',
                '📂 Drag & Drop ROM Loading',
              ].map((feat, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {feat}
                </div>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <h3 className="settings-header">Tech Stack</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['React', 'Vite', 'Nostalgist.js', 'Libretro WASM', 'WebRTC', 'PeerJS', 'IndexedDB', 'Web Audio API'].map(t => (
                <span key={t} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="settings-section" style={{ textAlign: 'center' }}>
            <h3 className="settings-header">Credits</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Made by <strong style={{ color: '#fff' }}>JosuSM</strong><br />
              Powered by <a href="https://nostalgist.js.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Nostalgist.js</a> &
              <a href="https://www.retroarch.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}> RetroArch</a><br />
              Box Art from <a href="https://github.com/libretro-thumbnails" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>libretro-thumbnails</a>
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="app-container">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {isOfflineReady && (
        <div className="offline-ready-toast glass-panel" onClick={() => setIsOfflineReady(false)}>
          <span>📶</span> Ready for offline play!
        </div>
      )}

      <aside className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">TIE</div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '-1rem' }}>
          <a href="https://josusm.github.io" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'opacity 0.2s', fontWeight: '500' }}>
            ← Voltar ao Portfólio
          </a>
        </div>

        <div className="nav-label">Main</div>
        <div className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'library' && !isRunning ? 'active' : ''}`}
            onClick={() => { switchTab('library'); setSelectedSystem(null); }}
          >
            🎮 Games Library
          </button>
          <button
            className={`nav-item ${activeTab === 'netplay' && !isRunning ? 'active' : ''}`}
            onClick={() => switchTab('netplay')}
          >
            🌐 Netplay Lobbies
          </button>
        </div>


        <div className="nav-label">Tools</div>
        <div className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'patcher' && !isRunning ? 'active' : ''}`}
            onClick={() => switchTab('patcher')}
          >
            🪄 Game Patcher
          </button>
        </div>

        <div className="nav-label">Settings</div>
        <div className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'settings' && !isRunning ? 'active' : ''}`}
            onClick={() => switchTab('settings')}
          >
            ⚙️ Display & Perf.
          </button>
        </div>

        <div className="nav-label" style={{ marginTop: 'auto' }}>Info</div>
        <div className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'about' && !isRunning ? 'active' : ''}`}
            onClick={() => switchTab('about')}
          >
            ℹ️ About / Credits
          </button>
        </div>
      </aside>

      <main className={`main-content ${isRunning ? 'is-running' : ''}`}>
        <header className="header glass-panel">
          <button
            className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>

          <div className="search-bar">
            {activeTab === 'library' && !isRunning && (
              <div className="search-wrapper">
                <input
                  className="search-input"
                  type="text"
                  placeholder={selectedSystem ? `Search in ${selectedSystem}...` : "Search systems & games..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
            )}
          </div>
          <div className="user-status">
            <span className={`status-dot ${netplayStatus === 'CONNECTED' ? 'connected' : ''}`}></span>
            <span>{netplayStatus === 'CONNECTED' ? 'Netplay Online' : 'Local Instance'}</span>
            {netplayPing !== null && (
              <span style={{ fontSize: '0.8rem', color: netplayPing < 50 ? '#0f0' : (netplayPing < 100 ? '#ff0' : '#f00'), background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {netplayPing}ms
              </span>
            )}
          </div>
        </header>

        <section
          className="screen-container glass-panel"
          style={{ overflow: 'hidden' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!isRunning && <div className="grid-bg"></div>}

          {/* Drag & Drop Overlay */}
          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📂</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Drop ROM to Play</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>.nes, .sfc, .gba, .gb, .md, .sms ...</div>
              </div>
            </div>
          )}

          <div className="screen-content" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {renderMainContent()}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

