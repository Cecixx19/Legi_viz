/**
 * Script para baixar e processar prestação de contas do TSE
 * - Baixa 400MB zip
 * - Extrai CSVs por estado
 * - Processa e salva apenas dados necessários
 * 
 * Run with: npx tsx scripts/fetch-financiamento.ts
 */

import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TSE_DIR = join(__dirname, '../.tse-tmp')
const TMP_DIR = join(__dirname, '../.tse-tmp/prestacao_extract')
const OUTPUT_FILE = join(__dirname, '../public/data/financiamento-real.json')

const TSE_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip'
const ZIP_PATH = join(TSE_DIR, 'prestacao_candidatos_2022.zip')

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

async function downloadZip(): Promise<boolean> {
  if (existsSync(ZIP_PATH)) {
    console.log('✓ Arquivo já existe, pulando download...')
    return true
  }

  console.log('📥 Baixando 400MB (isso pode levar alguns minutos)...')
  
  try {
    const response = await fetch(TSE_URL)
    if (!response.ok) {
      console.error(`✗ Erro ${response.status}`)
      return false
    }
    
    const writer = createWriteStream(ZIP_PATH)
    let downloaded = 0
    const total = parseInt(response.headers.get('content-length') || '400000000')
    
    // @ts-ignore - ReadableStream in Node 18+
    const reader = response.body?.getReader()
    
    if (!reader) {
      console.error('✗ Não foi possível obter reader')
      return false
    }
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      writer.write(value)
      downloaded += value.length
      
      // Mostrar progresso a cada 5%
      const pct = Math.round((downloaded / total) * 100)
      if (pct % 10 === 0) {
        process.stdout.write(`\r   ${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB (${pct}%)`)
      }
    }
    
    writer.end()
    console.log('\n✓ Download completo!')
    return true
  } catch (err) {
    console.error('✗ Erro:', err)
    return false
  }
}

function extractZip(): boolean {
  if (existsSync(TMP_DIR)) {
    console.log('✓ Arquivos já extraídos, pulando...')
    return true
  }
  
  console.log('📦 Extraindo arquivos...')
  
  try {
    mkdirSync(TMP_DIR, { recursive: true })
    
    // Extrair usando unzip (precisa estar instalado)
    execSync(`unzip -o "${ZIP_PATH}" -d "${TMP_DIR}"`, { stdio: 'inherit', maxBuffer: 1024 * 1024 * 100 })
    
    console.log('✓ Extração completa!')
    return true
  } catch (err) {
    console.error('✗ Erro ao extrair:', err)
    return false
  }
}

