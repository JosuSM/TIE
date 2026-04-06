import { EmulatorCore } from './EmulatorCore';

// Iodine GBA instance for reference
// import iodineGBA from 'iodine-gba';

export class GbaCore extends EmulatorCore {
  constructor() {
    super();
    this.systemName = 'GameBoy Advance';
    this.coreName = 'IodineGBA - Wasm Interface';
    // Native GBA Resolution
    this.width = 240;
    this.height = 160;
    
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
    console.log(`[GBA] Decrypting ROM payload. Size: ${data.byteLength} bytes.`);
    console.log(`[GBA] Awaiting BIOS execution...`);
    /**
     * Future Integration Pipeline:
     * const gba = iodineGBA(this.canvas);
     * gba.play(biosArray, data);
     */
    return true;
  }

  setControllerState(playerIndex, state) {
     // Route generic inputs to Iodine IO map (A, B, L, R, Select, Start, D-Pad)
  }

  runFrame() {
    // Provide a visual proof that the core router properly hit the GBA Architecture
    this.ctx.fillStyle = '#6e51cc'; // Deep GBA Purple
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#ffffff'; 
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText("GAMEBOY ADVANCE", 40, 50);
    this.ctx.font = '10px sans-serif';
    this.ctx.fillText("CPU: 16.78 MHz ARM7TDMI", 40, 80);
    this.ctx.fillText("IO: AWAITING BIOS BINARY", 40, 100);
    
    this.offset += 1;
    this.ctx.fillRect((this.offset) % this.width, 140, 20, 2);
  }

  render(ctx) {
    ctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
