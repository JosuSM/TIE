export class InputManager {
  constructor() {
    this.keys = {};
    this.gamepads = [];

    // Default universal keyboard mapping mapped to abstract emulator positions
    const defaultKeyMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyZ: 'a',
      KeyX: 'b',
      KeyA: 'y',
      KeyS: 'x',
      Enter: 'start',
      ShiftRight: 'select',
      KeyQ: 'l',
      KeyW: 'r',
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

    const defaultGamepadMap = {
      'button_12': 'up',
      'button_13': 'down',
      'button_14': 'left',
      'button_15': 'right',
      'button_0':  'b',
      'button_1':  'a',
      'button_2':  'y',
      'button_3':  'x',
      'button_4':  'l',
      'button_5':  'r',
      'button_8':  'select',
      'button_9':  'start',
      'axis_1_-1': 'up',
      'axis_1_1':  'down',
      'axis_0_-1': 'left',
      'axis_0_1':  'right'
    };

    // Load custom user map from HTML5 localStorage if it exists
    const savedKeys = localStorage.getItem('tieKeyBinding');
    this.keyMap = savedKeys ? JSON.parse(savedKeys) : defaultKeyMap;

    const savedGamepad = localStorage.getItem('tieGamepadBinding');
    this.gamepadMap = savedGamepad ? JSON.parse(savedGamepad) : defaultGamepadMap;
    
    // Abstract Controller Initializer
    this.controllerState = [
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, x: 0, y: 0, select: 0, start: 0, l: 0, r: 0 }, // Player 1
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, x: 0, y: 0, select: 0, start: 0, l: 0, r: 0 }  // Player 2
    ];
    
    // Mobile Touch State
    this.touchState = [
      { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, select: 0, start: 0, l: 0, r: 0 }
    ];

    // Last known state for detecting transitions (for rumble)
    this.lastGamepadButtons = [{}, {}];
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

  getGamepadButtonName(action) {
    const key = Object.keys(this.gamepadMap).find(k => this.gamepadMap[k] === action);
    if (!key) return 'UNBOUND';
    return key.replace('button_', 'Btn ').replace('axis_', 'Axis ');
  }

  remapKey(action, keyCode) {
    for (const [key, mappedAction] of Object.entries(this.keyMap)) {
      if (mappedAction === action) delete this.keyMap[key];
    }
    this.keyMap[keyCode] = action;
    localStorage.setItem('tieKeyBinding', JSON.stringify(this.keyMap));
  }

  remapGamepad(action, inputId) {
    // inputId is like 'button_0' or 'axis_1_-1'
    for (const [id, mappedAction] of Object.entries(this.gamepadMap)) {
      if (mappedAction === action) delete this.gamepadMap[id];
    }
    this.gamepadMap[inputId] = action;
    localStorage.setItem('tieGamepadBinding', JSON.stringify(this.gamepadMap));
  }

  pollGamepads() {
    const rawPads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.gamepads = Array.from(rawPads).filter(pad => pad !== null);
  }

  triggerGamepadRumble(playerIndex, duration = 50, strong = 0.3, weak = 0.3) {
    const gp = this.gamepads[playerIndex];
    if (gp && gp.vibrationActuator) {
      gp.vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: duration,
        strongMagnitude: strong,
        weakMagnitude: weak,
      }).catch(() => {}); // Best effort
    }
  }

  setTouchButton(button, isPressed) {
    const newState = isPressed ? 1 : 0;
    if (this.touchState[0][button] !== undefined && this.touchState[0][button] !== newState) {
      this.touchState[0][button] = newState;

      const buttonToKey = {
        'up': 'ArrowUp',
        'down': 'ArrowDown',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'a': 'KeyX',
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

    // 2. Process Gamepad Map
    const gp = this.gamepads[playerIndex];
    if (gp) {
      let newlyPressed = false;
      for (const [id, action] of Object.entries(this.gamepadMap)) {
        let isPressed = false;
        if (id.startsWith('button_')) {
          const btnIdx = parseInt(id.replace('button_', ''));
          if (gp.buttons[btnIdx] && gp.buttons[btnIdx].pressed) isPressed = true;
        } else if (id.startsWith('axis_')) {
          const parts = id.split('_');
          const axisIdx = parseInt(parts[1]);
          const direction = parseInt(parts[2]);
          if (gp.axes[axisIdx]) {
            if (direction === -1 && gp.axes[axisIdx] < -0.5) isPressed = true;
            if (direction === 1 && gp.axes[axisIdx] > 0.5) isPressed = true;
          }
        }

        if (isPressed) {
          state[action] = 1;
          if (!this.lastGamepadButtons[playerIndex][id]) {
            newlyPressed = true;
          }
          this.lastGamepadButtons[playerIndex][id] = true;
        } else {
          this.lastGamepadButtons[playerIndex][id] = false;
        }
      }

      if (newlyPressed) {
        this.triggerGamepadRumble(playerIndex, 40, 0.4, 0.4);
      }
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
