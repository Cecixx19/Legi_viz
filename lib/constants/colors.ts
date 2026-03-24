/**
 * Color constants for Legi_viz
 * Extracted from components/network-graph.tsx and lib/parliamentarians.ts
 */

export const PARTY_COLORS: Record<string, string> = {
  PL:            '#22C55E',
  PT:            '#EF4444',
  UNIÃO:         '#3B82F6',
  PSD:           '#F97316',
  MDB:           '#FACC15',
  PP:            '#14B8A6',
  REPUBLICANOS:  '#A855F7',
  PDT:           '#EC4899',
  PSDB:          '#06B6D4',
  PODE:          '#84CC16',
  AVANTE:        '#F43F5E',
  SOLIDARIEDADE: '#8B5CF6',
  PSB:           '#FB923C',
  PCdoB:         '#DC2626',
  CIDADANIA:     '#0EA5E9',
  PSOL:          '#C026D3',
  PV:            '#16A34A',
  NOVO:          '#FBBF24',
  PRD:           '#64748B',
  AGIR:          '#0D9488',
  DC:            '#7C3AED',
  REDE:          '#10B981',
  'S.PART.':     '#6366F1',
  'PARTIDO(':    '#94A3B8',
  'FEDERAÇÃO':   '#F472B6',
  PCO:           '#EF4444',
  UP:            '#DC2626',
  PATRIOTA:      '#F59E0B',
  PMB:           '#EC4899',
}

export const UF_COLORS: Record<string, string> = {
  AC: '#10B981', AM: '#059669', AP: '#047857', PA: '#34D399', RO: '#6EE7B7', RR: '#A7F3D0', TO: '#D1FAE5',
  AL: '#F97316', BA: '#EA580C', CE: '#FB923C', MA: '#FACC15', PB: '#FCD34D', PE: '#FBBF24', PI: '#F59E0B', RN: '#D97706', SE: '#B45309',
  DF: '#A855F7', GO: '#9333EA', MS: '#7C3AED', MT: '#8B5CF6',
  ES: '#0EA5E9', MG: '#3B82F6', RJ: '#60A5FA', SP: '#1D4ED8',
  PR: '#EC4899', RS: '#DB2777', SC: '#F472B6',
}

export const TEMA_COLORS: Record<string, string> = {
  'Saude':         '#22C55E',
  'Seguranca':     '#EF4444',
  'Agro':          '#84CC16',
  'Educacao':      '#FACC15',
  'Economia':      '#3B82F6',
  'Meio Ambiente': '#14B8A6',
  'Infraestrutura':'#F97316',
  'Direitos':      '#EC4899',
}

export const GENERO_COLORS: Record<string, string> = {
  'Homem':        '#3B82F6',
  'Mulher':       '#EC4899',
  'Trans':        '#A855F7',
  'NaoBinarie':   '#F97316',
  'Homem Cis':    '#3B82F6',
  'Mulher Cis':   '#EC4899',
  'Mulher Trans': '#A855F7',
  'Não-binárie':  '#F97316',
}

export const FAIXA_ETARIA_COLORS: Record<string, string> = {
  '1 mandato':     '#38BDF8',
  '2-3 mandatos':  '#818CF8',
  '4-5 mandatos':  '#A78BFA',
  '6+ mandatos':   '#E879F9',
}

export const RACA_COLORS: Record<string, string> = {
  'Branco':     '#3B82F6',
  'Pardo':      '#EC4899',
  'Preto':      '#22C55E',
  'Amarelo':    '#F97316',
  'Indigena':   '#8B5CF6',
}

export const BANCADA_COLORS: Record<string, string> = {
  'Evangelica':     '#A855F7',
  'Ruralista':      '#84CC16',
  'Bala':           '#64748B',
  'Empresarial':    '#3B82F6',
  'Sindical':       '#EF4444',
  'Ambientalista':  '#22C55E',
  'Feminina':       '#EC4899',
  'Negra':          '#F59E0B',
  'Nenhuma':        '#94A3B8',
}

export const PATRIMONIO_COLORS = ['#94A3B8','#38BDF8','#818CF8','#F97316','#EF4444','#DC2626'] as const

export const VIVID_COLORS = [
  '#FF4D1C','#FFE135','#C8F752','#B8A9FF','#7FFFDA',
  '#FFD166','#A0D8FF','#FFC2B4','#D4F5A0','#FF85C8',
  '#FAEDCD','#CBF3F0','#FFBF69','#E9FF70','#C77DFF',
  '#38BDF8','#F472B6','#34D399','#FACC15','#FB923C',
] as const

export const LOADING_PALETTE = [
  '#FF4D1C','#FFE135','#C8F752','#B8A9FF','#7FFFDA',
  '#FFD166','#A0D8FF','#FFC2B4','#D4F5A0','#FF85C8',
  '#FFBF69','#E9FF70','#C77DFF','#38BDF8','#F472B6',
  '#34D399','#FACC15','#FB923C','#60A5FA','#EF4444',
] as const

/**
 * Generate consistent color from party name
 */
export function getPartyColor(party: string): string {
  if (PARTY_COLORS[party]) return PARTY_COLORS[party]
  
  // Generate fallback color from hash
  let hash = 0
  for (let i = 0; i < party.length; i++) {
    hash = ((hash << 5) - hash) + party.charCodeAt(i)
  }
  const h = Math.abs(hash) % 360
  const s = 60, l = 50
  
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l / 100 - c / 2
  
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

/**
 * Darken color for light mode (increase contrast on white background)
 */
export function darkenForLight(hex: string, amount = 0.15): string {
  if (!hex.startsWith('#')) return hex
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

/**
 * Linear interpolation between two colors
 */
export function lerpColor(a: string, b: string, t: number): string {
  const parse = (c: string): [number, number, number] => {
    if (c.startsWith('rgb')) {
      const m = c.match(/\d+/g)
      return m ? [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])] : [136, 136, 136]
    }
    const h = c.replace('#', '').padEnd(6, '0')
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  }
  const [ar,ag,ab] = parse(a)
  const [br,bg,bb] = parse(b)
  const r = Math.round(ar + (br-ar)*t)
  const g = Math.round(ag + (bg-ag)*t)
  const bv = Math.round(ab + (bb-ab)*t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bv.toString(16).padStart(2,'0')}`
}

/**
 * Blend colors from multiple bancadas for Venn diagram
 */
export function blendBancadaColors(bancadas: string[]): string {
  if (bancadas.length === 0) return '#94A3B8'
  if (bancadas.length === 1) return BANCADA_COLORS[bancadas[0]] || '#94A3B8'

  const colors = bancadas.map(b => BANCADA_COLORS[b] || '#94A3B8')

  const rgbValues = colors.map(c => {
    const hex = c.replace('#', '')
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  })

  const blended = rgbValues.reduce((acc, rgb) => ({
    r: acc.r + rgb.r,
    g: acc.g + rgb.g,
    b: acc.b + rgb.b,
  }), { r: 0, g: 0, b: 0 })

  const count = rgbValues.length
  const r = Math.round(blended.r / count)
  const g = Math.round(blended.g / count)
  const b = Math.round(blended.b / count)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
