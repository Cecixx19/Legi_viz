/**
 * Script para processar prestação de contas do TSE
 * - Lê arquivos extraídos por estado
 * - Processa dados de financiamento
 * 
 * Run with: npx tsx scripts/process-financiamento.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TSE_DIR = join(__dirname, '../.tse-tmp')
const EXTRACT_DIR = join(TSE_DIR, 'prestacao_extract')
const OUTPUT_FILE = join(__dirname, '../public/data/financiamento-real.json')

interface FinanciamentoDeputado {
  cpf: string
  nome: string
  partido: string
  uf: string
  receita_total: number
  receitas_pf: number
  receitas_pj: number
  receitas_partidos: number
  receitas_proprias: number
  receitas_outros: number
  rendimentos: number
}

interface OutputData {
  source: string
  description: string
  updated: string
  total_deputados: number
  deputados: FinanciamentoDeputado[]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  
  return result
}

function processCSV(estado: string, content: string, deputados: Map<string, FinanciamentoDeputado>): number {
  const lines = content.split('\n')
  if (lines.length < 2) return 0
  
  const headers = parseCSVLine(lines[0])
  
  // Encontrar índices das colunas corretas
  const sqIdx = headers.findIndex(h => h === 'SQ_PRESTADOR_CONTAS')
  const cpfIdx = headers.findIndex(h => h === 'NR_CPF_CANDIDATO')
  const nomeIdx = headers.findIndex(h => h === 'NM_CANDIDATO')
  const partidoIdx = headers.findIndex(h => h === 'SG_PARTIDO')
  const ufIdx = headers.findIndex(h => h === 'SG_UF')
  const cargoIdx = headers.findIndex(h => h === 'DS_CARGO')
  const vrIdx = headers.findIndex(h => h === 'VR_RECEITA')
  // DS_ORIGEM_RECEITA contém "Recursos de pessoas físicas", "Recursos de partido político", etc
  const dsOrigemIdx = 29 // 0-indexed, posição 30 no arquivo
  
  let newDeputados = 0
  const maxLines = Math.min(lines.length, 300000)
  
  for (let i = 1; i < maxLines; i++) {
    try {
      const parts = parseCSVLine(lines[i])
      if (parts.length < 10) continue
      
      const sq = parts[sqIdx]?.replace(/"/g, '') || ''
      const cpf = parts[cpfIdx]?.replace(/"/g, '') || ''
      const nome = parts[nomeIdx]?.replace(/"/g, '') || ''
      const partido = parts[partidoIdx]?.replace(/"/g, '') || ''
      const uf = parts[ufIdx]?.replace(/"/g, '') || estado
      const cargo = parts[cargoIdx]?.replace(/"/g, '') || ''
      const vr = parseFloat((parts[vrIdx] || '0').replace(',', '.').replace(/"/g, '')) || 0
      const dsOrigem = (parts[dsOrigemIdx] || '').replace(/"/g, '').toUpperCase()
      
      // Só processar deputados federais
      if (!cargo.toLowerCase().includes('deputado') || cargo.toLowerCase().includes('estadual')) {
        continue
      }
      
      // Criar ou atualizar candidato
      if (!deputados.has(sq)) {
        newDeputados++
        deputados.set(sq, {
          cpf,
          nome,
          partido,
          uf,
          receita_total: 0,
          receitas_pf: 0,
          receitas_pj: 0,
          receitas_partidos: 0,
          receitas_proprias: 0,
          receitas_outros: 0,
          rendimentos: 0,
        })
      }
      
      const dep = deputados.get(sq)!
      dep.receita_total += vr
      
      // Classificar por natureza
      // "Recursos de pessoas físicas" -> PF
      // "Recursos de partido político" -> Partido
      // "Recursos próprios" -> Próprio
      // "Recursos de outros candidatos" -> Outros
      // "Rendimentos de aplicações financeiras" -> Rendimentos
      // "Recursos de Financiamento Coletivo" -> Próprio
      if (dsOrigem.includes('PESSOAS FÍSICAS') || dsOrigem.includes('FÍSICAS')) {
        dep.receitas_pf += vr
      } else if (dsOrigem.includes('PARTIDO') || dsOrigem.includes('PARTIDÁRIO')) {
        dep.receitas_partidos += vr
      } else if (dsOrigem.includes('PRÓPRIOS') || dsOrigem.includes('COLETIVO')) {
        dep.receitas_proprias += vr
      } else if (dsOrigem.includes('OUTROS CANDIDATOS')) {
        dep.receitas_outros += vr
      } else if (dsOrigem.includes('RENDIMENTOS') || dsOrigem.includes('APLICAÇÕES')) {
        dep.rendimentos += vr
      }
      
    } catch {
      // Linha com erro, ignorar
    }
  }
  
  return newDeputados
}

async function main() {
  console.log('📊 Processando prestação de contas TSE (2022)...\n')
  
  if (!existsSync(EXTRACT_DIR)) {
    console.error('✗ Diretório extraído não encontrado.')
    return
  }
  
  const deputados: Map<string, FinanciamentoDeputado> = new Map()
  const files = readdirSync(EXTRACT_DIR).filter(f => f.startsWith('receitas_') && !f.includes('doador') && f.endsWith('.csv'))
  
  console.log(`📁 Encontrados ${files.length} arquivos de receitas\n`)
  
  for (const file of files) {
    const estado = file.replace('receitas_candidatos_2022_', '').replace('.csv', '')
    
    // Pular arquivo BRASIL (muito grande)
    if (estado === 'BRASIL') {
      console.log(`⏭️  ${estado} (muito grande, pulando)`)
      continue
    }
    
    process.stdout.write(`📁 ${estado}...`)
    
    try {
      const content = readFileSync(join(EXTRACT_DIR, file), 'latin1')
      const newCount = processCSV(estado, content, deputados)
      console.log(` +${newCount} novos (${deputados.size} total)`)
    } catch (err) {
      console.log(` ✗ erro: ${err}`)
    }
  }
  
  console.log(`\n✅ Total: ${deputados.size} deputados processados`)
  
  // Salvar resultado
  const data: OutputData = {
    source: 'TSE - Prestação de Contas Eleitorais 2022',
    description: 'Dados reais de financiamento de campanha dos candidatos a Deputado Federal',
    updated: new Date().toISOString(),
    total_deputados: deputados.size,
    deputados: Array.from(deputados.values()),
  }
  
  console.log(`\n💾 Salvando em ${OUTPUT_FILE}...`)
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  
  console.log('✅ Concluído!')
}

main().catch(console.error)
