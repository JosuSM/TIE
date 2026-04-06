import { useState, useEffect } from 'react';
import * as idb from 'idb-keyval';
import './InGameMenu.css';

const SLOT_COUNT = 10;

/* ============================================================
   PER-SYSTEM BUTTON LAYOUTS — only show buttons relevant to the core
   ============================================================ */
const SYSTEM_BUTTONS = {
  // NES / Famicom
  fceumm:     { name: 'NES',           dpad: true, buttons: ['a','b'],             meta: ['start','select'] },
  nestopia:   { name: 'Famicom (FDS)', dpad: true, buttons: ['a','b'],             meta: ['start','select'] },
  // SNES
  snes9x:     { name: 'SNES',          dpad: true, buttons: ['a','b','x','y'],     meta: ['start','select'], shoulders: ['l','r'] },
  // Game Boy / GBC
  gambatte:   { name: 'Game Boy',      dpad: true, buttons: ['a','b'],             meta: ['start','select'] },
  // GBA
  mgba:       { name: 'GBA',           dpad: true, buttons: ['a','b'],             meta: ['start','select'], shoulders: ['l','r'] },
  // N64
  mupen64plus_next: { name: 'Nintendo 64', dpad: true, buttons: ['a','b'],         meta: ['start'],         shoulders: ['l','r'] },
  // Mega Drive / Master System / Game Gear
  genesis_plus_gx: { name: 'Mega Drive', dpad: true, buttons: ['a','b','x'],       meta: ['start'] },
  // 32X
  picodrive:  { name: 'Sega 32X',      dpad: true, buttons: ['a','b','x'],         meta: ['start'] },
  // Neo Geo Pocket
  mednafen_ngp: { name: 'NeoGeo Pocket', dpad: true, buttons: ['a','b'],           meta: ['start'] },
  // PC Engine
  mednafen_pce_fast: { name: 'PC Engine', dpad: true, buttons: ['a','b'],          meta: ['start','select'] },
  // Atari 2600 (only 1 fire button)
  stella:     { name: 'Atari 2600',     dpad: true, buttons: ['a'],                meta: ['select'] },
  // Atari 7800
  prosystem:  { name: 'Atari 7800',     dpad: true, buttons: ['a','b'],            meta: [] },
  // Atari Lynx
  handy:      { name: 'Atari Lynx',     dpad: true, buttons: ['a','b'],            meta: ['start'] },
  // DS
  melonds:    { name: 'Nintendo DS',    dpad: true, buttons: ['a','b','x','y'],     meta: ['start','select'], shoulders: ['l','r'] },
  // 3DS
  citra:      { name: 'Nintendo 3DS',   dpad: true, buttons: ['a','b','x','y'],     meta: ['start','select'], shoulders: ['l','r'] },
  // PSP
  ppsspp:     { name: 'PSP',            dpad: true, buttons: ['a','b','x','y'],     meta: ['start','select'], shoulders: ['l','r'] },
  // SG-1000
  gearsystem: { name: 'SG-1000',       dpad: true, buttons: ['a','b'],             meta: ['start'] },
};

const FALLBACK_LAYOUT = { name: 'Generic', dpad: true, buttons: ['a','b','x','y'], meta: ['start','select'], shoulders: ['l','r'] };

const BUTTON_LABELS = {
  up: '↑ Up', down: '↓ Down', left: '← Left', right: '→ Right',
  a: 'A', b: 'B', x: 'X', y: 'Y',
  start: 'Start', select: 'Select',
  l: 'L / LB', r: 'R / RB',
};

function getLayoutForCore(coreName) {
  if (!coreName) return FALLBACK_LAYOUT;
  // Extract core name from systemName like "Emulating with FCEUMM"
  const clean = coreName.replace('Emulating with ', '').toLowerCase();
  return SYSTEM_BUTTONS[clean] || FALLBACK_LAYOUT;
}

function getAllActionsForLayout(layout) {
  const actions = [];
  if (layout.dpad) actions.push('up', 'down', 'left', 'right');
  actions.push(...(layout.buttons || []));
  if (layout.shoulders) actions.push(...layout.shoulders);
  actions.push(...(layout.meta || []));
  return actions;
}

