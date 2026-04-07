import { useEffect, useRef, useState, useCallback } from 'react';
import './ConsoleScreen.css';
import { OnScreenGamepad } from './OnScreenGamepad';
import { InGameMenu } from './InGameMenu';
import { CrtFilters } from './CrtFilters';

export function ConsoleScreen({ core, romDetails, isRunning, inputManager, netplayManager, settings, onExit }) {
  const canvasRef = useRef(null);
  const rafId = useRef(null);
  const renderStarted = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [memory, setMemory] = useState(0);
  const framesRendered = useRef(0);
  const lastTime = useRef(performance.now());
  const frameStart = useRef(0);

  // Audio state
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('tieVolume');
    return saved !== null ? Number(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const audioGainRef = useRef(null);

  // Fast Forward state
  const [isFastForward, setIsFastForward] = useState(false);

  // CRT filter from settings
  const crtFilter = settings?.crtFilter || 'none';

  // Persist volume
  useEffect(() => {
    localStorage.setItem('tieVolume', String(volume));
  }, [volume]);

  // Audio control: try to find and control the Web Audio gain node
  useEffect(() => {
    if (!core?.isNostalgist || !core.nostalgist) return;

    // Attempt to hook into the AudioContext after a short delay
    const timeout = setTimeout(() => {
      try {
        const audioCtx = core.nostalgist?.getEmscriptenModule?.()?.SDL2?.audioContext
          || window._retroArchAudioCtx;
        if (audioCtx) {
          // If there's already a gain node, reuse it
          if (!audioGainRef.current) {
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            // Redirect the audio source through our gain node
            audioGainRef.current = gainNode;
          }
        }
      } catch (e) {
        // Audio context not available, volume control is best-effort
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [core]);

  // Apply volume/mute changes
  useEffect(() => {
    if (audioGainRef.current) {
      audioGainRef.current.gain.value = isMuted ? 0 : volume;
    }
    // Fallback: try to control all audio/video elements on the page
    document.querySelectorAll('audio, video').forEach(el => {
      el.volume = isMuted ? 0 : volume;
      el.muted = isMuted;
    });
  }, [volume, isMuted]);

  // Main render loop
  useEffect(() => {
    if (!core || !isRunning || !inputManager) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // NOSTALGIST EXECUTION PIPELINE
    if (core.isNostalgist) {
      if (!renderStarted.current && romDetails) {
        renderStarted.current = true;
        core.loadROM(romDetails.buffer, romDetails.filename, canvas, romDetails.pIdx || 0).then(() => {
          if (romDetails.autoLoadState) {
            console.log("Applying auto-load state...");
            core.loadState(romDetails.autoLoadState);
          }
        }).catch(e => console.error(e));
      }

      let lastInputStr = "";
      const nostalgistStep = () => {
        frameStart.current = performance.now();
        inputManager.pollGamepads();
        const pIdx = romDetails.pIdx || 0;
        const localInput = inputManager.getState(pIdx);

        if (settings?.hapticFeedback && navigator.vibrate) {
          if (Object.values(localInput).some(v => v === 1)) navigator.vibrate(10);
        }

        if (netplayManager && (netplayManager.isHost || netplayManager.activeConnection)) {
          const currentInputStr = JSON.stringify(localInput);
          if (currentInputStr !== lastInputStr) {
            netplayManager.sendInput(localInput);
            lastInputStr = currentInputStr;
          }
        }
        
        framesRendered.current++;
        const now = performance.now();
        if (now - lastTime.current >= 1000) {
          setFps(framesRendered.current);
          framesRendered.current = 0;
          lastTime.current = now;
          if (performance.memory) {
            setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
          }
        }
        setFrameTime((now - frameStart.current).toFixed(2));

        rafId.current = requestAnimationFrame(nostalgistStep);
      };
      rafId.current = requestAnimationFrame(nostalgistStep);

      return () => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        if (core) core.exit();
      };
    }

    // STANDARD EXECUTION PIPELINE (DummyCore or others)
    const ctx = canvas.getContext('2d', { desynchronized: settings?.lowLatency, willReadFrequently: true });

    const step = () => {
      frameStart.current = performance.now();
      inputManager.pollGamepads();
      const isNetplay = netplayManager && netplayManager.connection;
      const localPlayerIndex = isNetplay ? (netplayManager.isHost ? 0 : 1) : 0;
      const localInput = inputManager.getState(localPlayerIndex);
      core.setControllerState(localPlayerIndex, localInput);

      if (settings?.hapticFeedback && navigator.vibrate) {
        if (Object.values(localInput).some(v => v === 1)) navigator.vibrate(10);
      }

      if (isNetplay) {
        netplayManager.sendInput(localInput);
      } else {
        core.setControllerState(1, inputManager.getState(1));
      }

      core.runFrame();
      core.render(ctx);

      framesRendered.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(framesRendered.current);
        framesRendered.current = 0;
        lastTime.current = now;
        if (performance.memory) {
            setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
        }
      }
      setFrameTime((now - frameStart.current).toFixed(2));

      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [core, isRunning, inputManager, netplayManager, settings, romDetails]);

  // ESC to open menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape' && !isMenuOpen) {
        setIsMenuOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const showTouch = settings?.touchControls === 'on' ||
    (settings?.touchControls === 'auto' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  // CRT filter CSS class
  const crtClass = crtFilter !== 'none' ? `crt-${crtFilter}` : '';

  return (
    <div className={`console-wrapper ${crtClass}`} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CrtFilters />
      
      {/* Shadow Mask Overlay for CRT Modes */}
      {crtFilter !== 'none' && crtFilter !== 'lcd' && (
        <div className="crt-overlay shadow-mask" style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none', background: 'url("#shadowmask")', opacity: 0.05 }}></div>
      )}

      <canvas
        ref={canvasRef}
        width={core?.width || 320}
        height={core?.height || 240}
        className="console-canvas"
        style={{
          imageRendering: settings?.textureFilter === 'nearest' ? 'pixelated' : 'auto',
          transform: `scale(${settings?.uiScale || 1})`,
          transformOrigin: 'center'
        }}
      ></canvas>

      {showTouch && (
        <OnScreenGamepad
          inputManager={inputManager}
          scale={settings?.touchScale || 1}
          opacity={settings?.touchOpacity !== undefined ? settings?.touchOpacity : 0.5}
          systemName={core?.systemName}
          hapticFeedback={settings?.hapticFeedback}
        />
      )}

      {/* HUD Overlays */}
      <div className="hud-overlays">
        {settings?.showFps && (
          <div className="hud-performance glass-panel">
            <div className="perf-item"><span className="perf-label">FPS</span> {fps}</div>
            <div className="perf-item"><span className="perf-label">TIME</span> {frameTime}ms</div>
            {memory > 0 && <div className="perf-item"><span className="perf-label">MEM</span> {memory}MB</div>}
          </div>
        )}
        {isFastForward && (
          <div className="hud-ff">⏩ FF</div>
        )}
        {isMuted && (
          <div className="hud-muted">🔇</div>
        )}
      </div>

      {/* Pop-up In-Game Menu overlay */}
      {isMenuOpen && (
        <InGameMenu
          core={core}
          onClose={() => setIsMenuOpen(false)}
          onExitGame={onExit}
          settings={settings}
          canvasRef={canvasRef}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isFastForward={isFastForward}
          setIsFastForward={setIsFastForward}
          inputManager={inputManager}
        />
      )}
    </div>
  );
}
