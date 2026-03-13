'use client'
import React from 'react'

// Pixel Pattern Design System — Pixel Art SVG
// Todos os padrões são tiles 8x8 quadriculados, mínimo 2 cores + preto

export const PATTERNS = {
  saude:    { id: 'px-cross',    pf: '#22C55E', pb: '#000000' },   // Cruz pixelada
  segur:    { id: 'px-shield',   pf: '#EF4444', pb: '#000000' },   // Escudo pixel
  agro:     { id: 'px-diamond',  pf: '#FACC15', pb: '#000000' },   // Losango pixel
  educ:     { id: 'px-book',     pf: '#60A5FA', pb: '#000000' },   // Grid de livro
  econ:     { id: 'px-coin',     pf: '#A855F7', pb: '#000000' },   // Coin pixel
  amb:      { id: 'px-leaf',     pf: '#34D399', pb: '#000000' },   // Folha pixel
  infra:    { id: 'px-brick',    pf: '#FB923C', pb: '#000000' },   // Tijolo pixel
  direitos: { id: 'px-star',     pf: '#F472B6', pb: '#000000' },   // Estrela pixel
  nao:      { id: 'px-xmark',    pf: '#EF4444', pb: '#000000' },   // X pixel
  abs:      { id: 'px-dash',     pf: '#94A3B8', pb: '#000000' },   // Traço pixel
} as const

export type PatternKey = keyof typeof PATTERNS

export interface PatternConfig {
  id: string
  pf: string
  pb: string
}

export function patStyle(p: PatternConfig): React.CSSProperties {
  return {
    '--pf': p.pf,
    '--pb': p.pb,
  } as React.CSSProperties
}

