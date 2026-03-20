/**
 * Fetch proposition details for votings and cache them
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const OUTPUT_DIR = join(process.cwd(), 'public/data')
const CACHE_FILE = join(OUTPUT_DIR, 'votacoes-proposicoes.json')

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
  console.log('=== Fetching Proposition Details for Votings ===\n')
  
  // Load existing voting details
  const detailsPath = join(OUTPUT_DIR, 'votacoes-detalhes.json')
  if (!existsSync(detailsPath)) {
    console.error('votacoes-detalhes.json not found. Run fetch-votacoes.ts first.')
    return
  }
  
  const details = JSON.parse(readFileSync(detailsPath, 'utf8'))
  
  // Load existing cache
  let cache: Record<string, any> = {}
  if (existsSync(CACHE_FILE)) {
    cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
    console.log('Loaded existing cache with ' + Object.keys(cache).length + ' propositions')
  }
  
  // Collect unique voting IDs
  const votingIds = new Set<string>()
  for (const deputy of Object.values(details.votesByDeputy) as any[]) {
    for (const vote of deputy.votes) {
      if (vote.proposicao === null && !cache[vote.votingId]) {
        votingIds.add(vote.votingId)
      }
    }
  }
  
  console.log('Need to fetch ' + votingIds.size + ' voting details')
  
  let fetched = 0
  let cached = 0
  
  for (const votingId of votingIds) {
    if (cache[votingId]) {
      cached++
      continue
    }
    
    try {
      const url = API_BASE + '/votacoes/' + votingId
      const result = fetchJson(url)
      
      if (result.dados) {
        const dados = result.dados
        const proposicoesAfetadas = dados.proposicoesAfetadas || []
        const objetosPossiveis = dados.objetosPossiveis || []
        
        // Main proposition from proposicoesAfetadas
        const mainProp = proposicoesAfetadas[0]
        
        // Try to get the main proposal (PL, PEC, etc.) from objetosPossiveis
        const mainObj = objetosPossiveis.find((o: any) => 
          ['PL', 'PLP', 'PEC', 'PDL', 'MPV'].includes(o.siglaTipo)
        ) || objetosPossiveis[0]
        
        const proposicao = mainProp || mainObj
        const ementa = proposicao?.ementa || dados.descricao || ''
        const siglaNumero = proposicao ? `${proposicao.siglaTipo || ''} ${proposicao.numero}/${proposicao.ano || ''}`.trim() : ''
        
        cache[votingId] = {
          votingId,
          data: dados.data,
          descricao: dados.descricao || '',
          ementa: ementa.substring(0, 200),
          proposicao: proposicao ? {
            id: proposicao.id,
            siglaTipo: proposicao.siglaTipo,
            numero: proposicao.numero,
            ano: proposicao.ano,
            ementa: proposicao.ementa || '',
            url: `https://www.camara.leg.br/propostas-legislativas/${proposicao.id}`,
          } : null,
          siglaNumero
        }
        
        fetched++
        
        if (fetched % 20 === 0) {
          console.log('Fetched ' + fetched + ', cached: ' + cached + ', total: ' + Object.keys(cache).length)
        }
      }
      
      // Rate limiting
      await sleep(200)
      
    } catch (e) {
      console.error('Error fetching ' + votingId + ':', e)
      await sleep(3000)
    }
  }
  
  // Save cache
  writeFileSync(CACHE_FILE, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    propositions: cache
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total propositions cached: ' + Object.keys(cache).length)
  console.log('Newly fetched: ' + fetched)
  console.log('Already cached: ' + cached)
  console.log('Saved to: ' + CACHE_FILE)
}

main()
