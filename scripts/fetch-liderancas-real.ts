/**
 * Fetch real leadership positions for all deputies from Câmara API
 * - Mesa Diretora (board)
 * - Party leaders and vice-leaders
 * - Committee chairs
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

interface Lideranca {
  tipo: 'Mesa' | 'Partido' | 'Comissão' | 'Bloco'
  cargo: string
  orgao?: string
  siglaOrgao?: string
  dataInicio?: string
}

async function main() {
  console.log('=== Fetching Real Leadership Positions ===\n')
  
  const liderancasByDeputy: Record<number, Lideranca[]> = {}
  
  // 1. Fetch Mesa Diretora (board of directors)
  console.log('Fetching Mesa Diretora...')
  try {
    const mesaData = fetchJson(`${API_BASE}/orgaos/4/membros?itens=100`)
    const membros = mesaData.dados || []
    
    for (const m of membros) {
      const id = m.id
      if (!liderancasByDeputy[id]) liderancasByDeputy[id] = []
      liderancasByDeputy[id].push({
        tipo: 'Mesa',
        cargo: m.titulo,
        orgao: 'Mesa Diretora da Câmara dos Deputados',
        siglaOrgao: 'MESA',
        dataInicio: m.dataInicio
      })
    }
    
    console.log('  Found ' + membros.length + ' Mesa members')
  } catch (e) {
    console.error('Error fetching Mesa:', e)
  }
  
  await sleep(500)
  
  // 2. Fetch party leaders and vice-leaders
  console.log('\nFetching Party Leaders...')
  try {
    const partidosData = fetchJson(`${API_BASE}/partidos?itens=100`)
    const partidos = partidosData.dados || []
    
    let partiesProcessed = 0
    for (const partido of partidos) {
      partiesProcessed++
      
      try {
        const partidoDetail = fetchJson(`${API_BASE}/partidos/${partido.id}`)
        const status = partidoDetail.dados?.status
        
        if (status?.lider) {
          const lider = status.lider
          const id = parseInt(lider.uri?.split('/').pop() || '0')
          if (id && !liderancasByDeputy[id]) liderancasByDeputy[id] = []
          if (id && !liderancasByDeputy[id].find(l => l.tipo === 'Partido' && l.cargo === 'Líder')) {
            liderancasByDeputy[id].push({
              tipo: 'Partido',
              cargo: 'Líder',
              orgao: partido.nome,
              siglaOrgao: partido.sigla,
              dataInicio: status.data
            })
          }
        }
        
        if (status?.viceLider) {
          const v = status.viceLider
          const id = parseInt(v.uri?.split('/').pop() || '0')
          if (id) {
            if (!liderancasByDeputy[id]) liderancasByDeputy[id] = []
            if (!liderancasByDeputy[id].find(l => l.tipo === 'Partido' && l.cargo === 'Vice-Líder')) {
              liderancasByDeputy[id].push({
                tipo: 'Partido',
                cargo: 'Vice-Líder',
                orgao: partido.nome,
                siglaOrgao: partido.sigla,
                dataInicio: status.data
              })
            }
          }
        }
        
        if (partiesProcessed % 10 === 0) {
          console.log('  Processed ' + partiesProcessed + ' parties...')
        }
        
        await sleep(100)
      } catch (e) {
        // Skip this party
      }
    }
    
    console.log('  Processed ' + partidos.length + ' parties total')
  } catch (e) {
    console.error('Error fetching parties:', e)
  }
  
  await sleep(500)
  
  // 3. Fetch committee chairs
  console.log('\nFetching Committee Chairs...')
  try {
    const orgãosData = fetchJson(`${API_BASE}/orgaos?itens=100`)
    const orgãos = orgãosData.dados || []
    
    // Filter for committees (type includes "Comissão")
    const comissões = orgãos.filter((o: any) => 
      o.tipoOrgao?.includes('Comissão') || 
      o.sigla?.startsWith('CCJ') ||
      o.sigla?.startsWith('CCT') ||
      o.sigla?.startsWith('CFT') ||
      o.sigla?.startsWith('CME') ||
      o.sigla?.startsWith('CSP') ||
      o.sigla?.startsWith('Cultura') ||
      o.sigla?.startsWith('CDC') ||
      o.sigla?.startsWith('CTASP')
    )
    
    let chairsFound = 0
    for (const org of comissões.slice(0, 30)) {
      try {
        const membrosData = fetchJson(`${API_BASE}/orgaos/${org.id}/membros?itens=10`)
        const membros = membrosData.dados || []
        
        // Find president
        const presidente = membros.find((m: any) => 
          m.titulo?.toLowerCase().includes('presidente') ||
          m.codTitulo === 1
        )
        
        if (presidente) {
          const id = presidente.id
          if (!liderancasByDeputy[id]) liderancasByDeputy[id] = []
          if (!liderancasByDeputy[id].find(l => l.tipo === 'Comissão' && l.siglaOrgao === org.sigla)) {
            liderancasByDeputy[id].push({
              tipo: 'Comissão',
              cargo: 'Presidente',
              orgao: org.nome,
              siglaOrgao: org.sigla,
              dataInicio: presidente.dataInicio
            })
            chairsFound++
          }
        }
        
        await sleep(100)
      } catch (e) {
        // Skip this committee
      }
    }
    
    console.log('  Found ' + chairsFound + ' committee chairs')
  } catch (e) {
    console.error('Error fetching committees:', e)
  }
  
  // Count statistics
  const totalWithLideranca = Object.keys(liderancasByDeputy).length
  const byTipo = { Mesa: 0, Partido: 0, Comissão: 0, Bloco: 0 }
  for (const [, lids] of Object.entries(liderancasByDeputy)) {
    for (const l of lids as Lideranca[]) {
      byTipo[l.tipo] = (byTipo[l.tipo as keyof typeof byTipo] || 0) + 1
    }
  }
  
  // Save
  const outputPath = join(OUTPUT_DIR, 'liderancas-real.json')
  writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos API',
    totalDeputies: totalWithLideranca,
    byTipo,
    liderancasByDeputy
  }, null, 2))
  
  console.log('\n=== Results ===')
  console.log('Deputies with leadership positions: ' + totalWithLideranca)
  console.log('By type:', byTipo)
  console.log('Saved to: ' + outputPath)
  
  // Sample
  const samples = Object.entries(liderancasByDeputy).slice(0, 5)
  for (const [id, lids] of samples) {
    console.log('\nDeputy ' + id + ':')
    for (const l of lids as Lideranca[]) {
      console.log('  - ' + l.tipo + ': ' + l.cargo + ' (' + l.siglaOrgao + ')')
    }
  }
}

main()
