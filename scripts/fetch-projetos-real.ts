/**
 * Fetch real proposition COUNTS for all deputies from Câmara API
 * Much faster - only gets the total count, not all propositions
 */

import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const OUTPUT_DIR = join(process.cwd(), 'public/data')
const API_BASE = 'https://dadosabertos.camara.leg.br/api/v2'

function fetchJson(url: string, retries = 3): any {
  for (let i = 0; i < retries; i++) {
    try {
      const output = execSync('curl -s "' + url + '"', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
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

interface ProposicaoStats {
  total: number
  PL: number
  PEC: number
  PLP: number
  MPV: number
  REQ: number
  outros: number
}

async function fetchDeputyPropositionCounts(deputyId: number): Promise<ProposicaoStats | null> {
  try {
    // Fetch recent propositions to count by type
    const url = `${API_BASE}/proposicoes?idDeputadoAutor=${deputyId}&itens=100&ordem=DESC&ordenarPor=id`
    const result = fetchJson(url)
    
    const stats: ProposicaoStats = {
      total: result.dados?.length || 0,
      PL: 0,
      PEC: 0,
      PLP: 0,
      MPV: 0,
      REQ: 0,
      outros: 0,
    }
    
    // Estimate total based on pages in links
    const links = result.links || []
    const lastLink = links.find((l: any) => l.rel === 'last')
    if (lastLink) {
      const match = lastLink.href.match(/pagina=(\d+)/)
      if (match) {
        stats.total = parseInt(match[1]) * 100
      }
    }
    
    // Count by type from current page
    for (const prop of result.dados || []) {
      const tipo = prop.siglaTipo || ''
      if (tipo === 'PL') stats.PL++
      else if (tipo === 'PEC') stats.PEC++
      else if (tipo === 'PLP') stats.PLP++
      else if (tipo === 'MPV') stats.MPV++
      else if (tipo === 'REQ') stats.REQ++
      else stats.outros++
    }
    
    return stats
  } catch (e) {
    return null
  }
}

async function main() {
  console.log('=== Fetching Proposition Counts for All Deputies ===\n')
  
  // Load existing cache
  const cacheFile = join(OUTPUT_DIR, 'projetos-real.json')
  let cache: Record<number, ProposicaoStats> = {}
  if (existsSync(cacheFile)) {
    try {
      const existing = JSON.parse(require('fs').readFileSync(cacheFile, 'utf8'))
      cache = existing.projetosByDeputy || {}
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
  
  // Fetch proposition counts for each deputy
  let fetched = 0
  let skipped = 0
  
  for (const deputyId of deputyIds) {
    if (cache[deputyId]) {
      skipped++
      continue
    }
    
    const stats = await fetchDeputyPropositionCounts(deputyId)
    if (stats) {
      cache[deputyId] = stats
    }
    
    fetched++
    if (fetched % 50 === 0) {
      console.log('Fetched: ' + fetched + ', skipped: ' + skipped + ', total: ' + Object.keys(cache).length)
    }
    
    // Rate limiting
    await sleep(150)
  }
  
  // Save cache
  writeFileSync(cacheFile, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    url: `${API_BASE}/proposicoes?idDeputadoAutor={id}`,
    totalDeputies: Object.keys(cache).length,
    projetosByDeputy: cache
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total deputies: ' + deputyIds.length)
  console.log('Newly fetched: ' + fetched)
  console.log('Already cached: ' + skipped)
  console.log('Saved to: ' + cacheFile)
  
  // Sample output
  const samples = Object.entries(cache).slice(0, 5)
  for (const [id, stats] of samples) {
    console.log('\nDeputy ' + id + ': ' + stats.total + ' props (PL: ' + stats.PL + ', PEC: ' + stats.PEC + ')')
  }
}

main()
