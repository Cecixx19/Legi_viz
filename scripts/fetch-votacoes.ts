/**
 * Fetch real voting records for all deputies from Câmara dos Deputados API
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
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
        require('child_process').execSync('sleep 5')
        continue
      }
      return JSON.parse(output)
    } catch (e) {
      if (i === retries - 1) throw e
      console.log('  Retrying...')
      require('child_process').execSync('sleep 3')
    }
  }
  throw new Error('Failed after retries')
}

async function fetchVotingsBatch(startDate: string, endDate: string, page: number): Promise<{ data: any[]; hasNext: boolean }> {
  // API limits date range to 3 months max
  const url = API_BASE + '/votacoes?dataInicio=' + startDate + '&dataFim=' + endDate + '&itens=100&pagina=' + page + '&ordem=DESC&ordenarPor=dataHoraRegistro'
  
  try {
    const result = fetchJson(url)
    
    if (result.status === 400) {
      console.log('  Date range too large, skipping')
      return { data: [], hasNext: false }
    }
    
    const items = result.dados || []
    const links = result.links || []
    const hasNext = links.some((l: any) => l.rel === 'next')
    return { data: items, hasNext }
  } catch (e) {
    console.error('Error fetching:', e)
    return { data: [], hasNext: false }
  }
}

async function fetchVotes(votingId: string): Promise<any[]> {
  const url = API_BASE + '/votacoes/' + votingId + '/votos'
  try {
    const result = fetchJson(url)
    return result.dados || []
  } catch (e) {
    return []
  }
}

async function main() {
  console.log('=== Fetching Real Voting Data from Câmara API ===\n')
  
  const deputyData: Record<number, any> = {}
  let totalVotings = 0
  
  // Query by quarters (max 3 months each)
  const quarters = [
    { start: '2025-01-01', end: '2025-03-31', name: '2025 Q1' },
    { start: '2025-04-01', end: '2025-06-30', name: '2025 Q2' },
    { start: '2024-10-01', end: '2024-12-31', name: '2024 Q4' },
    { start: '2024-07-01', end: '2024-09-30', name: '2024 Q3' },
    { start: '2024-04-01', end: '2024-06-30', name: '2024 Q2' },
    { start: '2024-01-01', end: '2024-03-31', name: '2024 Q1' },
    { start: '2023-10-01', end: '2023-12-31', name: '2023 Q4' },
    { start: '2023-07-01', end: '2023-09-30', name: '2023 Q3' },
  ]
  
  for (const q of quarters) {
    console.log('Processing ' + q.name + '...')
    
    let page = 1
    let hasMore = true
    let qVotings = 0
    
    while (hasMore) {
      const { data: votings, hasNext } = await fetchVotingsBatch(q.start, q.end, page)
      
      if (votings.length === 0) {
        hasMore = false
        break
      }
      
      for (const voting of votings) {
        // Only process PLEN (Plenário) votings
        if (voting.siglaOrgao !== 'PLEN') continue
        
        totalVotings++
        qVotings++
        
        const votes = await fetchVotes(voting.id)
        
        for (const vote of votes) {
          if (vote.deputado_ && vote.deputado_.id) {
            const id = vote.deputado_.id
            if (!deputyData[id]) {
              deputyData[id] = {
                deputyId: id,
                nome: vote.deputado_.nome || '',
                partido: vote.deputado_.siglaPartido || '',
                uf: vote.deputado_.siglaUf || '',
                votes: []
              }
            }
            
            deputyData[id].votes.push({
              votingId: voting.id,
              data: voting.data,
              voto: vote.tipoVoto || ''
            })
          }
        }
      }
      
      hasMore = hasNext
      page++
      
      if (qVotings > 0 && qVotings % 50 === 0) process.stdout.write('.');
      if (page > 20) break
      
      // Rate limiting - longer delay between pages
      await new Promise(r => setTimeout(r, 100))
    }
    
    console.log('  Found ' + qVotings + ' votings, ' + Object.keys(deputyData).length + ' total deputies')
    
    // Rate limiting - longer delay between quarters
    await new Promise(r => setTimeout(r, 2000))
  }
  
  // Calculate stats
  const stats: Record<number, any> = {}
  
  for (const [id, data] of Object.entries(deputyData)) {
    const deputyId = parseInt(id)
    
    const votesByDate = data.votes.sort((a: any, b: any) => a.data.localeCompare(b.data))
    
    const statsData = {
      deputyId,
      nome: data.nome,
      partido: data.partido,
      uf: data.uf,
      totalVotacoes: data.votes.length,
      sim: 0,
      nao: 0,
      obstrucao: 0,
      abstencao: 0,
      presente: 0,
      ausente: 0,
      primeiroVoto: votesByDate[0]?.data || '',
      ultimoVoto: votesByDate[votesByDate.length - 1]?.data || ''
    }
    
    for (const v of data.votes) {
      const voto = (v.voto || '').toLowerCase()
      if (voto === 'sim') statsData.sim++
      else if (voto === 'não' || voto === 'nao') statsData.nao++
      else if (voto === 'obstrução' || voto === 'obstrucao') statsData.obstrucao++
      else if (voto === 'abstenção' || voto === 'abstencao') statsData.abstencao++
      else if (voto === 'presente') statsData.presente++
      else if (voto === 'ausente' || voto === 'art. 17') statsData.ausente++
    }
    
    stats[deputyId] = statsData
  }
  
  // Save
  const outputPath = join(OUTPUT_DIR, 'votacoes-real.json')
  writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    sourceUrl: API_BASE + '/votacoes',
    totalVotingsProcessed: totalVotings,
    totalDeputies: Object.keys(stats).length,
    stats
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Total votings: ' + totalVotings)
  console.log('Total deputies: ' + Object.keys(stats).length)
  console.log('Saved to: ' + outputPath)
  
  const samples = Object.values(stats).slice(0, 5)
  for (const s of samples) {
    console.log('\n' + s.nome + ' (' + s.partido + '-' + s.uf + '):')
    console.log('  Total: ' + s.totalVotacoes + ', Sim: ' + s.sim + ', Não: ' + s.nao + ', Obstrução: ' + s.obstrucao)
    console.log('  Período: ' + s.primeiroVoto + ' a ' + s.ultimoVoto)
  }
}

main()
