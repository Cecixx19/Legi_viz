/**
 * Fetch real party history for all deputies from Câmara API
 * Gets party's history across different legislatures
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

interface PartidoHistory {
  partido: string
  uf?: string
  legislature: number
  anoInicio: number
  anoFim?: number
  situacao: string
}

async function fetchDeputyHistory(deputyId: number): Promise<PartidoHistory[]> {
  try {
    const history: PartidoHistory[] = []
    
    // Fetch current legislature (57)
    for (const leg of [57, 56, 55, 54, 53]) {
      try {
        const url = `${API_BASE}/deputados?itens=1&id=${deputyId}&idLegislatura=${leg}`
        const result = fetchJson(url)
        
        if (result.dados && result.dados.length > 0) {
          const deputy = result.dados[0]
          const status = deputy.ultimoStatus || deputy
          
          if (status.siglaPartido) {
            const existing = history.find(h => h.partido === status.siglaPartido && h.legislature === leg)
            if (!existing) {
              history.push({
                partido: status.siglaPartido,
                uf: status.siglaUf,
                legislature: leg,
                anoInicio: (57 - leg) * 4 + 2019, // 57 = 2019-2023, 56 = 2015-2019, etc.
                situacao: status.situacao || 'Exercício'
              })
            }
          }
        }
        await sleep(100)
      } catch (e) {
        // Skip this legislature
      }
    }
    
    return history
  } catch (e) {
    return []
  }
}

async function main() {
  console.log('=== Fetching Real Party History for All Deputies ===\n')
  
  // Load existing cache
  const cacheFile = join(OUTPUT_DIR, 'historico-partidario.json')
  let cache: Record<number, PartidoHistory[]> = {}
  if (existsSync(cacheFile)) {
    try {
      const existing = JSON.parse(require('fs').readFileSync(cacheFile, 'utf8'))
      cache = existing.historicoByDeputy || {}
      console.log('Loaded existing cache with ' + Object.keys(cache).length + ' deputies')
    } catch (e) {
      console.log('Starting fresh')
    }
  }
  
  // Get all deputy IDs
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
  
  // Fetch history for each deputy
  let fetched = 0
  let skipped = 0
  
  for (const deputyId of deputyIds) {
    if (cache[deputyId] && cache[deputyId].length > 0) {
      skipped++
      continue
    }
    
    const history = await fetchDeputyHistory(deputyId)
    if (history.length > 0) {
      cache[deputyId] = history
    }
    
    fetched++
    if (fetched % 50 === 0) {
      console.log('Fetched: ' + fetched + ', skipped: ' + skipped + ', total: ' + Object.keys(cache).length)
    }
    
    await sleep(150)
  }
  
  // Count stats
  const withHistory = Object.values(cache).filter(h => h.length > 1).length
  const withMultiple = Object.values(cache).filter(h => h.length > 1).length
  
  // Save
  writeFileSync(cacheFile, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    totalDeputies: Object.keys(cache).length,
    deputiesWithMultipleParties: withMultiple,
    historicoByDeputy: cache
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total deputies: ' + deputyIds.length)
  console.log('Newly fetched: ' + fetched)
  console.log('Already cached: ' + skipped)
  console.log('Deputies with party history: ' + Object.keys(cache).length)
  console.log('Deputies who changed parties: ' + withMultiple)
  console.log('Saved to: ' + cacheFile)
  
  // Samples
  console.log('\n=== Samples ===')
  const samples = Object.entries(cache).filter(([, h]) => h.length > 1).slice(0, 5)
  for (const [id, history] of samples) {
    console.log('\nDeputy ' + id + ':')
    for (const h of history) {
      console.log('  - ' + h.partido + ' (Legislatura ' + h.legislature + ')')
    }
  }
}

main()
