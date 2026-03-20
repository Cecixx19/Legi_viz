/**
 * Fetch real parliamentary fronts (frentes) for all deputies from Câmara API
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const OUTPUT_DIR = join(process.cwd(), 'public/data')
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

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

async function fetchDeputyFronts(deputyId: number): Promise<{ id: number; titulo: string }[]> {
  try {
    const url = `${API_BASE}/deputados/${deputyId}/frentes`
    const result = fetchJson(url)
    return (result.dados || []).map((f: any) => ({
      id: f.id,
      titulo: f.titulo
    }))
  } catch (e) {
    return []
  }
}

async function main() {
  console.log('=== Fetching Real Frentes for All Deputies ===\n')
  
  // Load existing frentes cache
  const cacheFile = join(OUTPUT_DIR, 'frentes-real.json')
  let cache: Record<number, any[]> = {}
  if (existsSync(cacheFile)) {
    cache = JSON.parse(readFileSync(cacheFile, 'utf8'))
    console.log('Loaded existing cache with ' + Object.keys(cache).length + ' deputies')
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
  
  // Fetch frentes for each deputy
  let fetched = 0
  let skipped = 0
  
  for (const deputyId of deputyIds) {
    if (cache[deputyId]) {
      skipped++
      continue
    }
    
    const frentes = await fetchDeputyFronts(deputyId)
    cache[deputyId] = frentes
    
    fetched++
    if (fetched % 50 === 0) {
      console.log('Fetched: ' + fetched + ', skipped: ' + skipped + ', total cached: ' + Object.keys(cache).length)
    }
    
    await sleep(150)
  }
  
  // Save cache
  writeFileSync(cacheFile, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    url: `${API_BASE}/deputados/{id}/frentes`,
    totalDeputies: Object.keys(cache).length,
    frentesByDeputy: cache
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total deputies: ' + deputyIds.length)
  console.log('Newly fetched: ' + fetched)
  console.log('Already cached: ' + skipped)
  console.log('Saved to: ' + cacheFile)
  
  // Sample output
  const samples = deputyIds.slice(0, 3)
  for (const id of samples) {
    const frentes = cache[id]
    console.log('\nDeputy ' + id + ': ' + frentes?.length + ' frentes')
    frentes?.slice(0, 3).forEach((f, i) => {
      console.log('  ' + (i + 1) + '. ' + f.titulo.substring(0, 60))
    })
  }
}

main()
