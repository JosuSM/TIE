import React from 'react';

/**
 * ConsoleIcon Component
 * Renders a specialized SVG silhouette for each retro gaming system.
 * Designed to look premium and recognizable at small scales.
 */
export const ConsoleIcon = ({ system, color = "currentColor", size = "100%" }) => {
  const icons = {
    // === NINTENDO ===
    'NES': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="16" width="48" height="32" rx="2" />
        <line x1="8" y1="28" x2="56" y2="28" />
        <rect x="14" y="34" width="10" height="6" />
        <circle cx="48" cy="37" r="2" />
        <circle cx="42" cy="37" r="2" />
      </svg>
    ),
    'SNES': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="14" width="44" height="36" rx="6" />
        <rect x="18" y="18" width="28" height="18" rx="2" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="20" cy="42" r="3" />
        <circle cx="44" cy="42" r="3" />
        <line x1="28" y1="42" x2="36" y2="42" />
      </svg>
    ),
    'Game Boy': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="16" y="8" width="32" height="48" rx="4" />
        <rect x="22" y="14" width="20" height="16" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="40" cy="46" r="2.5" />
        <circle cx="34" cy="49" r="2.5" />
        <path d="M22 42h6M25 39v6" />
      </svg>
    ),
    'Game Boy Color': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="16" y="8" width="32" height="48" rx="6" />
        <rect x="22" y="14" width="20" height="16" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="40" cy="46" r="3" />
        <circle cx="33" cy="50" r="3" />
        <path d="M22 42h6M25 39v6" />
      </svg>
    ),
    'Game Boy Advance': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="18" width="52" height="28" rx="14" />
        <rect x="18" y="22" width="28" height="20" rx="2" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="52" cy="32" r="2" />
        <circle cx="48" cy="28" r="2" />
        <path d="M10 28v8M6 32h8" />
      </svg>
    ),
    'Nintendo 64': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 44c0 4 4 6 24 6s24-2 24-6V24c0-4-4-6-24-6S8 20 8 24v20z" />
        <rect x="18" y="22" width="28" height="4" rx="1" />
        <circle cx="16" cy="38" r="2" />
        <circle cx="24" cy="38" r="2" />
        <circle cx="40" cy="38" r="2" />
        <circle cx="48" cy="38" r="2" />
      </svg>
    ),
    'Nintendo DS': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="14" width="44" height="36" rx="4" />
        <line x1="10" y1="32" x2="54" y2="32" />
        <rect x="18" y="18" width="28" height="10" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <rect x="18" y="36" width="28" height="10" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
      </svg>
    ),
    'Nintendo 3DS': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="12" width="44" height="40" rx="4" />
        <line x1="10" y1="32" x2="54" y2="32" />
        <rect x="18" y="16" width="28" height="12" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <rect x="18" y="36" width="28" height="12" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="14" cy="38" r="2" />
      </svg>
    ),
    'Famicom Disk System': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="12" width="40" height="40" rx="2" />
        <rect x="20" y="24" width="24" height="16" rx="1" strokeDasharray="4 2" />
        <circle cx="32" cy="18" r="2" />
      </svg>
    ),

    // === SEGA ===
    'Master System': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18h52v28H6z" />
        <path d="M6 32h52" />
        <path d="M24 18v14" />
        <rect x="42" y="36" width="10" height="6" />
      </svg>
    ),
    'Mega Drive': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="16" width="48" height="32" rx="4" />
        <circle cx="32" cy="28" r="8" />
        <rect x="26" y="27" width="12" height="2" />
        <path d="M42 40h8M42 44h8" />
      </svg>
    ),
    'Game Gear': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="18" width="56" height="28" rx="8" />
        <rect x="18" y="22" width="28" height="20" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="50" cy="32" r="3" />
        <path d="M14 28v8M10 32h8" />
      </svg>
    ),
    'Sega 32X': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 44c0 4 8 6 20 6s20-2 20-6V32c0-10-8-18-20-18S12 22 12 32v12z" />
        <rect x="20" y="20" width="24" height="4" rx="1" />
      </svg>
    ),
    'SG-1000': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="16" width="44" height="32" rx="2" />
        <path d="M10 28h44" />
        <circle cx="44" cy="38" r="3" />
        <circle cx="34" cy="38" r="3" />
      </svg>
    ),

    // === SONY ===
    'PSP': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="20" width="56" height="24" rx="12" />
        <rect x="18" y="22" width="28" height="20" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="11" cy="32" r="4" fill="none" strokeDasharray="2 2" />
        <circle cx="53" cy="32" r="4" fill="none" strokeDasharray="1 3" />
      </svg>
    ),

    // === ATARI ===
    'Atari 2600': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="18" width="48" height="28" rx="2" />
        <path d="M8 32h48" />
        <path d="M16 18v14M24 18v14M32 18v14" strokeWidth="1.5" opacity="0.6" />
        <rect x="42" y="36" width="8" height="4" rx="1" />
      </svg>
    ),
    'Atari 7800': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 42c0 2 10 4 26 4s26-2 26-4V24c0-4-10-6-26-6S6 20 6 24v18z" />
        <rect x="16" y="32" width="32" height="4" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
      </svg>
    ),
    'Atari Lynx': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="16" width="60" height="32" rx="10" />
        <rect x="18" y="20" width="28" height="24" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <path d="M10 28v8M6 32h8" />
        <circle cx="52" cy="28" r="2.5" />
        <circle cx="52" cy="36" r="2.5" />
      </svg>
    ),

    // === OTHERS ===
    'PC Engine': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="14" width="36" height="36" rx="4" />
        <rect x="22" y="18" width="20" height="12" rx="1" />
        <circle cx="42" cy="42" r="2" />
        <circle cx="36" cy="42" r="2" />
      </svg>
    ),
    'NeoGeo Pocket': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="20" width="48" height="24" rx="8" />
        <rect x="20" y="23" width="24" height="18" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="14" cy="32" r="2.5" />
        <circle cx="50" cy="28" r="2.5" />
        <circle cx="50" cy="36" r="2.5" />
      </svg>
    ),
    'NeoGeo Pocket Color': (
      <svg viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="20" width="48" height="24" rx="8" />
        <rect x="20" y="23" width="24" height="18" rx="1" fill="rgba(255,255,255,0.1)" stroke="none" />
        <circle cx="14" cy="32" r="3" />
        <circle cx="50" cy="28" r="3" />
        <circle cx="50" cy="36" r="3" />
      </svg>
    ),
  };

  const getSystemKey = (sys) => {
    if (!sys) return 'NES';
    const s = sys.toUpperCase();
    if (s.includes('NES') || s.includes('ENTERTAINMENT')) return 'NES';
    if (s.includes('SNES') || s.includes('SUPER NINTENDO')) return 'SNES';
    if (s.includes('NINTENDO 64')) return 'Nintendo 64';
    if (s.includes('GAME BOY COLOR')) return 'Game Boy Color';
    if (s.includes('ADVANCE')) return 'Game Boy Advance';
    if (s.includes('GAME BOY')) return 'Game Boy';
    if (s.includes('DS')) return 'Nintendo DS';
    if (s.includes('3DS')) return 'Nintendo 3DS';
    if (s.includes('DISK SYSTEM')) return 'Famicom Disk System';
    if (s.includes('MASTER SYSTEM')) return 'Master System';
    if (s.includes('MEGA DRIVE') || s.includes('GENESIS')) return 'Mega Drive';
    if (s.includes('GAME GEAR')) return 'Game Gear';
    if (s.includes('32X')) return 'Sega 32X';
    if (s.includes('SG-1000')) return 'SG-1000';
    if (s.includes('PSP')) return 'PSP';
    if (s.includes('2600')) return 'Atari 2600';
    if (s.includes('7800')) return 'Atari 7800';
    if (s.includes('LYNX')) return 'Atari Lynx';
    if (s.includes('PC ENGINE') || s.includes('TURBOGRAFX')) return 'PC Engine';
    if (s.includes('NEOGEO POCKET COLOR')) return 'NeoGeo Pocket Color';
    if (s.includes('NEOGEO POCKET')) return 'NeoGeo Pocket';
    return 'NES';
  };

  const key = getSystemKey(system);
  
  return (
    <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {icons[key]}
    </span>
  );
};
