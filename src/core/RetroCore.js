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

    // Build Player 1 & 2 maps from localStorage tieKeyBinding
    const defaultKeyMap = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyZ: 'a', KeyX: 'b', KeyA: 'y', KeyS: 'x',
      Enter: 'start', ShiftRight: 'select', KeyQ: 'l', KeyW: 'r',
      KeyW: 'up2', KeyS: 'down2', KeyA: 'left2', KeyD: 'right2',
      KeyJ: 'a2', KeyK: 'b2', Digit1: 'start2', Digit2: 'select2'
    };
    
    let savedKeys;
    try {
      savedKeys = JSON.parse(localStorage.getItem('tieKeyBinding'));
    } catch(e) {}
    const keyMap = savedKeys || defaultKeyMap;

    const p1Map = {
      up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
      a: 'KeyZ', b: 'KeyX', y: 'KeyA', x: 'KeyS', select: 'ShiftRight', start: 'Enter', l: 'KeyQ', r: 'KeyE'
    };
    const p2Map = { ...p1Map }; // Fallback
    
    // Invert mapping intelligently
    for (const [code, action] of Object.entries(keyMap)) {
      if (!action.endsWith('2')) p1Map[action] = code;
      else p2Map[action.replace('2', '')] = code;
    }

    // Standard Maps for Netplay offsets
    const globalMaps = [
       p1Map,
       { up: 't', down: 'g', left: 'f', right: 'h', a: 'j', b: 'k', y: 'u', x: 'i', select: 'v', start: 'b', l: 'c', r: 'n' },
       { up: '8', down: '5', left: '4', right: '6', a: '7', b: '9', y: '1', x: '2', select: '3', start: '0', l: '-', r: '=' },
       { up: 'i', down: 'k', left: 'j', right: 'l', a: ';', b: '\'', y: ',', x: '.', select: '[', start: ']', l: '/', r: '\\' }
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
  
  exit() {
    if (this.nostalgist) {
      this.nostalgist.exit({ removeCanvas: false });
    }
  }
}