export function PatternDefs() {
  return (
    <defs>
      {/* CROSS — Pixel art cross (plus sign) 8x8 */}
      <pattern id="px-cross" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="1" width="2" height="6" fill="var(--pf,#22C55E)"/>
        <rect x="1" y="3" width="6" height="2" fill="var(--pf,#22C55E)"/>
      </pattern>

      {/* SHIELD — Pixel art shield 8x8 */}
      <pattern id="px-shield" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="2" y="1" width="4" height="1" fill="var(--pf,#EF4444)"/>
        <rect x="1" y="2" width="6" height="3" fill="var(--pf,#EF4444)"/>
        <rect x="2" y="5" width="4" height="1" fill="var(--pf,#EF4444)"/>
        <rect x="3" y="6" width="2" height="1" fill="var(--pf,#EF4444)"/>
      </pattern>

      {/* DIAMOND — Pixel art diamond 8x8 */}
      <pattern id="px-diamond" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="0" width="2" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="2" y="1" width="4" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="1" y="2" width="6" height="2" fill="var(--pf,#FACC15)"/>
        <rect x="2" y="4" width="4" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="3" y="5" width="2" height="1" fill="var(--pf,#FACC15)"/>
        {/* Shine pixel */}
        <rect x="2" y="2" width="1" height="1" fill="white"/>
      </pattern>

      {/* BOOK/GRID — Pixel art book grid 8x8 */}
      <pattern id="px-book" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="1" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="5" y="1" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="3" y="3" width="2" height="2" fill="var(--pf,#60A5FA)" opacity="0.5"/>
      </pattern>

      {/* COIN — Pixel art coin/circle 8x8 */}
      <pattern id="px-coin" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="2" y="1" width="4" height="1" fill="var(--pf,#A855F7)"/>
        <rect x="1" y="2" width="6" height="4" fill="var(--pf,#A855F7)"/>
        <rect x="2" y="6" width="4" height="1" fill="var(--pf,#A855F7)"/>
        {/* Inner circle darker */}
        <rect x="3" y="3" width="2" height="2" fill="var(--pb,#000)" opacity="0.4"/>
      </pattern>

      {/* LEAF — Pixel art leaf 8x8 */}
      <pattern id="px-leaf" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="4" y="1" width="2" height="1" fill="var(--pf,#34D399)"/>
        <rect x="3" y="2" width="4" height="2" fill="var(--pf,#34D399)"/>
        <rect x="2" y="4" width="4" height="1" fill="var(--pf,#34D399)"/>
        <rect x="3" y="5" width="2" height="1" fill="var(--pf,#34D399)"/>
        {/* Stem */}
        <rect x="3" y="6" width="1" height="1" fill="var(--pf,#34D399)" opacity="0.6"/>
      </pattern>

      {/* BRICK — Pixel art brick wall 8x8 */}
      <pattern id="px-brick" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        {/* Row 1: 2 bricks */}
        <rect x="0" y="1" width="3" height="2" fill="var(--pf,#FB923C)"/>
        <rect x="5" y="1" width="3" height="2" fill="var(--pf,#FB923C)"/>
        {/* Row 2: offset brick */}
        <rect x="2" y="5" width="4" height="2" fill="var(--pf,#FB923C)"/>
      </pattern>

      {/* STAR — Pixel art star 8x8 */}
      <pattern id="px-star" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="0" width="2" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="1" y="2" width="6" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="0" y="4" width="8" height="1" fill="var(--pf,#F472B6)"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#F472B6)"/>
      </pattern>

      {/* XMARK — Pixel art X 8x8 */}
      <pattern id="px-xmark" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="1" width="2" height="2" fill="var(--pf,#EF4444)"/>
        <rect x="5" y="1" width="2" height="2" fill="var(--pf,#EF4444)"/>
        <rect x="3" y="3" width="2" height="2" fill="var(--pf,#EF4444)"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#EF4444)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#EF4444)"/>
      </pattern>

      {/* DASH — Pixel art dashes 8x8 */}
      <pattern id="px-dash" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="2" width="3" height="1" fill="var(--pf,#94A3B8)"/>
        <rect x="5" y="2" width="2" height="1" fill="var(--pf,#94A3B8)"/>
        <rect x="2" y="5" width="4" height="1" fill="var(--pf,#94A3B8)"/>
      </pattern>

      {/* Legacy IDs kept for compatibility */}
      <pattern id="pat-hlines" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="1" width="2" height="6" fill="var(--pf,#22C55E)"/>
        <rect x="1" y="3" width="6" height="2" fill="var(--pf,#22C55E)"/>
      </pattern>
      <pattern id="pat-vlines" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="2" y="1" width="4" height="1" fill="var(--pf,#EF4444)"/>
        <rect x="1" y="2" width="6" height="3" fill="var(--pf,#EF4444)"/>
        <rect x="2" y="5" width="4" height="1" fill="var(--pf,#EF4444)"/>
        <rect x="3" y="6" width="2" height="1" fill="var(--pf,#EF4444)"/>
      </pattern>
      <pattern id="pat-diagf" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="0" width="2" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="2" y="1" width="4" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="1" y="2" width="6" height="2" fill="var(--pf,#FACC15)"/>
        <rect x="2" y="4" width="4" height="1" fill="var(--pf,#FACC15)"/>
        <rect x="3" y="5" width="2" height="1" fill="var(--pf,#FACC15)"/>
      </pattern>
      <pattern id="pat-diagb" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="1" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="5" y="1" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#60A5FA)"/>
        <rect x="3" y="3" width="2" height="2" fill="var(--pf,#60A5FA)" opacity="0.5"/>
      </pattern>
      <pattern id="pat-checker" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="1" width="2" height="2" fill="var(--pf,#A855F7)"/>
        <rect x="5" y="1" width="2" height="2" fill="var(--pf,#A855F7)"/>
        <rect x="3" y="3" width="2" height="2" fill="var(--pf,#A855F7)" opacity="0.4"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#A855F7)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#A855F7)"/>
      </pattern>
      <pattern id="pat-dots" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="4" y="1" width="2" height="1" fill="var(--pf,#34D399)"/>
        <rect x="3" y="2" width="4" height="2" fill="var(--pf,#34D399)"/>
        <rect x="2" y="4" width="4" height="1" fill="var(--pf,#34D399)"/>
        <rect x="3" y="5" width="2" height="1" fill="var(--pf,#34D399)"/>
      </pattern>
      <pattern id="pat-hdense" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="0" y="1" width="3" height="2" fill="var(--pf,#FB923C)"/>
        <rect x="5" y="1" width="3" height="2" fill="var(--pf,#FB923C)"/>
        <rect x="2" y="5" width="4" height="2" fill="var(--pf,#FB923C)"/>
      </pattern>
      <pattern id="pat-wave" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="3" y="0" width="2" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="1" y="2" width="6" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="0" y="4" width="8" height="1" fill="var(--pf,#F472B6)"/>
        <rect x="1" y="5" width="2" height="2" fill="var(--pf,#F472B6)"/>
        <rect x="5" y="5" width="2" height="2" fill="var(--pf,#F472B6)"/>
      </pattern>
      <pattern id="pat-checker2" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--pb,#000)"/>
        <rect x="1" y="2" width="3" height="1" fill="var(--pf,#94A3B8)"/>
        <rect x="5" y="2" width="2" height="1" fill="var(--pf,#94A3B8)"/>
        <rect x="2" y="5" width="4" height="1" fill="var(--pf,#94A3B8)"/>
      </pattern>
    </defs>
  )
}

