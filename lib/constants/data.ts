/**
 * Data constants - Party aliases and normalization
 * Extracted from lib/parliamentarians.ts
 */

export const PARTIDO_ALIASES: Record<string, string> = {
  'PL': 'PL',
  'PARTIDO LIBERAL': 'PL',
  'PT': 'PT',
  'PARTIDO DOS TRABALHADORES': 'PT',
  'UNIÃO': 'UNIÃO',
  'UNIÃO BRASIL': 'UNIÃO',
  'PSD': 'PSD',
  'PARTIDO SOCIAL DEMOCRÁTICO': 'PSD',
  'MDB': 'MDB',
  'MOVIMENTO DEMOCRÁTICO BRASILEIRO': 'MDB',
  'PP': 'PP',
  'PARTIDO PROGRESSISTA': 'PP',
  'PROGRESSISTAS': 'PP',
  'REPUBLICANOS': 'REPUBLICANOS',
  'PARTIDO REPUBLICANO BRASILEIRO': 'REPUBLICANOS',
  'PRB': 'REPUBLICANOS',
  'PDT': 'PDT',
  'PARTIDO DEMOCRÁTICO TRABALHADOR': 'PDT',
  'PSDB': 'PSDB',
  'PARTIDO DA SOCIAL DEMOCRACIA BRASILEIRA': 'PSDB',
  'PODE': 'PODE',
  'PARTIDO PODEMOS': 'PODE',
  'PODEMOS': 'PODE',
  'AVANTE': 'AVANTE',
  'PARTIDO AVANTE': 'AVANTE',
  'SOLIDARIEDADE': 'SOLIDARIEDADE',
  'PARTIDO SOLIDARIEDADE': 'SOLIDARIEDADE',
  'PSB': 'PSB',
  'PARTIDO SOCIALISTA BRASILEIRO': 'PSB',
  'PCDOB': 'PCdoB',
  'PC DO B': 'PCdoB',
  'PARTIDO COMUNISTA DO BRASIL': 'PCdoB',
  'CIDADANIA': 'CIDADANIA',
  'PARTIDO CIDADANIA': 'CIDADANIA',
  'PSOL': 'PSOL',
  'PARTIDO SOCIALISMO E LIBERDADE': 'PSOL',
  'PV': 'PV',
  'PARTIDO VERDE': 'PV',
  'NOVO': 'NOVO',
  'PARTIDO NOVO': 'NOVO',
  'PRD': 'PRD',
  'PARTIDO REFORMADOR DEMOCRÁTICO': 'PRD',
  'AGIR': 'AGIR',
  'PARTIDO AGIR': 'AGIR',
  'DC': 'DC',
  'PARTIDO DA CAUSA': 'DC',
  'PARTIDO DA CAUSA OBREIRA': 'DC',
  'REDE': 'REDE',
  'REDE SUSTENTABILIDADE': 'REDE',
  'S.PART.': 'S.PART.',
  'SEM PARTIDO': 'S.PART.',
  'PCO': 'PCO',
  'PARTIDO COMUNISTA OPERÁRIO': 'PCO',
  'UP': 'UP',
  'UNIDADE POPULAR': 'UP',
  'PATRIOTA': 'PATRIOTA',
  'PMB': 'PMB',
  'PARTIDO DA MULHER BRASILEIRA': 'PMB',
}

/**
 * Normalize party name - handle variations and typos from API
 */
export function normalizePartido(party: string): string {
  if (!party) return 'S.PART.'
  const upper = party.trim().toUpperCase()
  const normalized = PARTIDO_ALIASES[upper]
  
  // If not in aliases, try to find a partial match or return as-is
  if (!normalized) {
    // Try partial match for common variations
    for (const [key, value] of Object.entries(PARTIDO_ALIASES)) {
      if (upper.includes(key) || key.includes(upper)) {
        return value
      }
    }
    return upper // Return as-is if no match
  }
  return normalized
}

/**
 * Statistical framework constants (Karina Marra)
 * Z-scores: z = (x - μ) / σ for contextualizing values
 */
export const STATS = {
  EMENDAS: { media: 17.6, desvio: 58.8 }, // ~R$17.6M average, ~R$58.8M stddev
  PATRIMONIO: { media: 1500, desvio: 3000 }, // ~R$1.5M average
  COTAS: { media: 200, desvio: 100 },
  FREQUENCIA: { media: 80, desvio: 15 },
} as const

/**
 * Z-score label thresholds
 */
export function getZScoreLabel(z: number): { label: string; comparacao: string } {
  const absZ = Math.abs(z)
  if (z > 2) return { label: 'Muito acima', comparacao: 'Top ~2%' }
  if (z > 1.5) return { label: 'Acima', comparacao: 'Top ~7%' }
  if (z > 1) return { label: 'Acima da média', comparacao: 'Acima de 84%' }
  if (z > 0.5) return { label: 'Levemente acima', comparacao: 'Acima de 69%' }
  if (z >= -0.5) return { label: 'Na média', comparacao: 'Entre 31-69%' }
  if (z >= -1) return { label: 'Levemente abaixo', comparacao: 'Abaixo de 31%' }
  if (z >= -1.5) return { label: 'Abaixo da média', comparacao: 'Abaixo de 16%' }
  if (z >= -2) return { label: 'Abaixo', comparacao: 'Bottom ~7%' }
  return { label: 'Muito abaixo', comparacao: 'Bottom ~2%' }
}
