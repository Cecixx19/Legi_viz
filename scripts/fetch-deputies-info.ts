/**
 * Fetch party info for all deputies (simplified)
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
        execSync('sleep 5')
        continue
      }
      return JSON.parse(output)
    } catch (e) {
      if (i === retries - 1) throw e
    }
  }
  throw new Error('Failed')
}

async function main() {
  console.log('=== Fetching Deputy Party Info ===\n')
  
  // Get all deputies with party info
  const partyInfo: Record<number, { partido: string; uf: string; situacao: string }> = {}
  
  let page = 1
  while (page <= 10) {
    const url = `${API_BASE}/deputados?itens=100&pagina=${page}&ordem=ASC&ordenarPor=nome`
    console.log('Fetching page ' + page + '...')
    
    try {
      const result = fetchJson(url)
      const dados = result.dados || []
      if (dados.length === 0) break
      
      for (const d of dados) {
        const status = d.ultimoStatus || d
        partyInfo[d.id] = {
          partido: status.siglaPartido || 'N/A',
          uf: status.siglaUf || 'N/A',
          situacao: status.situacao || 'N/A'
        }
      }
      page++
    } catch (e) {
      break
    }
  }
  
  // Save
  const outputPath = join(OUTPUT_DIR, 'deputados-info.json')
  writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalDeputies: Object.keys(partyInfo).length,
    partyInfo
  }, null, 2))
  
  console.log('\nDone! Saved ' + Object.keys(partyInfo).length + ' deputies to ' + outputPath)
}

main()
