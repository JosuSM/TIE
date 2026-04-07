import React from 'react';

/**
 * Advanced SVG filters for CRT emulation.
 * These are applied via CSS filter: url(#...)
 */
export const CrtFilters = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
    <defs>
      {/* 1. Chromatic Aberration & Slight Blur */}
      <filter id="crt-chromatic" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
        <feOffset in="blur" dx="1.5" dy="0" result="offsetRed" />
        <feOffset in="blur" dx="-1.5" dy="0" result="offsetBlue" />
        
        <feColorMatrix in="offsetRed" type="matrix" 
          values="1 0 0 0 0 
                  0 0 0 0 0 
                  0 0 0 0 0 
                  0 0 0 1 0" result="red" />
        
        <feColorMatrix in="offsetBlue" type="matrix" 
          values="0 0 0 0 0 
                  0 0 0 0 0 
                  0 0 1 0 0 
                  0 0 0 1 0" result="blue" />

        <feColorMatrix in="blur" type="matrix" 
          values="0 0 0 0 0 
                  0 1 0 0 0 
                  0 0 0 0 0 
                  0 0 0 1 0" result="green" />

        <feBlend in="red" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blue" mode="screen" />
      </filter>

      {/* 2. Barrel Distortion (Curvature) */}
      <filter id="crt-curvature-filter">
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0 1" />
          <feFuncG type="table" tableValues="0 1" />
          <feFuncB type="table" tableValues="0 1" />
        </feComponentTransfer>
        <feTurbulence baseFrequency="0.01 0.01" numOctaves="1" result="noise" seed="1" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      
      {/* 3. Shadow Mask Effect */}
      <pattern id="shadowmask" width="6" height="3" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="2" height="3" fill="rgba(255,0,0,0.4)" />
        <rect x="2" y="0" width="2" height="3" fill="rgba(0,255,0,0.4)" />
        <rect x="4" y="0" width="2" height="3" fill="rgba(0,0,255,0.4)" />
      </pattern>
    </defs>
  </svg>
);
