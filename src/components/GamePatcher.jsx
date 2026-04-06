import React, { useState, useRef, useEffect } from 'react';
import './GamePatcher.css';
import RomPatcher from 'rom-patcher/rom-patcher-js/RomPatcher.js';
import BinFile from 'rom-patcher/rom-patcher-js/modules/BinFile.js';

export function GamePatcher({ onPlayPatchedRom }) {
  const [romFile, setRomFile] = useState(null);
  const [patchFile, setPatchFile] = useState(null);
  const [isPatching, setIsPatching] = useState(false);
  const [error, setError] = useState(null);
  
  const romInputRef = useRef(null);
  const patchInputRef = useRef(null);

  const handleRomDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setRomFile({ file: e.dataTransfer.files[0], name: e.dataTransfer.files[0].name });
      setError(null);
    }
  };

  const handlePatchDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPatchFile({ file: e.dataTransfer.files[0], name: e.dataTransfer.files[0].name });
      setError(null);
    }
  };

  const preventDefault = (e) => e.preventDefault();

  const handleRomSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRomFile({ file: e.target.files[0], name: e.target.files[0].name });
      setError(null);
    }
  };

  const handlePatchSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPatchFile({ file: e.target.files[0], name: e.target.files[0].name });
      setError(null);
    }
  };

  const prepareFiles = async () => {
    try {
      const romBuffer = await romFile.file.arrayBuffer();
      const patchBuffer = await patchFile.file.arrayBuffer();
      
      const romBin = new BinFile(romBuffer);
      romBin.fileName = romFile.name;
      
      const patchBin = new BinFile(patchBuffer);
      patchBin.fileName = patchFile.name;
      
      const patch = RomPatcher.parsePatchFile(patchBin);
      if (!patch) throw new Error("Invalid or unsupported patch format.");
      
      return { romBin, patch };
    } catch (e) {
      throw new Error(`Failed to parse files: ${e.message}`);
    }
  };

  const handleDownload = async () => {
    if (!romFile || !patchFile) return;
    setIsPatching(true);
    setError(null);
    try {
      const { romBin, patch } = await prepareFiles();
      const patchedRom = RomPatcher.applyPatch(romBin, patch, { requireValidation: false, outputSuffix: true });
      patchedRom.save(); // BinFile has a built-in browser save method
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPatching(false);
    }
  };

  const handlePlayNow = async () => {
    if (!romFile || !patchFile) return;
    setIsPatching(true);
    setError(null);
    try {
      const { romBin, patch } = await prepareFiles();
      const patchedRom = RomPatcher.applyPatch(romBin, patch, { requireValidation: false, outputSuffix: true });
      
      // Extract the array buffer safely
      const finalBuffer = patchedRom._u8array.buffer.slice(
         patchedRom._u8array.byteOffset, 
         patchedRom._u8array.byteOffset + patchedRom._u8array.byteLength
      );
      
      onPlayPatchedRom(finalBuffer, patchedRom.fileName || "patched_rom.bin");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="patcher-container slide-up">
      <div className="screen-icon">🔧</div>
      <h2 className="screen-title">Universal Game Patcher</h2>
      <p className="screen-subtitle">
        Apply IPS, BPS, UPS, APS, PPF, and xdelta patches easily. Compatible with modern ROM hacks and translations.
      </p>

      {error && <div style={{ color: '#ff5e5e', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>{error}</div>}

      <div className="patcher-panels">
        {/* ROM Panel */}
        <div className="patcher-panel">
          <h3>Original ROM</h3>
          <div 
            className={`file-dropzone ${romFile ? 'active' : ''}`}
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
            onDrop={handleRomDrop}
            onClick={() => romInputRef.current.click()}
          >
            {romFile ? (
              <>
                <div style={{ fontSize: '2rem' }}>🎮</div>
                <div className="file-name">{romFile.name}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <div>Drop unmodified ROM here</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>or click to browse</div>
              </>
            )}
            <input type="file" ref={romInputRef} onChange={handleRomSelect} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Patch Panel */}
        <div className="patcher-panel">
          <h3>Patch File</h3>
          <div 
            className={`file-dropzone ${patchFile ? 'active' : ''}`}
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
            onDrop={handlePatchDrop}
            onClick={() => patchInputRef.current.click()}
          >
            {patchFile ? (
              <>
                <div style={{ fontSize: '2rem' }}>🪄</div>
                <div className="file-name">{patchFile.name}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                <div>Drop Patch file here</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>(.ips, .bps, .ups, .xdelta...)</div>
              </>
            )}
            <input type="file" ref={patchInputRef} onChange={handlePatchSelect} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      <div className="patch-actions">
        <button 
          className="btn-secondary" 
          onClick={handleDownload} 
          disabled={!romFile || !patchFile || isPatching}
        >
          {isPatching ? 'Patching...' : '💾 Download Patched'}
        </button>
        <button 
          className="btn-secondary" 
          style={{ borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
          onClick={handlePlayNow} 
          disabled={!romFile || !patchFile || isPatching}
        >
          {isPatching ? 'Patching...' : '▶ Play Now'}
        </button>
      </div>
    </div>
  );
}
