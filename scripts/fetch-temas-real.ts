/**
 * Fetch real theme scores for all deputies based on their propositions
 * Analyzes proposition ementas to determine legislative themes
 */

import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const OUTPUT_DIR = join(process.cwd(), 'public/data')
const API_BASE = 'https://dadosabertos.camara.leg.br/api/v2'

// Theme keywords for classification
const THEME_KEYWORDS = [
  // Saúde (0)
  ['saúde', 'médico', 'hospital', 'sus', 'vacina', 'epidemia', 'pandemia', 'enfermagem', 'mortalidade', 'natalidade', 'alimentação', 'nutrição', 'droga', 'medicamento', 'tratamento'],
  // Segurança (1)
  ['segurança', 'crime', 'policia', 'armamento', 'pistola', 'violência', 'criminalidade', 'penitenciária', 'prisão', 'tráfico', 'milícia'],
  // Educação (2)
  ['educação', 'escola', 'universidade', 'ensino', 'professor', 'aluno', 'campus', 'faculdade', 'instituto', 'pesquisa', 'ciência', 'tecnologia', 'inovac'],
  // Agropecuária (3)
  ['agro', 'rural', 'agrícola', 'pecuária', 'fundiário', 'reforma agrária', 'agricultor', 'lavoura', 'safra', 'desmatamento'],
  // Economia (4)
  ['tribut', 'imposto', 'receita', 'orçament', 'financeiro', 'fiscal', 'banco', 'moeda', 'inflação', 'juros', 'investimento', 'comércio', 'exportação', 'importação', 'indústria', 'empresa', 'negócio'],
  // Meio Ambiente (5)
  ['ambiental', 'meio ambiente', 'clima', 'preservação', 'biodiversidade', 'floresta', 'rio', 'lixo', 'poluição', 'sustentável', 'energia', 'petróleo', 'mineração'],
  // Trabalho (6)
  ['trabalh', 'emprego', 'salário', 'previdência', 'seguro', 'desemprego', 'clt', 'contrato', 'ferramenta', 'mão de obra', 'sindicato'],
  // Direitos (7)
  ['direito', 'constitui', 'cidadania', 'cível', 'penal', 'família', 'criança', 'idoso', 'mulher', 'negro', 'indígena', 'deficiência', 'lgbt', 'discriminação', 'racismo'],
]

// 8 themes matching TEMAS array
const THEMAS = ['Saúde', 'Segurança', 'Educação', 'Agropecuária', 'Economia', 'Meio Ambiente', 'Trabalho', 'Direitos']

function classifyTheme(ementa: string): number {
  const text = ementa.toLowerCase()
  
  // Count keyword matches for each theme
  const scores = THEME_KEYWORDS.map((keywords, themeIdx) => {
    let count = 0
    for (const kw of keywords) {
      if (text.includes(kw)) count++
    }
    return { themeIdx, count }
  })
  
  // Find theme with most matches
  scores.sort((a, b) => b.count - a.count)
  
  if (scores[0].count > 0) {
    return scores[0].themeIdx
  }
  return 4 // Default to Economy if no match
}

