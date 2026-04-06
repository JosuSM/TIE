import { EmulatorCore } from '../EmulatorCore';

export class DummyCore extends EmulatorCore {
  constructor() {
    super();
    this.systemName = 'Dummy Console';
    this.coreName = 'TIE Dummy Core';
    
    // Internal resolution
    this.width = 320;
    this.height = 240;
    
    // Internal state for our "game"
    this.x = 160;
    this.y = 120;
    this.vx = 3;
    this.vy = 3;
    this.color = '#ff2e93';
    this.input = { up: false, down: false, left: false, right: false };
  }

  async init() {
    console.log(`Initialized ${this.coreName}`);
    return true;
  }

  async loadROM(data) {
    console.log(`Loaded dummy ROM`);
    return true;
  }

  reset() {
    this.x = this.width / 2;
    this.y = this.height / 2;
  }

  setControllerState(playerIndex, state) {
    if (playerIndex === 0) {
      this.input = { ...this.input, ...state };
    }
  }

  runFrame() {
    // Process input
    if (this.input.up) this.y -= 4;
    if (this.input.down) this.y += 4;
    if (this.input.left) this.x -= 4;
    if (this.input.right) this.x += 4;

    // Auto bounce if no input
    if (!this.input.up && !this.input.down && !this.input.left && !this.input.right) {
      this.x += this.vx;
      this.y += this.vy;
    }

    // Wall collision
    if (this.x < 10) { this.x = 10; this.vx *= -1; }
    if (this.x > this.width - 10) { this.x = this.width - 10; this.vx *= -1; }
    if (this.y < 10) { this.y = 10; this.vy *= -1; }
    if (this.y > this.height - 10) { this.y = this.height - 10; this.vy *= -1; }
  }

  render(ctx) {
    // Render "retro" looking graphics
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw scanning lines/grid pattern on background
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < this.height; i += 10) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(this.width, i); ctx.stroke();
    }
    for (let i = 0; i < this.width; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, this.height); ctx.stroke();
    }

    // Draw the "player" object
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Overlay text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(`${this.coreName} v1.0`, 10, 20);
    ctx.fillText(`FPS: 60`, 10, 35);
    ctx.fillText('Use Arrow Keys to control', 10, this.height - 10);
  }
}
