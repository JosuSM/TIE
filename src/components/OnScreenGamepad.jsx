import { useRef, useCallback } from 'react';
import './OnScreenGamepad.css';

export function OnScreenGamepad({ inputManager, scale = 1, opacity = 0.5, systemName, hapticFeedback }) {
  
  const dpadRef = useRef(null);
  const activeDpadZones = useRef({ up: false, down: false, left: false, right: false });

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handleActionTouch = (button, isPressed) => (e) => {
    e.preventDefault();
    if (isPressed) triggerHaptic();
    if (inputManager) inputManager.setTouchButton(button, isPressed);
  };

  const updateDpadState = useCallback((x, y) => {
    if (!dpadRef.current || !inputManager) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize coordinates relative to center
    const dx = x - centerX;
    const dy = y - centerY;
    
    // Threshold to prevent misclicks (deadzone in the center)
    const deadzone = (rect.width / 2) * 0.25; 
    
    const nextZones = {
      up: dy < -deadzone,
      down: dy > deadzone,
      left: dx < -deadzone,
      right: dx > deadzone
    };

    // If there is a change, trigger haptic if newly pressed and send to InputManager
    let changed = false;
    ['up', 'down', 'left', 'right'].forEach(dir => {
      if (nextZones[dir] !== activeDpadZones.current[dir]) {
        changed = true;
        inputManager.setTouchButton(dir, nextZones[dir]);
        activeDpadZones.current[dir] = nextZones[dir];
      }
    });

    if (changed && Object.values(nextZones).some(val => val)) {
       triggerHaptic();
    }
  }, [inputManager, triggerHaptic]);

  const handleDpadTouch = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      // Find the touch associated with the dpad container
      let touch = Array.from(e.touches).find(t => {
        return t.target.closest('.dpad-container');
      });
      // Fallback
      if (!touch) touch = e.touches[0]; 
      
      if (touch) updateDpadState(touch.clientX, touch.clientY);
    }
  }, [updateDpadState]);

  const handleDpadEnd = useCallback((e) => {
    e.preventDefault();
    // Reset all dpad inputs
    activeDpadZones.current = { up: false, down: false, left: false, right: false };
    if (inputManager) {
      inputManager.setTouchButton('up', false);
      inputManager.setTouchButton('down', false);
      inputManager.setTouchButton('left', false);
      inputManager.setTouchButton('right', false);
    }
  }, [inputManager]);

  const handleDpadMouse = useCallback((e) => {
    if (e.buttons === 1) { // Left click held
      updateDpadState(e.clientX, e.clientY);
    }
  }, [updateDpadState]);

  const needsShoulders = systemName && ['MGBA', 'SNES9X', 'MUPEN64PLUS_NEXT', 'PPSSPP', 'PICODRIVE'].some(kw => systemName.includes(kw));

  return (
    <div 
      className="on-screen-gamepad" 
      style={{ '--scale': scale, opacity: opacity }}
    >
      {needsShoulders && (
        <div className="shoulder-buttons">
          <button 
            className="action-btn shoulder l" 
            onTouchStart={handleActionTouch('l', true)} 
            onTouchEnd={handleActionTouch('l', false)}
            onMouseDown={handleActionTouch('l', true)}
            onMouseUp={handleActionTouch('l', false)}
            onMouseLeave={handleActionTouch('l', false)}
          >L</button>
          <button 
            className="action-btn shoulder r" 
            onTouchStart={handleActionTouch('r', true)} 
            onTouchEnd={handleActionTouch('r', false)}
            onMouseDown={handleActionTouch('r', true)}
            onMouseUp={handleActionTouch('r', false)}
            onMouseLeave={handleActionTouch('r', false)}
          >R</button>
        </div>
      )}

      <div 
        className="dpad-container"
        ref={dpadRef}
        onTouchStart={handleDpadTouch}
        onTouchMove={handleDpadTouch}
        onTouchEnd={handleDpadEnd}
        onMouseDown={handleDpadMouse}
        onMouseMove={handleDpadMouse}
        onMouseUp={handleDpadEnd}
        onMouseLeave={handleDpadEnd}
      >
        <div className="dpad-visual">
          <div className="dpad-branch vertical"></div>
          <div className="dpad-branch horizontal"></div>
        </div>
      </div>

      <div className="middle-buttons">
        <button 
          className="action-btn pill select" 
          onTouchStart={handleActionTouch('select', true)} 
          onTouchEnd={handleActionTouch('select', false)}
          onMouseDown={handleActionTouch('select', true)}
          onMouseUp={handleActionTouch('select', false)}
          onMouseLeave={handleActionTouch('select', false)}
        >SEL</button>
        <button 
          className="action-btn pill start" 
          onTouchStart={handleActionTouch('start', true)} 
          onTouchEnd={handleActionTouch('start', false)}
          onMouseDown={handleActionTouch('start', true)}
          onMouseUp={handleActionTouch('start', false)}
          onMouseLeave={handleActionTouch('start', false)}
        >START</button>
      </div>

      <div className="action-buttons">
        <button 
          className="action-btn round b" 
          onTouchStart={handleActionTouch('b', true)} 
          onTouchEnd={handleActionTouch('b', false)}
          onMouseDown={handleActionTouch('b', true)}
          onMouseUp={handleActionTouch('b', false)}
          onMouseLeave={handleActionTouch('b', false)}
        >B</button>
        <button 
          className="action-btn round a" 
          onTouchStart={handleActionTouch('a', true)} 
          onTouchEnd={handleActionTouch('a', false)}
          onMouseDown={handleActionTouch('a', true)}
          onMouseUp={handleActionTouch('a', false)}
          onMouseLeave={handleActionTouch('a', false)}
        >A</button>
      </div>
    </div>
  );
}
