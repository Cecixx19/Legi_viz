/**
 * scripts/fetch-tse-data.ts
 *
 * Baixa os CSVs do TSE, cruza candidatos eleitos com a lista
 * do Congresso e gera JSONs estáticos em public/data/.
 *
 * Rodar UMA VEZ localmente:
 *   pnpm run fetch-tse
 *
 * Requer: pnpm install (já deve estar no projeto)
 * Gera:
 *   public/data/tse-dados.json   → raça, gênero, CPF
 *   public/data/tse-bens.json    → patrimônio por CPF (soma em R$ mil)
 *
 * Nota: As URLs do TSE podem mudar. Se o script falhar, os dados
 * serão gerados com valores aleatórios (seeds) automaticamente.
 */

import fs   from 'fs'
import path from 'path'
import https from 'https'
import zlib  from 'zlib'

// ── URLs dos arquivos do TSE ────────────────────────────────
// Fonte: https://dadosabertos.tse.jus.br/dataset/candidatos
// Tente várias URLs possíveis
const TSE_CAND_URLS = [
  'https://cdn.tse.jus.br/estatistica/sep/consulta_cand_2022_BRASIL.zip',
  'https://dadosabertos.tse.jus.br/storage/f/2023-03/14/15-22-25/consulta_cand_2022_BRASIL.zip',
]
const TSE_BENS_URLS = [
  'https://cdn.tse.jus.br/estatistica/sep/bem_candidato_2022_BRASIL.zip',
  'https://dadosabertos.tse.jus.br/storage/f/2023-03/14/15-25-35/bem_candidato_2022_BRASIL.zip',
]

const OUT_DIR = path.join(process.cwd(), 'public', 'data')
const TMP_DIR = path.join(process.cwd(), '.tse-tmp')

// ── Helpers ─────────────────────────────────────────────────
function mkdir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const request = https.get(url, { timeout: 180000 })
    request.on('response', (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location
        file.close()
        if (redirectUrl) {
          console.log('  → redirect to', redirectUrl.substring(0, 60) + '...')
          download(redirectUrl, dest).then(resolve).catch(reject)
        } else {
          reject(new Error('No redirect location'))
        }
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => { 
        file.close() 
        const stats = fs.statSync(dest)
        if (stats.size < 1000) {
          const content = fs.readFileSync(dest, 'utf-8')
          console.log('  → downloaded content:', content.substring(0, 200))
          reject(new Error('Downloaded file too small - possibly error page'))
          return
        }
        console.log('  → downloaded', (stats.size / 1024 / 1024).toFixed(1), 'MB')
        resolve() 
      })
    })
    request.on('error', reject)
  })
}

function unzip(zipPath: string, destDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries().filter((e: any) => e.entryName.endsWith('.csv'))
    if (!entries.length) return reject(new Error('No CSV in zip'))
    const entry = entries[0]
    const outPath = path.join(destDir, entry.entryName)
    zip.extractEntryTo(entry, destDir, false, true)
    resolve(outPath)
  })
}

// ── Parse CSV com encoding Latin-1 (padrão do TSE) ─────────
function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath)
  // TSE usa Latin-1; converte para UTF-8
  const text = raw.toString('latin1')
  const lines = text.split('\n').filter(l => l.trim())
  if (!lines.length) return []
  
  const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim())
  
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.replace(/"/g, '').trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  }).filter(r => Object.keys(r).length > 1)
}

// ── Normaliza raça (TSE → nosso tipo) ──────────────────────
function normRaca(ds: string): string {
  const s = ds.toUpperCase().trim()
  if (s === 'BRANCA')    return 'Branco'
  if (s === 'PARDA')     return 'Pardo'
  if (s === 'PRETA')     return 'Preto'
  if (s === 'AMARELA')   return 'Amarelo'
  if (s.includes('IND')) return 'Indigena'
  return '' // não informado → seed
}

// ── Normaliza gênero (TSE → nosso tipo) ────────────────────
// Campos possíveis: MASCULINO, FEMININO, NÃO BINÁRIO, TRAVESTI, TRANSEXUAL
function normGenero(ds: string): string {
  const s = ds.toUpperCase().trim()
  if (s === 'MASCULINO')  return 'Homem'
  if (s === 'FEMININO')   return 'Mulher'
  if (s.includes('BINAR')) return 'NaoBinarie'
  if (s === 'TRAVESTI')   return 'Trans'
  if (s === 'TRANSEXUAL') return 'Trans'
  return 'Homem' // fallback
}

// ── Normaliza nome para comparação fuzzy ───────────────────
function normNome(s: string): string {
  return s.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '').trim()
}

// ── Main ───────────────────────────────────────────────────
async function tryDownload(urls: string[], dest: string): Promise<boolean> {
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      console.log('  Tentando:', url.substring(0, 50) + '...')
      await download(url, dest)
      return true
    } catch (e) {
      lastError = e as Error
      console.log('  → Falhou:', lastError.message)
    }
  }
  return false
}

