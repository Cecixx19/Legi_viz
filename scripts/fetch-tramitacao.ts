/**
 * Script para buscar projetos em tramitação dos deputados
 * Run with: npx tsx scripts/fetch-tramitacao.ts
 * 
 * Nota: Para cada deputy, busca todas as proposições e conta
 * apenas as que estão "em tramitação" (não arquivadas/apreciadas)
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const OUTPUT_FILE = join(process.cwd(), 'public/data/tramitacao-real.json')

interface Deputado {
  id: number
  nome: string
}

async function fetchDeputados(): Promise<Deputado[]> {
  const deputados: Deputado[] = []
  
  for (let page = 1; page <= 6; page++) {
    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&itens=100&ordem=ASC&ordenarPor=nome&pagina=${page}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) break
    
    const j = await res.json()
    const dados = j.dados ?? []
    if (dados.length === 0) break
    
    dados.forEach((d: any) => {
      deputados.push({ id: d.id, nome: d.ultimoStatus?.nomeEleitoral ?? d.nome })
    })
    console.log(`[Deputados] Page ${page}: ${dados.length}, total: ${deputados.length}`)
  }
  
  return deputados
}

// Final statuses that mean the proposition is done
const FINAL_STATUS = [
  'Arquivada', 'arquivada',
  'Transformada', 'transformada', 
  'Vetada', 'vetada total',
  'Retirada', 'retirada',
  'Apreciada', 'apreciada',
  'Prejudicada', 'prejudicada',
  'Complementação de Veto',
  'Decurso de prazo',
  'Rejeitada', 'rejeitada',
  'Convertida', 'convertida',
  'Lei nº', // Became law
  'Parecer',
]

function isEmTramitacao(prop: any): boolean {
  const desc = prop.statusProposicao?.descricaoSituacao || ''
  
  // Check if it's a final status
  for (const final of FINAL_STATUS) {
    if (desc.includes(final)) return false
  }
  
  // If it has a status and it's not final, it's tramitando
  if (desc.length > 0) return true
  
  // If no status, assume it's still active (recent props without status update)
  return true
}

async function fetchTramitacao(deputyId: number): Promise<{ total: number; tramitando: number }> {
  try {
    const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${deputyId}&itens=200`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return { total: 0, tramitando: 0 }
    
    const j = await res.json()
    const dados = j.dados ?? []
    
    let tramitando = 0
    for (const prop of dados) {
      if (isEmTramitacao(prop)) {
        tramitando++
      }
    }
    
    return { total: dados.length, tramitando }
  } catch (e) {
    return { total: 0, tramitando: 0 }
  }
}

async function main() {
  console.log('📥 Fetching deputados...')
  const deputados = await fetchDeputados()
  console.log(`   Total: ${deputados.length} deputados\n`)
  
  const tramitacao: Record<number, { total: number; tramitando: number }> = {}
  
  console.log('📊 Fetching tramitação data...')
  for (let i = 0; i < deputados.length; i++) {
    const d = deputados[i]
    const result = await fetchTramitacao(d.id)
    tramitacao[d.id] = result
    
    if ((i + 1) % 25 === 0 || i === deputados.length - 1) {
      console.log(`   Progress: ${i + 1}/${deputados.length} (${Math.round((i + 1) / deputados.length * 100)}%)`)
    }
    
    // Small delay to avoid rate limiting
    if ((i + 1) % 50 === 0) {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  
  console.log('\n💾 Saving to', OUTPUT_FILE)
  writeFileSync(OUTPUT_FILE, JSON.stringify(tramitacao, null, 2))
  
  // Stats
  const values = Object.values(tramitacao)
  const totalTramitando = values.reduce((a, b) => a + b.tramitando, 0)
  const avg = totalTramitando / values.length
  const max = Math.max(...values.map(v => v.tramitando))
  const withData = values.filter(v => v.tramitando > 0).length
  
  console.log('\n📈 Statistics:')
  console.log(`   Deputies with tramitação: ${withData}`)
  console.log(`   Average tramitando: ${avg.toFixed(1)}`)
  console.log(`   Max: ${max}`)
  console.log('\n✅ Done!')
}

main().catch(console.error)
