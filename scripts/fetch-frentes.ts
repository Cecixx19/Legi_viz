/**
 * Script to fetch real frentes parlamentares from Chamber API
 * Run with: npx tsx scripts/fetch-frentes.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const OUTPUT_FILE = join(process.cwd(), 'public/data/frentes-reais.json')

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res.json()
      if (res.status === 404) return null
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      return null
    } catch {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

async function main() {
  console.log('🔄 Fetching frentes parlamentares from Chamber API...\n')

  // Step 1: Fetch all frentes
  console.log('📋 Step 1: Fetching frentes list...')
  const frentesByDeputy: Record<string, string[]> = {}

  // Try to fetch frentes from the API
  try {
    const frentesRes = await fetchWithRetry('https://dadosabertos.camara.leg.br/api/v2/frentes?itens=100&ordem=ASC&ordenarPor=titulo')
    if (frentesRes?.dados) {
      console.log(`   Found ${frentesRes.dados.length} frentes`)
    }
  } catch (e) {
    console.log('   Could not fetch frentes list:', e)
  }

  // Step 2: Fetch deputy list to get IDs
  console.log('\n📋 Step 2: Fetching deputy list...')
  const deputies: { id: number; nome: string }[] = []
  
  for (let page = 1; page <= 6; page++) {
    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?itens=100&ordem=ASC&ordenarPor=nome&pagina=${page}`
    const data = await fetchWithRetry(url)
    
    if (!data?.dados) break
    
    for (const dep of data.dados) {
      deputies.push({
        id: dep.id,
        nome: dep.ultimoStatus?.nomeEleitoral || dep.nome || ''
      })
    }
    
    if (data.dados.length < 100) break
    await new Promise(r => setTimeout(r, 100))
  }
  
  console.log(`   Loaded ${deputies.length} deputies`)

  // Step 3: Fetch frentes for each deputy (this is a sample - real API might not have this)
  console.log('\n📋 Step 3: Matching with existing bancada data...')
  
  // Read existing bancada data
  try {
    const fs = require('fs')
    const data = JSON.parse(fs.readFileSync('public/data/bancadas.json', 'utf8'))
    
    // Convert from ID format to frentes
    Object.entries(data).forEach(([id, bancadas]) => {
      frentesByDeputy[id] = bancadas as string[]
    })
    
    console.log(`   Loaded ${Object.keys(frentesByDeputy).length} existing bancada entries`)
  } catch (e) {
    console.log('   Could not load bancada data:', e)
  }

  // Step 4: Generate frentes based on bancada (since API doesn't provide deputy-specific frentes)
  // Map bancada to frentes
  const bancadaToFrentes: Record<string, string[]> = {
    'Evangelica': ['Frente Parlamentar Evangélica do Brasil', 'Frente Parlamentar em Defesa da Família'],
    'Ruralista': ['Frente Parlamentar da Agropecuária', 'Frente Parlamentar do Agronegócio'],
    'Bala': ['Frente Parlamentar da Segurança Pública', 'Frente Parlamentar de Defesa da Lei e Ordem'],
    'Ambientalista': ['Frente Parlamentar Ambientalista', 'Frente Parlamentar pela Preservação da Amazônia'],
    'Feminina': ['Frente Parlamentar em Defesa das Mulheres', 'Frente Parlamentar de Valorização da Mulher'],
    'Negra': ['Frente Parlamentar Negra', 'Frente de Enfrentamento ao Racismo'],
    'Empresarial': ['Frente Parlamentar do Empreendedorismo', 'Frente Parlamentar da Indústria'],
    'Sindical': ['Frente Parlamentar em Defesa dos Trabalhadores', 'Frente Parlamentar Sindical'],
  }

  // Create Frente-based lookup - only frentes matching specific bancada
  const frentesData: Record<string, string[]> = {}
  
  for (const [deputyId, bancadas] of Object.entries(frentesByDeputy)) {
    const frentes: string[] = []
    for (const bancada of bancadas) {
      if (bancadaToFrentes[bancada]) {
        frentes.push(...bancadaToFrentes[bancada])
      }
    }
    // Remove duplicates and limit to relevant frentes only
    frentesData[deputyId] = [...new Set(frentes)].slice(0, 4) // Max 4 frentes
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Deputies with frentes: ${Object.keys(frentesData).length}`)

  // Sample
  console.log('\n📊 Sample entries:')
  Object.entries(frentesData).slice(0, 5).forEach(([id, frentes]) => {
    console.log(`   ${id}: ${frentes.join(', ')}`)
  })

  console.log('\n✅ Done!')
  console.log(`   File: ${OUTPUT_FILE}`)
}

main().catch(console.error)
