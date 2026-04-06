import { NES } from 'jsnes';
import { EmulatorCore } from './EmulatorCore';

export class NesCore extends EmulatorCore {
  constructor() {
    super();
    this.systemName = 'Nintendo Entertainment System';
    this.coreName = 'JSNES';
    this.width = 256;
    this.height = 240;
    
    // Allocate an offscreen Canvas/ImageData to paint pixels into from the decoder
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.imageData = this.ctx.createImageData(this.width, this.height);
    
    // JS-NES instance initialization
    this.nes = new NES({
      onFrame: (frameBuffer) => {
        // frameBuffer is an array of 256x240 RGB values. Map it to RGBA ImageData
        const data = this.imageData.data;
        let i = 0;
        for (let y = 0; y < 240; ++y) {
          for (let x = 0; x < 256; ++x) {
            i = y * 256 + x;
            data[i * 4]     = frameBuffer[i] & 0xFF;         // RED
            data[i * 4 + 1] = (frameBuffer[i] >> 8) & 0xFF;  // GREEN
            data[i * 4 + 2] = (frameBuffer[i] >> 16) & 0xFF; // BLUE
            data[i * 4 + 3] = 255;                           // ALPHA
          }
        }
      },
      onAudioSample: (left, right) => {
        // Audio processing to be implemented via WebAudio API in the future
      }
    });

    // Mapping from generic controller to standard NES controller map
    // NES buttons: A: 0, B: 1, SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7
    this.nesInputs = {
      a: 0, b: 1, select: 2, start: 3,
      up: 4, down: 5, left: 6, right: 7
    };
  }

  async init() {
    console.log(`Initialized ${this.coreName}`);
    return true;
  }

  async loadROM(data) {
    if (!data || data.length === 0) throw new Error("ROM data empty");
    
    // JSNES loadROM expects a binary string
    let binary = '';
    for(let i=0; i<data.byteLength; i++){
      binary += String.fromCharCode(data[i]);
    }
    
    this.nes.loadROM(binary);
    console.log(`Loaded NES ROM of size ${data.byteLength}`);
    return true;
  }

  reset() {
    this.nes.reset();
  }

  setControllerState(playerIndex, state) {
    // playerIndex 0 or 1 maps to JS-NES Controller 1 or 2
    const port = playerIndex + 1; 

    for (const [key, btnCode] of Object.entries(this.nesInputs)) {
      if (state[key]) {
        this.nes.buttonDown(port, btnCode);
      } else {
        this.nes.buttonUp(port, btnCode);
      }
    }
  }

  runFrame() {
    this.nes.frame(); // Emulate a full 60hz frame exactly
  }

  render(ctx) {
    // Put NES colored frame buffer to our offscreen canvas
    this.ctx.putImageData(this.imageData, 0, 0);
    // Draw the offscreen canvas scaling onto the main rendering canvas
    ctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
