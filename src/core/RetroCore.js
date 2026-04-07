import { Nostalgist } from 'nostalgist';

export class RetroCore {
  constructor() {
    this.systemName = 'RetroArch Emulation';
    this.coreName = 'Nostalgist (Libretro WASM)';
    this.width = 640;
    this.height = 480;
    this.nostalgist = null;
    this.isNostalgist = true; 
  }

  async init() {
    return true;
  }

  async loadROM(buffer, filename, canvas, localPlayerIndex = 0) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const extensionToCore = {
      nes: 'fceumm',
      sfc: 'snes9x', smc: 'snes9x',
      gb: 'gambatte', gbc: 'gambatte',
      gba: 'mgba',
      n64: 'mupen64plus_next', z64: 'mupen64plus_next', v64: 'mupen64plus_next',
      sms: 'genesis_plus_gx', gg: 'genesis_plus_gx', md: 'genesis_plus_gx', gen: 'genesis_plus_gx',
      '32x': 'picodrive',
      ngp: 'mednafen_ngp', ngc: 'mednafen_ngp',
      pce: 'mednafen_pce_fast',
      fds: 'nestopia',
      a26: 'stella',
      a78: 'prosystem',
      lnx: 'handy',
      nds: 'melonds',
      '3ds': 'citra',
      iso: 'ppsspp', cso: 'ppsspp',
      sg: 'gearsystem'
    };

    let core = extensionToCore[ext] || 'fceumm';

