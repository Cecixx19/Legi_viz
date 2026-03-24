/**
 * Layout configuration constants
 * Extracted from components/network-graph.tsx
 */

export const GEO_POSITIONS: Record<string, [number, number]> = {
  RR: [0.24, 0.06], AP: [0.38, 0.09], AM: [0.17, 0.18], PA: [0.36, 0.19], MA: [0.52, 0.18],
  AC: [0.10, 0.28], RO: [0.19, 0.31], TO: [0.43, 0.30], PI: [0.55, 0.29], CE: [0.66, 0.20],
  RN: [0.73, 0.24], PB: [0.71, 0.30], PE: [0.68, 0.35], AL: [0.69, 0.41], SE: [0.67, 0.46],
  MT: [0.29, 0.41], GO: [0.38, 0.49], DF: [0.41, 0.53], BA: [0.57, 0.46],
  MS: [0.30, 0.58], MG: [0.48, 0.59], ES: [0.59, 0.58], RJ: [0.55, 0.67],
  SP: [0.44, 0.69], PR: [0.39, 0.77], SC: [0.39, 0.84], RS: [0.37, 0.92],
}

export const TEMAS_FULL = ['Saude', 'Seguranca', 'Agro', 'Educacao', 'Economia', 'Meio Ambiente', 'Infraestrutura', 'Direitos']

export const PATRIMONIO_LABELS = [
  'Não declarou',
  'Até R$1M',
  'R$1M–3M',
  'R$3M–7M',
  'R$7M–15M',
  'Acima R$15M',
] as const

export const ALINHAMENTO_LABELS = [
  'Oposicao (0-24%)',
  'Neutro (25-49%)',
  'Alinhado (50-74%)',
  'Governo (75-100%)',
]

export const COTAS_BUCKETS = [
  '600+ despesas',
  '400-599',
  '200-399',
  '1-199',
  'Sem despesas',
]

export const PATRIMONIO_BUCKETS = [
  'R$ 50 mi+',
  'R$ 10-50 mi',
  'R$ 5-10 mi',
  'R$ 1-5 mi',
  'R$ 500 mil-1 mi',
  'R$ 100-500 mil',
  '< R$ 100 mil',
  'Não declarado',
]

/**
 * Graph layout constants
 */
export const GRAPH = {
  // Default dimensions
  DEFAULT_WIDTH: 900,
  DEFAULT_HEIGHT: 600,
  
  // Mobile breakpoint
  MOBILE_BREAKPOINT: 600,
  
  // Padding
  PAD_LARGE: 110,
  PAD_SMALL: 70,
  PAD_MIN: 55,
  
  // Spacing
  SPACING_UF: 12,
  SPACING_RACA: 20,
  SPACING_GENERO: 18,
  SPACING_DEFAULT: 16,
  
  // Cluster layout
  CLUSTER_COLS_PARTIDO: 6,
  CLUSTER_COLS_BANCADA: 3,
  CLUSTER_COLS_PATRIMONIO: 4,
  
  // Repulsion
  REPulsion_MIN_GAP: 30,
  REPULSION_ITERS: 80,
} as const

/**
 * Node visualization constants
 */
export const NODE = {
  PIXEL_SIZE: 8,
  PIXEL_MARGIN: 5,
  HOVER_RADIUS: 12,
  CLICK_RADIUS: 15,
} as const

/**
 * Animation constants
 */
export const ANIMATION = {
  TRANSITION_DURATION: 750,
  COLOR_TRANSITION_DURATION: 500,
  UI_HIDE_DELAY: 4000,
  INITIAL_SEEN_KEY: 'legi-viz-animation-seen',
} as const
