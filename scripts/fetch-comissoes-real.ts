/**
 * Fetch real committee memberships for all deputies from Câmara API
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

async function main() {
  console.log('=== Fetching Real Committee Memberships ===\n')
  
  const comissoesByDeputy: Record<number, { id: number; sigla: string; nome: string; cargo: string }[]> = {}
  
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
  
  // Fetch committees for each deputy
  let fetched = 0
  let skipped = 0
  
  for (const deputyId of deputyIds) {
    if (comissoesByDeputy[deputyId]) {
      skipped++
      continue
    }
    
    try {
      // Try the orgãos endpoint for the deputy
      const url = `${API_BASE}/deputados/${deputyId}/orgaos`
      const result = fetchJson(url)
      
      const comissoes = []
      for (const item of result.dados || []) {
        if (item.siglaOrgao && !['PLEN', 'CN', 'MESA', 'CCP', 'PTCOM', 'PC'].includes(item.siglaOrgao)) {
          comissoes.push({
            id: item.idOrgao,
            sigla: item.siglaOrgao || '',
            nome: item.nomeOrgao || '',
            cargo: item.titulo || 'Membro'
          })
        }
      }
      
      comissoesByDeputy[deputyId] = comissoes
      fetched++
      
      if (fetched % 50 === 0) {
        console.log('Fetched: ' + fetched + ', skipped: ' + skipped + ', total: ' + Object.keys(comissoesByDeputy).length)
      }
    } catch (e) {
      comissoesByDeputy[deputyId] = []
    }
    
    await sleep(150)
  }
  
  // Count stats
  const totalWithComissao = Object.values(comissoesByDeputy).filter(c => c.length > 0).length
  
  // Save
  const outputPath = join(OUTPUT_DIR, 'comissoes-real.json')
  writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    url: `${API_BASE}/deputados/{id}/orgaos`,
    totalDeputies: Object.keys(comissoesByDeputy).length,
    deputiesWithComissao: totalWithComissao,
    comissoesByDeputy
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total deputies: ' + deputyIds.length)
  console.log('Deputies with committee membership: ' + totalWithComissao)
  console.log('Saved to: ' + outputPath)
  
  // Sample
  const samples = Object.entries(comissoesByDeputy).filter(([, c]) => c.length > 0).slice(0, 5)
  for (const [id, coms] of samples) {
    console.log('\nDeputy ' + id + ':')
    for (const c of coms.slice(0, 3)) {
      console.log('  - ' + c.sigla + ': ' + c.cargo)
    }
  }
}

main()
