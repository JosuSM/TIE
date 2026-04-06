export class EmulatorCore {
  constructor() {
    this.systemName = 'Unknown';
    this.coreName = 'BaseCore';
  }

  // Lifecycle
  async init() {
    throw new Error('init() not implemented');
  }
  
  async loadROM(data) {
    throw new Error('loadROM() not implemented');
  }
  
  reset() {
    throw new Error('reset() not implemented');
  }

  // Execution
  runFrame() {
    throw new Error('runFrame() not implemented');
  }

  // I/O
  setControllerState(playerIndex, buttons) {
    // Buttons should be an object mapping e.g { up: true, a: false }
  }

  // Rendering
  render(ctx) {
    throw new Error('render() not implemented');
  }

  // Audio expects a Float32Array
  processAudio() {
    return new Float32Array(0);
  }
}