export function InGameMenu({ core, onClose, onExitGame, settings, updateSetting, canvasRef, volume, setVolume, isMuted, setIsMuted, isFastForward, setIsFastForward, inputManager }) {
  const [activeTab, setActiveTab] = useState('actions');
  const [slots, setSlots] = useState([]);
  const [savingSlot, setSavingSlot] = useState(null);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [cheatInput, setCheatInput] = useState('');
  const [cheatsApplied, setCheatsApplied] = useState([]);
  const [mappingAction, setMappingAction] = useState(null);

  // Load saved slot metadata
  useEffect(() => {
    loadSlotMeta();
  }, []);

  const loadSlotMeta = async () => {
    const meta = await idb.get('tieSaveSlotsMeta') || [];
    setSlots(meta);
  };

  // Close menu on ESC (only if not remapping)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mappingAction) {
        e.preventDefault();
        inputManager?.remapKey(mappingAction, e.code);
        setMappingAction(null);
        return;
      }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, mappingAction, inputManager]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  /* ============ SAVE STATE SLOTS ============ */
  const saveToSlot = async (slotIndex) => {
    if (!core?.isNostalgist || !core.nostalgist) return;
    setSavingSlot(slotIndex);
    try {
      const result = await core.nostalgist.saveState();
      await idb.set(`tieSaveSlot_${slotIndex}`, result.state);
      const meta = await idb.get('tieSaveSlotsMeta') || Array(SLOT_COUNT).fill(null);
      meta[slotIndex] = {
        timestamp: Date.now(),
        date: new Date().toLocaleString('pt-PT'),
      };
      await idb.set('tieSaveSlotsMeta', meta);
      setSlots([...meta]);
    } catch (e) {
      alert('Failed to save state.');
      console.error(e);
    }
    setSavingSlot(null);
  };

  const loadFromSlot = async (slotIndex) => {
    if (!core?.isNostalgist || !core.nostalgist) return;
    setLoadingSlot(slotIndex);
    try {
      const state = await idb.get(`tieSaveSlot_${slotIndex}`);
      if (state) {
        await core.nostalgist.loadState(state);
        setTimeout(onClose, 500);
      } else {
        alert('Empty slot!');
      }
    } catch (e) {
      alert('Failed to load state.');
      console.error(e);
    }
    setLoadingSlot(null);
  };

  /* ============ SCREENSHOT ============ */
  const doScreenshot = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `tie_screenshot_${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error('Screenshot failed', e);
    }
  };

  /* ============ EXPORT / IMPORT ============ */
  const doExportState = async () => {
    if (!core?.isNostalgist || !core.nostalgist) return;
    try {
      const result = await core.nostalgist.saveState();
      const url = URL.createObjectURL(result.state);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tie_save_${Date.now()}.state`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleImportState = async (e) => {
    const file = e.target.files[0];
    if (file && core?.isNostalgist && core.nostalgist) {
      try {
        await core.nostalgist.loadState(file);
        setTimeout(onClose, 800);
      } catch (err) {
        alert('Failed to import state.');
        console.error(err);
      }
    }
  };

  /* ============ CHEATS ============ */
  const applyCheat = () => {
    if (!cheatInput.trim()) return;
    setCheatsApplied(prev => [...prev, cheatInput.trim()]);
    setCheatInput('');
  };

  /* ============ LAYOUT DETECTION ============ */
  const layout = getLayoutForCore(core?.systemName);
  const allActions = getAllActionsForLayout(layout);

  /* ============ TABS ============ */
  const tabs = [
    { id: 'actions', label: '⚡ Actions' },
    { id: 'controls', label: '🎮 Controls' },
    { id: 'saves', label: '💾 Saves' },
    { id: 'audio', label: '🔊 Audio' },
    { id: 'cheats', label: '🔑 Cheats' },
  ];

  return (
    <div className="ingame-menu-overlay" onClick={onClose}>
      <div className="ingame-menu-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="menu-header">
          <h2>⚙️ Quick Menu</h2>
          <button className="menu-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tab Bar */}
        <div className="menu-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`menu-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="menu-tab-content">
          {/* === ACTIONS TAB === */}
          {activeTab === 'actions' && (
            <div className="menu-grid">
              <button className="menu-btn" onClick={toggleFullscreen}>
                <span className="menu-btn-icon">🔲</span>
                Toggle Fullscreen
              </button>
              <button className="menu-btn" onClick={doScreenshot}>
                <span className="menu-btn-icon">📸</span>
                Screenshot
              </button>
              <button
                className={`menu-btn ${isFastForward ? 'active-toggle' : ''}`}
                onClick={() => setIsFastForward?.(!isFastForward)}
              >
                <span className="menu-btn-icon">⏩</span>
                {isFastForward ? 'Fast Forward ON' : 'Fast Forward'}
              </button>
              <button className="menu-btn" onClick={doExportState}>
                <span className="menu-btn-icon">💾</span>
                Export Save
              </button>
              <label className="menu-btn" style={{ cursor: 'pointer' }}>
                <span className="menu-btn-icon">📂</span>
                Import Save
                <input type="file" onChange={handleImportState} style={{ display: 'none' }} accept=".state" />
              </label>
              <button className="menu-btn danger" onClick={onExitGame}>
                <span className="menu-btn-icon">🛑</span>
                Close Game
              </button>
            </div>
          )}

          {/* === CONTROLS TAB (per-system) === */}
          {activeTab === 'controls' && (
            <div className="controls-panel">
              <div className="controls-header-info">
                <span className="controls-system-badge">{layout.name}</span>
                <span className="controls-hint">Click a button, then press the key you want to bind.</span>
              </div>

              {mappingAction && (
                <div className="mapping-prompt">
                  Press any key for <strong>{BUTTON_LABELS[mappingAction] || mappingAction}</strong>...
                </div>
              )}

              {/* D-Pad */}
              {layout.dpad && (
                <div className="controls-group">
                  <div className="controls-group-label">D-Pad</div>
                  <div className="controls-grid">
                    {['up', 'down', 'left', 'right'].map(action => (
                      <div key={action} className="control-row">
                        <span className="control-label">{BUTTON_LABELS[action]}</span>
                        <button
                          className={`control-bind-btn ${mappingAction === action ? 'listening' : ''}`}
                          onClick={() => setMappingAction(action)}
                        >
                          {mappingAction === action ? '...' : inputManager?.getButtonName(action) || 'UNBOUND'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {layout.buttons?.length > 0 && (
                <div className="controls-group">
                  <div className="controls-group-label">Buttons</div>
                  <div className="controls-grid">
                    {layout.buttons.map(action => (
                      <div key={action} className="control-row">
                        <span className="control-label">{BUTTON_LABELS[action] || action.toUpperCase()}</span>
                        <button
                          className={`control-bind-btn ${mappingAction === action ? 'listening' : ''}`}
                          onClick={() => setMappingAction(action)}
                        >
                          {mappingAction === action ? '...' : inputManager?.getButtonName(action) || 'UNBOUND'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shoulders */}
              {layout.shoulders?.length > 0 && (
                <div className="controls-group">
                  <div className="controls-group-label">Shoulders</div>
                  <div className="controls-grid">
                    {layout.shoulders.map(action => (
                      <div key={action} className="control-row">
                        <span className="control-label">{BUTTON_LABELS[action] || action.toUpperCase()}</span>
                        <button
                          className={`control-bind-btn ${mappingAction === action ? 'listening' : ''}`}
                          onClick={() => setMappingAction(action)}
                        >
                          {mappingAction === action ? '...' : inputManager?.getButtonName(action) || 'UNBOUND'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta buttons */}
              {layout.meta?.length > 0 && (
                <div className="controls-group">
                  <div className="controls-group-label">System</div>
                  <div className="controls-grid">
                    {layout.meta.map(action => (
                      <div key={action} className="control-row">
                        <span className="control-label">{BUTTON_LABELS[action] || action.toUpperCase()}</span>
                        <button
                          className={`control-bind-btn ${mappingAction === action ? 'listening' : ''}`}
                          onClick={() => setMappingAction(action)}
                        >
                          {mappingAction === action ? '...' : inputManager?.getButtonName(action) || 'UNBOUND'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === SAVE SLOTS TAB === */}
          {activeTab === 'saves' && (
            <div className="save-slots-container">
              {Array.from({ length: SLOT_COUNT }, (_, i) => {
                const slot = slots[i];
                const isEmpty = !slot;
                return (
                  <div key={i} className={`save-slot ${isEmpty ? 'empty' : 'filled'}`}>
                    <div className="save-slot-info">
                      <span className="save-slot-number">Slot {i + 1}</span>
                      <span className="save-slot-date">
                        {isEmpty ? 'Empty' : slot.date}
                      </span>
                    </div>
                    <div className="save-slot-actions">
                      <button
                        className="slot-btn save"
                        onClick={() => saveToSlot(i)}
                        disabled={savingSlot === i}
                      >
                        {savingSlot === i ? '...' : 'Save'}
                      </button>
                      <button
                        className="slot-btn load"
                        onClick={() => loadFromSlot(i)}
                        disabled={isEmpty || loadingSlot === i}
                      >
                        {loadingSlot === i ? '...' : 'Load'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* === AUDIO TAB === */}
          {activeTab === 'audio' && (
            <div className="audio-controls">
              <div className="audio-row">
                <label>Volume</label>
                <div className="audio-slider-group">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : (volume ?? 1)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume?.(v);
                      if (v > 0 && isMuted) setIsMuted?.(false);
                    }}
                    className="volume-slider"
                  />
                  <span className="volume-value">{isMuted ? '0' : Math.round((volume ?? 1) * 100)}%</span>
                </div>
              </div>
              <div className="audio-row">
                <label>Mute</label>
                <button
                  className={`mute-toggle ${isMuted ? 'muted' : ''}`}
                  onClick={() => setIsMuted?.(!isMuted)}
                >
                  {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
                </button>
              </div>
            </div>
          )}

          {/* === CHEATS TAB === */}
          {activeTab === 'cheats' && (
            <div className="cheats-panel">
              <p className="cheats-info">
                Enter GameGenie / GameShark codes. Note: compatibility depends on the emulator core.
              </p>
              <div className="cheat-input-row">
                <input
                  type="text"
                  className="cheat-input"
                  placeholder="e.g. SXIOPO or 0100D5DA"
                  value={cheatInput}
                  onChange={(e) => setCheatInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyCheat()}
                />
                <button className="slot-btn save" onClick={applyCheat}>Add</button>
              </div>
              {cheatsApplied.length > 0 && (
                <div className="cheats-list">
                  {cheatsApplied.map((code, i) => (
                    <div key={i} className="cheat-item">
                      <span className="cheat-code">{code}</span>
                      <button
                        className="cheat-remove"
                        onClick={() => setCheatsApplied(prev => prev.filter((_, idx) => idx !== i))}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