async function main() {
  mkdir(OUT_DIR)
  mkdir(TMP_DIR)

  console.log('📥 Baixando candidatos 2022...')
  const candZip = path.join(TMP_DIR, 'cand.zip')
  const candOk = await tryDownload(TSE_CAND_URLS, candZip)
  
  let candCSV = ''
  if (candOk) {
    console.log('📦 Extraindo...')
    candCSV = await unzip(candZip, TMP_DIR)
  } else {
    console.log('⚠️  URL do TSE não disponível. Os dados serão gerados com valores aleatórios.')
    console.log('   Para obter dados reais, baixe manualmente de:')
    console.log('   https://dadosabertos.tse.jus.br/')
  }

  console.log('📥 Baixando bens 2022...')
  const bensZip = path.join(TMP_DIR, 'bens.zip')
  const bensOk = await tryDownload(TSE_BENS_URLS, bensZip)
  
  let bensCSV = ''
  if (bensOk) {
    console.log('📦 Extraindo...')
    bensCSV = await unzip(bensZip, TMP_DIR)
  }

  // ── Parsear candidatos ────────────────────────────────────
  if (!candOk) {
    // Criar arquivo vazio para indicar que os dados não estão disponíveis
    const outPath = path.join(OUT_DIR, 'tse-dados.json')
    fs.writeFileSync(outPath, JSON.stringify({ _note: 'Dados do TSE indisponíveis - usando valores aleatórios' }, null, 2))
    console.log('\n⚠️  Arquivo de dados do TSE criado vazio.')
    console.log('   O app usará dados gerados aleatoriamente.')
    console.log('\n🎉 Pronto! Execute "pnpm run dev" para iniciar.')
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
    return
  }

  console.log('🔍 Parseando candidatos...')
  const cands = parseCSV(candCSV)
  
  // Filtrar apenas eleitos para deputado federal e senador em 2022
  const CARGOS_ALVO = ['DEPUTADO FEDERAL', 'SENADOR']
  const eleitos = cands.filter(r => {
    const cargo = (r['DS_CARGO'] || '').toUpperCase()
    const desc = (r['DS_SIT_TOT_TURNO'] || '').toUpperCase()
    return CARGOS_ALVO.some(c => cargo.includes(c)) && 
           (desc.includes('ELEITO') || desc.includes('MÉDIA'))
  })

  // Mapa por nome normalizado → { raca, genero, cpf, partido, uf }
  const candMap: Record<string, {
    raca: string; genero: string; cpf: string
    partido: string; uf: string; nomeUrna: string
  }> = {}

  eleitos.forEach(r => {
    const nomeUrna = r['NM_URNA_CANDIDATO'] || r['NM_CANDIDATO'] || ''
    const key = normNome(nomeUrna)
    if (!key) return
    candMap[key] = {
      raca:     normRaca(r['DS_COR_RACA'] || ''),
      genero:   normGenero(r['DS_GENERO'] || ''),
      cpf:      r['NR_CPF_CANDIDATO'] || '',
      partido:  r['SG_PARTIDO'] || '',
      uf:       r['SG_UF'] || '',
      nomeUrna,
    }
    // Também indexar por CPF se disponível
    if (r['NR_CPF_CANDIDATO']) {
      candMap[r['NR_CPF_CANDIDATO']] = candMap[key]
    }
  })

  console.log(`✅ ${eleitos.length} eleitos encontrados`)

  // ── Parsear bens ──────────────────────────────────────────
  console.log('💰 Parseando bens declarados...')
  const bensRows = parseCSV(bensCSV)
  
  // Somar bens por nome normalizado (em R$ — converter para R$ mil no output)
  const bensMap: Record<string, number> = {}
  bensRows.forEach(r => {
    const nome = normNome(r['NM_CANDIDATO'] || '')
    if (!nome) return
    const vr = parseFloat((r['VR_BEM_CANDIDATO'] || '0').replace(',', '.')) || 0
    bensMap[nome] = (bensMap[nome] || 0) + vr
  })

  console.log(`✅ ${Object.keys(bensMap).length} candidatos com bens`)

  // ── Gerar JSON de saída ───────────────────────────────────
  // Formato: { [nomeNormalizado]: { raca, genero, cpf, partido, uf, patrimonio } }
  const output: Record<string, {
    raca: string; genero: string; partido: string; uf: string; patrimonio: number
  }> = {}

  Object.entries(candMap).forEach(([key, c]) => {
    const bens = bensMap[key] ?? bensMap[normNome(c.nomeUrna)] ?? 0
    output[key] = {
      raca:       c.raca,
      genero:     c.genero,
      partido:    c.partido,
      uf:         c.uf,
      patrimonio: Math.round(bens / 1000), // → R$ mil
    }
  })

  const outPath = path.join(OUT_DIR, 'tse-dados.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n✅ Salvo em ${outPath}`)
  console.log(`   ${Object.keys(output).length} parlamentares com dados do TSE`)

  // Limpar temporários
  fs.rmSync(TMP_DIR, { recursive: true, force: true })
  console.log('\n🎉 Pronto! Reinicie o servidor para carregar os dados.')
  console.log('   Os dados serão carregados automaticamente de public/data/tse-dados.json')
}

main().catch(e => { console.error('❌', e); process.exit(1) })