// ── PIXEL FLOATING ANIMATION ─────────────────────────────────
export function PixelFloatStyles() {
  return (
    <style>{`
      @keyframes pixelFloat {
        0%   { transform: translateY(0px) rotate(0deg); opacity: 0.65; }
        20%  { transform: translateY(-8px) rotate(1.2deg); opacity: 1; }
        45%  { transform: translateY(-13px) rotate(-0.8deg); opacity: 0.85; }
        70%  { transform: translateY(-6px) rotate(1.5deg); opacity: 1; }
        85%  { transform: translateY(-2px) rotate(-0.3deg); opacity: 0.8; }
        100% { transform: translateY(0px) rotate(0deg); opacity: 0.65; }
      }
      @keyframes pixelDrift {
        0%   { transform: translate(0,0) scale(1) rotate(0deg); opacity: 0.7; }
        25%  { transform: translate(4px,-9px) scale(1.06) rotate(2deg); opacity: 1; }
        50%  { transform: translate(-3px,-14px) scale(0.95) rotate(-1.5deg); opacity: 0.8; }
        75%  { transform: translate(5px,-6px) scale(1.03) rotate(1deg); opacity: 0.95; }
        100% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 0.7; }
      }
      @keyframes pixelPulse {
        0%,100% { opacity: 0.55; transform: scale(1) rotate(0deg); }
        50%     { opacity: 1;    transform: scale(1.12) rotate(3deg); }
      }
    `}</style>
  )
}

export function pixelFloatStyle(delay = 0, variant: 'float'|'drift'|'pulse' = 'float', seed = 0): React.CSSProperties {
  const baseFloat = 3.8 + (seed % 7) * 0.35
  const baseDrift = 5.2 + (seed % 5) * 0.4
  const dur = variant === 'float' ? `${baseFloat}s` : variant === 'drift' ? `${baseDrift}s` : '3.1s'
  return {
    animation: `pixel${variant.charAt(0).toUpperCase()+variant.slice(1)} ${dur} ease-in-out ${delay}s infinite`,
  }
}

export function FloatingPixel({
  size = 16, pattern, delay = 0, style, seed = 0,
}: {
  size?: number; pattern: PatternConfig; delay?: number; style?: React.CSSProperties; seed?: number
}) {
  return (
    <svg width={size} height={size}
      style={{ ...pixelFloatStyle(delay, 'drift', seed), borderRadius: 3, ...style }}
      aria-hidden>
      <PatternDefs />
      <rect width={size} height={size} fill={`url(#${pattern.id})`} style={patStyle(pattern)} />
    </svg>
  )
}

export function PatternLegendItem({ pattern, label }: { pattern: PatternConfig; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <svg width="24" height="14" aria-hidden="true">
        <PatternDefs />
        <rect width="24" height="14" fill={`url(#${pattern.id})`} style={patStyle(pattern)} />
      </svg>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
