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
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0 }, // Player 1
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0 }  // Player 2
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
      if (gp.buttons[8] && gp.buttons[8].pressed) state.select = 1;
      if (gp.buttons[9] && gp.buttons[9].pressed) state.start = 1;
    }

    return state;
  }
}
