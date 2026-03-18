/**
 * Script para extrair os maiores doadores por candidato do TSE
 * - Processa arquivos de receitas por estado
 * - Extrai os 10 maiores doadores por candidato
 * 
 * Run with: npx tsx scripts/extract-doadores.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TSE_DIR = join(__dirname, '../.tse-tmp')
const EXTRACT_DIR = join(TSE_DIR, 'prestacao_extract')
const OUTPUT_FILE = join(__dirname, '../public/data/doadores-reais.json')

interface Doador {
  nome: string
  cpf_cnpj: string
  tipo: 'PF' | 'PJ' | 'Partido' | 'Candidato' | 'Outros'
  valor: number
}

interface DoadoresCandidato {
  sq_prestador: string
  cpf_candidato: string
  nome_candidato: string
  partido: string
  uf: string
  doadores: Doador[]
}

interface OutputData {
  source: string
  updated: string
  total_candidatos: number
  candidatos: DoadoresCandidato[]
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

function processCSV(estado: string, content: string, candidatos: Map<string, DoadoresCandidato>): number {
  const lines = content.split('\n')
  if (lines.length < 2) return 0
  
  const headers = parseCSVLine(lines[0])
  
  // Encontrar índices das colunas
  const sqIdx = headers.findIndex(h => h === 'SQ_PRESTADOR_CONTAS')
  const cpfCandidatoIdx = headers.findIndex(h => h === 'NR_CPF_CANDIDATO')
  const nomeCandidatoIdx = headers.findIndex(h => h === 'NM_CANDIDATO')
  const partidoIdx = headers.findIndex(h => h === 'SG_PARTIDO')
  const ufIdx = headers.findIndex(h => h === 'SG_UF')
  const cargoIdx = headers.findIndex(h => h === 'DS_CARGO')
  const vrIdx = headers.findIndex(h => h === 'VR_RECEITA')
  const nomeDoadorIdx = headers.findIndex(h => h === 'NM_DOADOR')
  const cpfCnpjDoadorIdx = headers.findIndex(h => h === 'NR_CPF_CNPJ_DOADOR')
  const dsOrigemIdx = headers.findIndex(h => h === 'DS_ORIGEM_RECEITA')
  
  // Para cada candidato, guardar os doadores
  const doadoresPorCandidato: Map<string, Doador[]> = new Map()
  
  let newCandidatos = 0
  const maxLines = Math.min(lines.length, 300000)
  
  for (let i = 1; i < maxLines; i++) {
    try {
      const parts = parseCSVLine(lines[i])
      if (parts.length < 10) continue
      
      const sq = parts[sqIdx]?.replace(/"/g, '') || ''
      const cpfCandidato = parts[cpfCandidatoIdx]?.replace(/"/g, '') || ''
      const nomeCandidato = parts[nomeCandidatoIdx]?.replace(/"/g, '') || ''
      const partido = parts[partidoIdx]?.replace(/"/g, '') || ''
      const uf = parts[ufIdx]?.replace(/"/g, '') || estado
      const cargo = parts[cargoIdx]?.replace(/"/g, '') || ''
      const vr = parseFloat((parts[vrIdx] || '0').replace(',', '.').replace(/"/g, '')) || 0
      const nomeDoador = parts[nomeDoadorIdx]?.replace(/"/g, '') || 'Anônimo'
      const cpfCnpjDoador = parts[cpfCnpjDoadorIdx]?.replace(/"/g, '') || ''
      const dsOrigem = (parts[dsOrigemIdx] || '').replace(/"/g, '').toUpperCase()
      
      // Só processar deputados federais
      if (!cargo.toLowerCase().includes('deputado') || cargo.toLowerCase().includes('estadual')) {
        continue
      }
      
      // Ignorar doadores anônimos ou próprios candidatos
      if (nomeDoador === 'Anônimo' || nomeDoador === '#NULO' || nomeDoador.includes('RESTITUIÇÃO') || nomeDoador.includes('RENDIMENTO')) {
        continue
      }
      
      // Classificar tipo de doador
      let tipo: Doador['tipo'] = 'Outros'
      if (dsOrigem.includes('PESSOA FÍSICA') || cpfCnpjDoador.length === 11) {
        tipo = 'PF'
      } else if (dsOrigem.includes('PESSOA JURÍDICA') || cpfCnpjDoador.length === 14) {
        tipo = 'PJ'
      } else if (dsOrigem.includes('PARTIDO')) {
        tipo = 'Partido'
      } else if (dsOrigem.includes('OUTROS CANDIDATOS')) {
        tipo = 'Candidato'
      }
      
      // Adicionar doador
      if (!doadoresPorCandidato.has(sq)) {
        doadoresPorCandidato.set(sq, [])
      }
      
      doadoresPorCandidato.get(sq)!.push({
        nome: nomeDoador,
        cpf_cnpj: cpfCnpjDoador,
        tipo,
        valor: vr
      })
      
    } catch {
      // Linha com erro, ignorar
    }
  }
  
  // Para cada candidato, ordenar por valor e pegar os 10 maiores
  for (const [sq, doadores] of doadoresPorCandidato) {
    // Ordenar por valor (maior primeiro)
    doadores.sort((a, b) => b.valor - a.valor)
    
    // Pegar os 10 maiores
    const top10 = doadores.slice(0, 10)
    
    // Pegar dados do primeiro registro do candidato
    const primeiro = doadores[0]
    
    candidatos.set(sq, {
      sq_prestador: sq,
      cpf_candidato: '',
      nome_candidato: '',
      partido: '',
      uf: estado,
      doadores: top10
    })
    newCandidatos++
  }
  
  return newCandidatos
}

async function main() {
  console.log('📊 Extraindo maiores doadores do TSE (2022)...\n')
  
  if (!existsSync(EXTRACT_DIR)) {
    console.error('✗ Diretório extraído não encontrado.')
    return
  }
  
  const candidatos: Map<string, DoadoresCandidato> = new Map()
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
      const newCount = processCSV(estado, content, candidatos)
      console.log(` +${newCount} candidatos (${candidatos.size} total)`)
    } catch (err) {
      console.log(` ✗ erro: ${err}`)
    }
  }
  
  console.log(`\n✅ Total: ${candidatos.size} candidatos com doadores`)
  
  // Salvar resultado
  const data: OutputData = {
    source: 'TSE - Prestação de Contas Eleitorais 2022',
    updated: new Date().toISOString(),
    total_candidatos: candidatos.size,
    candidatos: Array.from(candidatos.values()),
  }
  
  console.log(`\n💾 Salvando em ${OUTPUT_FILE}...`)
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  
  // Mostrar exemplo
  console.log('\n📋 Exemplo (primeiro candidato):')
  const exemplo = data.candidatos[0]
  if (exemplo) {
    console.log(`   Candidato: ${exemplo.nome_candidato} (${exemplo.partido})`)
    console.log(`   UF: ${exemplo.uf}`)
    console.log(`   Doadores:`)
    exemplo.doadores.slice(0, 3).forEach((d, i) => {
      console.log(`     ${i+1}. ${d.nome} - R$ ${(d.valor/1000).toFixed(1)}k (${d.tipo})`)
    })
  }
  
  console.log('\n✅ Concluído!')
}

main().catch(console.error)
