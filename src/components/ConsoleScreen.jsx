import { useEffect, useRef, useState } from 'react';
import './ConsoleScreen.css';

export function ConsoleScreen({ core, isRunning, inputManager, netplayManager, settings }) {
  const canvasRef = useRef(null);
  const rafId = useRef(null);
  
  const [fps, setFps] = useState(0);
  const framesRendered = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    if (!core || !isRunning || !inputManager) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use desynchronized API for reduced latency if requested
    const ctx = canvas.getContext('2d', { desynchronized: settings?.lowLatency, willReadFrequently: true });
    
    // Core Engine Loop
    const step = () => {
      inputManager.pollGamepads();
      
      const isNetplay = netplayManager && netplayManager.connection;
      const localPlayerIndex = isNetplay ? (netplayManager.isHost ? 0 : 1) : 0;
      
      const localInput = inputManager.getState(localPlayerIndex);
      core.setControllerState(localPlayerIndex, localInput);
      
      // Haptic Feedback interceptor
      if (settings?.hapticFeedback && navigator.vibrate) {
         if (Object.values(localInput).some(v => v === 1)) {
            navigator.vibrate(10); // Very short 10ms micro-rumble
         }
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
      }
      
      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [core, isRunning, inputManager, netplayManager, settings]);

  return (
    <div className="console-wrapper" style={{ position: 'relative' }}>
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
      
      {settings?.showFps && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#00f0ff', fontFamily: 'monospace', textShadow: '1px 1px 0 #000', zIndex: 10 }}>
           FPS: {fps}
        </div>
      )}
    </div>
  );
}