function fetchJson(url: string, retries = 3): any {
  for (let i = 0; i < retries; i++) {
    try {
      const output = execSync('curl -s "' + url + '"', { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 })
      if (output.startsWith('upstream')) {
        console.log('  Rate limited, waiting...')
        execSync('sleep 10')
        continue
      }
      return JSON.parse(output)
    } catch (e) {
      if (i === retries - 1) throw e
      console.log('  Retrying...')
      execSync('sleep 5')
    }
  }
  throw new Error('Failed after retries')
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface TemasStats {
  temas: number[]  // Theme scores (0-100 for each of 8 themes)
  mainTheme: number  // Index of main theme
  totalProps: number
}

async function fetchDeputyTemas(deputyId: number): Promise<TemasStats | null> {
  try {
    // Fetch recent propositions (just the first page for speed)
    const url = `${API_BASE}/proposicoes?idDeputadoAutor=${deputyId}&itens=100&ordem=DESC&ordenarPor=id`
    const result = fetchJson(url)
    
    const props = result.dados || []
    if (props.length === 0) return null
    
    // Count themes from ementas
    const themeCounts = new Array(8).fill(0)
    
    for (const prop of props) {
      const ementa = prop.ementa || ''
      if (ementa.length > 20) { // Only count if ementa is substantial
        const themeIdx = classifyTheme(ementa)
        themeCounts[themeIdx]++
      }
    }
    
    // Calculate percentages
    const total = themeCounts.reduce((a, b) => a + b, 0)
    if (total === 0) return null
    
    const temas = themeCounts.map(c => Math.round((c / total) * 100))
    
    // Find main theme
    let mainTheme = 0
    let maxCount = 0
    for (let i = 0; i < temas.length; i++) {
      if (temas[i] > maxCount) {
        maxCount = temas[i]
        mainTheme = i
      }
    }
    
    return { temas, mainTheme, totalProps: total }
  } catch (e) {
    return null
  }
}

async function main() {
  console.log('=== Fetching Real Theme Scores for All Deputies ===\n')
  
  // Load existing cache
  const cacheFile = join(OUTPUT_DIR, 'temas-real.json')
  let cache: Record<number, TemasStats> = {}
  if (existsSync(cacheFile)) {
    try {
      const existing = JSON.parse(require('fs').readFileSync(cacheFile, 'utf8'))
      cache = existing.temasByDeputy || {}
      console.log('Loaded existing cache with ' + Object.keys(cache).length + ' deputies')
    } catch (e) {
      console.log('Starting fresh cache')
    }
  }
  
  // Get all deputy IDs from API
  console.log('Fetching deputy list...')
  const deputyIds: number[] = []
  let page = 1
  while (true) {
    const url = `${API_BASE}/deputados?itens=100&pagina=${page}&ordem=ASC&ordenarPor=nome`
    try {
      const result = fetchJson(url)
      const dados = result.dados || []
      if (dados.length === 0) break
      for (const d of dados) {
        deputyIds.push(d.id)
      }
      page++
      if (page > 10) break
      await sleep(100)
    } catch (e) {
      break
    }
  }
  
  console.log('Found ' + deputyIds.length + ' deputies\n')
  
  // Fetch themes for each deputy
  let fetched = 0
  let skipped = 0
  
  for (const deputyId of deputyIds) {
    if (cache[deputyId]) {
      skipped++
      continue
    }
    
    const temas = await fetchDeputyTemas(deputyId)
    if (temas) {
      cache[deputyId] = temas
    }
    
    fetched++
    if (fetched % 50 === 0) {
      console.log('Fetched: ' + fetched + ', skipped: ' + skipped + ', total: ' + Object.keys(cache).length)
    }
    
    await sleep(150)
  }
  
  // Save cache
  writeFileSync(cacheFile, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    url: `${API_BASE}/proposicoes?idDeputadoAutor={id}`,
    themes: THEMAS,
    totalDeputies: Object.keys(cache).length,
    temasByDeputy: cache
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total deputies: ' + deputyIds.length)
  console.log('Newly fetched: ' + fetched)
  console.log('Already cached: ' + skipped)
  console.log('Saved to: ' + cacheFile)
  
  // Theme distribution
  const themeDist = new Array(8).fill(0)
  for (const t of Object.values(cache)) {
    themeDist[t.mainTheme]++
  }
  console.log('\nMain theme distribution:')
  THEMAS.forEach((t, i) => {
    console.log('  ' + t + ': ' + themeDist[i] + ' deputies')
  })
  
  // Sample output
  const samples = Object.entries(cache).slice(0, 5)
  for (const [id, stats] of samples) {
    console.log('\nDeputy ' + id + ':')
    console.log('  Main: ' + THEMAS[stats.mainTheme] + ' (' + stats.temas[stats.mainTheme] + '%)')
    console.log('  Themes: ' + stats.temas.map((t, i) => THEMAS[i] + ':' + t + '%').join(', '))
  }
}

main()