    // JavaScript event.code → RetroArch key name translation
    // RetroArch web port typically expects these standard names
    const jsCodeToRetroArch = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyA: 'a', KeyB: 'b', KeyC: 'c', KeyD: 'd', KeyE: 'e', KeyF: 'f',
      KeyG: 'g', KeyH: 'h', KeyI: 'i', KeyJ: 'j', KeyK: 'k', KeyL: 'l',
      KeyM: 'm', KeyN: 'n', KeyO: 'o', KeyP: 'p', KeyQ: 'q', KeyR: 'r',
      KeyS: 's', KeyT: 't', KeyU: 'u', KeyV: 'v', KeyW: 'w', KeyX: 'x',
      KeyY: 'y', KeyZ: 'z',
      Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
      Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
      Numpad0: 'kp0', Numpad1: 'kp1', Numpad2: 'kp2', Numpad3: 'kp3', Numpad4: 'kp4',
      Numpad5: 'kp5', Numpad6: 'kp6', Numpad7: 'kp7', Numpad8: 'kp8', Numpad9: 'kp9',
      F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4', F5: 'f5', F6: 'f6',
      F7: 'f7', F8: 'f8', F9: 'f9', F10: 'f10', F11: 'f11', F12: 'f12',
      Enter: 'enter', NumpadEnter: 'kp_enter', Space: 'space', Escape: 'escape', Backspace: 'backspace',
      Tab: 'tab', ShiftLeft: 'shift', ShiftRight: 'rshift',
      ControlLeft: 'ctrl', ControlRight: 'rctrl', AltLeft: 'alt', AltRight: 'ralt',
      Minus: 'minus', Equal: 'equals', BracketLeft: 'leftbracket', BracketRight: 'rightbracket',
      Backslash: 'backslash', Semicolon: 'semicolon', Quote: 'quote',
      Comma: 'comma', Period: 'period', Slash: 'slash', Backquote: 'backquote',
      Insert: 'insert', Delete: 'delete', Home: 'home', End: 'end', PageUp: 'pageup', PageDown: 'pagedown',
      CapsLock: 'capslock', ScrollLock: 'scroll_lock', Pause: 'pause', PrintScreen: 'print_screen'
    };
    const toRA = (jsCode) => jsCodeToRetroArch[jsCode] || jsCode.toLowerCase().replace('key', '');

    // Build Player 1 & 2 maps from localStorage tieKeyBinding
    const defaultKeyMap = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyZ: 'b', KeyX: 'a', KeyA: 'y', KeyS: 'x',
      Enter: 'start', ShiftLeft: 'select', KeyQ: 'l', KeyW: 'r',
      
      // Player 2 defaults
      KeyI: 'up2', KeyK: 'down2', KeyJ: 'left2', KeyL: 'right2',
      KeyF: 'b2', KeyG: 'a2', KeyR: 'y2', KeyT: 'x2',
      Digit1: 'start2', Digit2: 'select2'
    };
    
    let savedKeys;
    try {
      savedKeys = JSON.parse(localStorage.getItem('tieKeyBinding'));
    } catch(e) {}
    const keyMap = savedKeys || defaultKeyMap;

    const p1Map = {
      up: 'up', down: 'down', left: 'left', right: 'right',
      a: 'z', b: 'x', y: 'a', x: 's', select: 'rshift', start: 'enter', l: 'q', r: 'e'
    };
    const p2Map = { ...p1Map }; // Fallback
    
    // Invert mapping intelligently — convert JS codes to RetroArch key names
    for (const [code, action] of Object.entries(keyMap)) {
      const raKey = toRA(code);
      if (!action.endsWith('2')) p1Map[action] = raKey;
      else p2Map[action.replace('2', '')] = raKey;
    }

    // Standard Maps for Netplay offsets (already in RetroArch key names)
    const globalMaps = [
       p1Map,
       { up: 't', down: 'g', left: 'f', right: 'h', a: 'j', b: 'k', y: 'u', x: 'i', select: 'v', start: 'b', l: 'c', r: 'n' },
       { up: 'num8', down: 'num5', left: 'num4', right: 'num6', a: 'num7', b: 'num9', y: 'num1', x: 'num2', select: 'num3', start: 'num0', l: 'minus', r: 'equals' },
       { up: 'i', down: 'k', left: 'j', right: 'l', a: 'semicolon', b: 'quote', y: 'comma', x: 'period', select: 'leftbracket', start: 'rightbracket', l: 'slash', r: 'backslash' }
    ];

    globalMaps[1] = p2Map; // Overwrite P2 with local config

    // Swap our keys so the local player always gets the primary P1 bindings
    let maps = [...globalMaps];
    if (localPlayerIndex !== 0) {
       let temp = maps[0];
       maps[0] = maps[localPlayerIndex];
       maps[localPlayerIndex] = temp;
    }

    try {
      this.nostalgist = await Nostalgist.launch({
        core: core,
        rom: new Uint8Array(buffer),
        element: canvas,
        retroarchConfig: {
          input_player1_up: maps[0].up, input_player1_down: maps[0].down, input_player1_left: maps[0].left, input_player1_right: maps[0].right,
          input_player1_a: maps[0].a, input_player1_b: maps[0].b, input_player1_y: maps[0].y, input_player1_x: maps[0].x,
          input_player1_select: maps[0].select, input_player1_start: maps[0].start, input_player1_l: maps[0].l, input_player1_r: maps[0].r,
          
          input_player2_up: maps[1].up, input_player2_down: maps[1].down, input_player2_left: maps[1].left, input_player2_right: maps[1].right,
          input_player2_a: maps[1].a, input_player2_b: maps[1].b, input_player2_y: maps[1].y, input_player2_x: maps[1].x,
          input_player2_select: maps[1].select, input_player2_start: maps[1].start, input_player2_l: maps[1].l, input_player2_r: maps[1].r,
          
          input_player3_up: maps[2].up, input_player3_down: maps[2].down, input_player3_left: maps[2].left, input_player3_right: maps[2].right,
          input_player3_a: maps[2].a, input_player3_b: maps[2].b, input_player3_y: maps[2].y, input_player3_x: maps[2].x,
          input_player3_select: maps[2].select, input_player3_start: maps[2].start, input_player3_l: maps[2].l, input_player3_r: maps[2].r,
          
          input_player4_up: maps[3].up, input_player4_down: maps[3].down, input_player4_left: maps[3].left, input_player4_right: maps[3].right,
          input_player4_a: maps[3].a, input_player4_b: maps[3].b, input_player4_y: maps[3].y, input_player4_x: maps[3].x,
          input_player4_select: maps[3].select, input_player4_start: maps[3].start, input_player4_l: maps[3].l, input_player4_r: maps[3].r,
          
          // Technical & UX Options
          rewind_enable: true,
          rewind_buffer_size: 20, // 20MB buffer for rewind history
          rewind_granularity: 1,  // Frame by frame
          fast_forward_ratio: 3.0,
          fps_show: false,
          notification_show: true
        }
      });
      this.systemName = `Emulating with ${core.toUpperCase()}`;
    } catch(err) {
      console.error(err);
      throw err;
    }
  }

  setControllerState() {}
  runFrame() {}
  render() {}
  
  // Instance Control methods
  pause() { if (this.nostalgist) this.nostalgist.pause(); }
  resume() { if (this.nostalgist) this.nostalgist.resume(); }
  restart() { if (this.nostalgist) this.nostalgist.restart(); }
  
  async saveState() {
    if (this.nostalgist) return await this.nostalgist.saveState();
    return null;
  }

  async loadState(state) {
    if (this.nostalgist) return await this.nostalgist.loadState(state);
  }

  // Command Interface for advanced features
  sendCommand(cmd) {
    if (this.nostalgist && this.nostalgist.sendCommand) {
       this.nostalgist.sendCommand(cmd);
    }
  }

  exit() {
    if (this.nostalgist) {
      this.nostalgist.exit({ removeCanvas: false });
    }
  }
}
