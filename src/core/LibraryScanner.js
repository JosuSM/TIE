import * as idb from 'idb-keyval';

export const VALID_EXTENSIONS = {
  nes: 'NES', 
  sfc: 'SNES', smc: 'SNES',
  gb: 'Game Boy', gbc: 'Game Boy Color',
  gba: 'Game Boy Advance',
  n64: 'Nintendo 64', z64: 'Nintendo 64', v64: 'Nintendo 64',
  sms: 'Master System', gg: 'Game Gear', md: 'Mega Drive', gen: 'Mega Drive',
  '32x': 'Sega 32X',
  ngp: 'NeoGeo Pocket', ngc: 'NeoGeo Pocket Color',
  pce: 'PC Engine',
  fds: 'Famicom Disk System',
  a26: 'Atari 2600', a78: 'Atari 7800', lnx: 'Atari Lynx',
  nds: 'Nintendo DS', '3ds': 'Nintendo 3DS',
  iso: 'PSP', cso: 'PSP', // Simplification, other disc formats might exist
  sg: 'SG-1000'
};

export class LibraryScanner {
  constructor() {
    this.roms = []; 
  }

  async loadPersistedLibrary() {
    try {
      const handle = await idb.get('tieRomDirectoryHandle');
      if (handle) {
         // Verifies permission without triggering a prompt automatically unless necessary
         const permission = await handle.queryPermission({ mode: 'read' });
         if (permission === 'granted') {
             await this.traverseDirectory(handle);
             return this.roms;
         } else {
             // We have the handle but lost permission, returning null forces a re-request by the user
             return null;
         }
      }
    } catch (e) {
      console.warn("Storage API inaccessible or handle invalid", e);
    }
    return null;
  }
  
  async requestPermissionAndLoad() {
    const handle = await idb.get('tieRomDirectoryHandle');
    if (handle) {
      const permission = await handle.requestPermission({ mode: 'read' });
      if (permission === 'granted') {
        await this.traverseDirectory(handle);
        return this.roms;
      }
    }
    return null;
  }

  async pickAndScanDirectory() {
    if (!window.showDirectoryPicker) {
      throw new Error("O teu browser não suporta seleção massiva de diretórios (File System Access API). Usa o Google Chrome ou Edge.");
    }
    
    try {
      const directoryHandle = await window.showDirectoryPicker({
        id: 'tieRoms',
        mode: 'read',
        startIn: 'desktop'
      });
      
      await idb.set('tieRomDirectoryHandle', directoryHandle);
      await this.traverseDirectory(directoryHandle);
      
      return this.roms;
    } catch (e) {
      if (e.name === 'AbortError') return null; // User cancelled
      throw e;
    }
  }

  async traverseDirectory(dirHandle) {
    this.roms = [];
    await this._readDir(dirHandle, "");
    
    // Sort alphabetically by default
    this.roms.sort((a, b) => a.name.localeCompare(b.name));
  }

  async _readDir(dirHandle, path) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop().toLowerCase();
        if (VALID_EXTENSIONS[ext]) {
          this.roms.push({
            id: entry.name + '_' + entry.lastModified, // Simple pseudo-id
            name: entry.name.replace(`.${ext}`, ''),
            filename: entry.name,
            ext: ext,
            system: VALID_EXTENSIONS[ext],
            path: path,
            handle: entry
          });
        }
      } else if (entry.kind === 'directory') {
        await this._readDir(entry, path + entry.name + "/");
      }
    }
  }

  async getBufferFromHandle(handle) {
    const file = await handle.getFile();
    return await file.arrayBuffer();
  }
}
