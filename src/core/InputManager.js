export class InputManager {
  constructor() {
    this.keys = {};
    this.gamepads = [];

    // Default universal keyboard mapping mapped to abstract emulator positions
    const defaultMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyZ: 'a',
      KeyX: 'b',
      Enter: 'start',
      ShiftRight: 'select',
      // Player 2 Map
      KeyW: 'up2',
      KeyS: 'down2',
      KeyA: 'left2',
      KeyD: 'right2',
      KeyJ: 'a2',
      KeyK: 'b2',
      Digit1: 'start2',
      Digit2: 'select2'
    };

    // Load custom user map from HTML5 localStorage if it exists
    const saved = localStorage.getItem('tieKeyBinding');
    this.keyMap = saved ? JSON.parse(saved) : defaultMap;
    
    // Abstract Controller Initializer
    this.controllerState = [
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0, l: 0, r: 0 }, // Player 1
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0, l: 0, r: 0 }  // Player 2
    ];
    
    // Mobile Touch State
    this.touchState = [
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0, l: 0, r: 0 }
    ];
  }

  init() {
    this.handleKeyDown = (e) => { this.keys[e.code] = true; };
    this.handleKeyUp = (e) => { this.keys[e.code] = false; };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad dynamically connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id,
        e.gamepad.buttons.length, e.gamepad.axes.length);
    });
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  getButtonName(action) {
    const key = Object.keys(this.keyMap).find(k => this.keyMap[k] === action);
    return key ? key.replace('Key', '').replace('Arrow', '') : 'UNBOUND';
  }

  remapKey(action, keyCode) {
    for (const [key, mappedAction] of Object.entries(this.keyMap)) {
      if (mappedAction === action) delete this.keyMap[key];
    }
    this.keyMap[keyCode] = action;
    localStorage.setItem('tieKeyBinding', JSON.stringify(this.keyMap));
  }

  pollGamepads() {
    this.gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  }

  setTouchButton(button, isPressed) {
    const newState = isPressed ? 1 : 0;
    if (this.touchState[0][button] !== undefined && this.touchState[0][button] !== newState) {
      this.touchState[0][button] = newState;

      // Dispatch synthetic event for Nostalgist WASM bindings
      const buttonToKey = {
        'up': 'ArrowUp',
        'down': 'ArrowDown',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'a': 'KeyX', // RetroArch A mapped to X by default generally or Z? (Z is typically B/Cross, X is A/Circle)
        'b': 'KeyZ',
        'select': 'ShiftRight',
        'start': 'Enter',
        'l': 'KeyQ',
        'r': 'KeyW'
      };

      const code = buttonToKey[button];
      if (code) {
        const eventType = isPressed ? 'keydown' : 'keyup';
        const e = new KeyboardEvent(eventType, {
          code: code,
          key: code,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(e);
      }
    }
  }

  dispatchRemoteInput(playerIndex, stateObj) {
     const maps = [
        null, // P0 is local
        { up: 't', down: 'g', left: 'f', right: 'h', a: 'j', b: 'k', y: 'u', x: 'i', select: 'v', start: 'b', l: 'c', r: 'n' }, // P1
        { up: '8', down: '5', left: '4', right: '6', a: '7', b: '9', y: '1', x: '2', select: '3', start: '0', l: '-', r: '=' }, // P2
        { up: 'i', down: 'k', left: 'j', right: 'l', a: ';', b: '\'', y: ',', x: '.', select: '[', start: ']', l: '/', r: '\\' }  // P3
     ];

     const map = maps[playerIndex];
     if (!this.remoteStates) this.remoteStates = [{}, {}, {}, {}];
      
     if (map) {
        for (const btn in map) {
           const isPressed = stateObj[btn] === 1;
           const wasPressed = this.remoteStates[playerIndex][btn] === 1;

           if (isPressed !== wasPressed) {
              this.remoteStates[playerIndex][btn] = isPressed ? 1 : 0;
              const code = map[btn];
              const eventType = isPressed ? 'keydown' : 'keyup';
              const e = new KeyboardEvent(eventType, {
                 code: code,
                 key: code,
                 bubbles: true,
                 cancelable: true
              });
              document.dispatchEvent(e);
           }
        }
     }
  }

  getState(playerIndex) {
    const state = { ...this.controllerState[playerIndex] };

    // 1. Process Keyboard Polling First
    for (const [keyCode, action] of Object.entries(this.keyMap)) {
      if (this.keys[keyCode]) {
        if (playerIndex === 0 && !action.endsWith('2')) state[action] = 1;
        if (playerIndex === 1 && action.endsWith('2')) state[action.replace('2', '')] = 1; 
      }
    }

    // 2. Override with Gamepad Polling if standard device is active
    const gp = this.gamepads[playerIndex];
    if (gp && gp.buttons) {
      if (gp.buttons[12] && gp.buttons[12].pressed) state.up = 1;     // D-Pad Up
      if (gp.buttons[13] && gp.buttons[13].pressed) state.down = 1;   // D-Pad Down
      if (gp.buttons[14] && gp.buttons[14].pressed) state.left = 1;   // D-Pad Left
      if (gp.buttons[15] && gp.buttons[15].pressed) state.right = 1;  // D-Pad Right
      
      // Analog Stick 1 polling support
      if (gp.axes[1] < -0.5) state.up = 1;
      if (gp.axes[1] > 0.5) state.down = 1;
      if (gp.axes[0] < -0.5) state.left = 1;
      if (gp.axes[0] > 0.5) state.right = 1;

      if (gp.buttons[0] && gp.buttons[0].pressed) state.b = 1;        // Xbox A / PS Cross
      if (gp.buttons[1] && gp.buttons[1].pressed) state.a = 1;        // Xbox B / PS Circle
      if (gp.buttons[4] && gp.buttons[4].pressed) state.l = 1;        // L1
      if (gp.buttons[5] && gp.buttons[5].pressed) state.r = 1;        // R1
      if (gp.buttons[8] && gp.buttons[8].pressed) state.select = 1;
      if (gp.buttons[9] && gp.buttons[9].pressed) state.start = 1;
    }

    // 3. Merge Touch State (Player 1 only)
    if (playerIndex === 0) {
      for (const btn in this.touchState[0]) {
        if (this.touchState[0][btn]) state[btn] = 1;
      }
    }

    return state;
  }
}
