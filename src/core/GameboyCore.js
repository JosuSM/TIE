import { EmulatorCore } from './EmulatorCore';

// The Gameboy API structure for reference:
// import GameBoy from 'jsgbc';

export class GameboyCore extends EmulatorCore {
  constructor() {
    super();
    this.systemName = 'Nintendo GameBoy';
    this.coreName = 'jsgbc - Wasm Interface';
    // Native Gameboy Resolution
    this.width = 160;
    this.height = 144;
    
    // Offscreen rendering surface
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');
    this.offset = 0;
  }

  async init() {
    console.log(`Initialized ${this.coreName}`);
    return true;
  }

  async loadROM(data) {
    console.log(`[GameBoy] Decrypting ROM payload. Size: ${data.byteLength} bytes.`);
    /**
     * Future Integration Pipeline:
     * const gb = new GameBoy({ lcd: this.canvas });
     * gb.replaceCartridge(data);
     * gb.run();
     */
    return true;
  }

  setControllerState(playerIndex, state) {
    // Controller 0 is mapped to GameBoy Joypad hardware registers here
  }

  runFrame() {
    // Provide a visual proof that the core router properly hit the Gameboy Architecture
    this.ctx.fillStyle = '#9bbc0f'; // Iconic "Pea Soup" Gameboy Green Base
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#0f380f'; // Dark Green Pixels
    this.ctx.font = '12px monospace';
    this.ctx.fillText("GAMEBOY", 30, 40);
    this.ctx.font = '8px monospace';
    this.ctx.fillText("CPU: ACTIVE", 30, 60);
    this.ctx.fillText("MEM: ALLOCATED", 30, 75);
    
    // Scanline visual effect
    this.ctx.fillRect(0, (this.offset += 0.5) % this.height, this.width, 2);
  }

  render(ctx) {
    // Render the simulated GameBoy frame onto the main React UI canvas
    ctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