function processCSVs(): OutputData {
  console.log('📊 Processando CSVs...')
  
  const deputados: Map<string, FinanciamentoDeputado> = new Map()
  let filesProcessed = 0
  
  // Listar arquivos no diretório extraído
  const files = readdirSync(TMP_DIR).filter(f => f.endsWith('.csv'))
  console.log(`   Encontrados ${files.length} arquivos CSV`)
  
  for (const file of files) {
    const filePath = join(TMP_DIR, file)
    console.log(`   Processando ${file}...`)
    
    try {
      const content = readFileSync(filePath, 'latin1')
      const lines = content.split('\n')
      
      if (lines.length < 2) continue
      
      const headers = parseCSVLine(lines[0])
      
      // Encontrar índices das colunas
      const sqIdx = headers.findIndex(h => h === 'SQ_PRESTADOR_CONTAS')
      const cpfIdx = headers.findIndex(h => h === 'CPF_CANDIDATO')
      const nomeIdx = headers.findIndex(h => h === 'NM_CANDIDATO')
      const partidoIdx = headers.findIndex(h => h === 'SG_PARTIDO')
      const ufIdx = headers.findIndex(h => h === 'SG_UF')
      const cargoIdx = headers.findIndex(h => h === 'DS_CARGO')
      const vrReceitaIdx = headers.findIndex(h => h === 'VR_RECEITA')
      const tpOrigemIdx = headers.findIndex(h => h === 'TP_ORIGEM_RECEITA')
      const tpPessoaIdx = headers.findIndex(h => h === 'TP_PESSOA_DOADOR')
      
      // Se alguma coluna essencial não existir, pular
      if (sqIdx === -1 || cpfIdx === -1 || vrReceitaIdx === -1) {
        console.log(`   ⚠ Colunas não encontradas em ${file}`)
        continue
      }
      
      // Limite de linhas por arquivo para evitar memória
      const maxLines = Math.min(lines.length, 500000)
      
      for (let i = 1; i < maxLines; i++) {
        try {
          const parts = parseCSVLine(lines[i])
          if (parts.length < Math.max(sqIdx, cpfIdx, vrReceitaIdx) + 1) continue
          
          const sq = parts[sqIdx]?.replace(/"/g, '')
          const cpf = parts[cpfIdx]?.replace(/"/g, '') || ''
          const nome = parts[nomeIdx]?.replace(/"/g, '') || ''
          const partido = parts[partidoIdx]?.replace(/"/g, '') || ''
          const uf = parts[ufIdx]?.replace(/"/g, '') || ''
          const cargo = parts[cargoIdx]?.replace(/"/g, '') || ''
          const vrReceita = parseFloat((parts[vrReceitaIdx] || '0').replace(',', '.').replace(/"/g, '')) || 0
          const tpOrigem = parts[tpOrigemIdx]?.replace(/"/g, '') || ''
          const tpPessoa = parts[tpPessoaIdx]?.replace(/"/g, '') || ''
          
          // Só processar deputados federais
          if (!cargo.toLowerCase().includes('deputado') && !cargo.toLowerCase().includes('federal')) {
            continue
          }
          
          // Criar ou atualizar candidato
          if (!deputados.has(sq)) {
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
            })
          }
          
          const dep = deputados.get(sq)!
          
          // Acumular valores
          dep.receita_total += vrReceita
          
          // Classificar por tipo de origem
          if (tpOrigem === 'P') {
            // Recursos de partido
            dep.receitas_partidos += vrReceita
          } else if (tpOrigem === 'P') {
            // Recursos próprios
            dep.receitas_proprias += vrReceita
          }
          
          // Classificar por tipo de pessoa doadora
          if (tpPessoa === 'F') {
            dep.receitas_pf += vrReceita
          } else if (tpPessoa === 'J') {
            dep.receitas_pj += vrReceita
          }
          
        } catch (e) {
          // Linha com erro, ignorar
        }
      }
      
      filesProcessed++
      
      // Limpar memória a cada 5 arquivos
      if (filesProcessed % 5 === 0) {
        process.stdout.write(`\r   Processados ${filesProcessed}/${files.length} arquivos, ${deputados.size} deputados encontrados`)
      }
      
    } catch (err) {
      console.log(`   ✗ Erro ao processar ${file}:`, err)
    }
  }
  
  console.log(`\n✓ Total: ${deputados.size} deputados`)
  
  return {
    source: 'TSE - Prestação de Contas Eleitorais 2022',
    description: 'Dados reais de financiamento de campanha dos candidatos',
    updated: new Date().toISOString(),
    total_deputados: deputados.size,
    deputados: Array.from(deputados.values()),
  }
}

async function main() {
  console.log('📥 Baixando e processando prestação de contas TSE (2022)...\n')
  
  if (!existsSync(TSE_DIR)) {
    mkdirSync(TSE_DIR, { recursive: true })
  }
  
  // 1. Baixar zip
  const downloaded = await downloadZip()
  if (!downloaded) {
    console.error('✗ Falha no download')
    return
  }
  
  // 2. Extrair
  const extracted = extractZip()
  if (!extracted) {
    console.error('✗ Falha na extração')
    return
  }
  
  // 3. Processar CSVs
  const data = processCSVs()
  
  // 4. Salvar resultado
  console.log(`\n💾 Salvando ${data.deputados.length} deputados em ${OUTPUT_FILE}...`)
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  
  // 5. Limpar arquivos temporários (opcional)
  // rmSync(TMP_DIR, { recursive: true, force: true })
  // rmSync(ZIP_PATH, { force: true })
  
  console.log('✅ Processamento completo!')
  console.log(`   Arquivo salvo: ${OUTPUT_FILE}`)
}

main().catch(console.error)
