/**
 * Fetch real project/proposition data for all deputies from Câmara dos Deputados
 * 
 * Data source: http://dadosabertos.camara.leg.br/arquivos/proposicoesAutores/
 * 
 * This gets all propositions and their authors per year.
 * We'll link propositions to deputies by their ID.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { get } from 'http'
import { execSync } from 'child_process'
import { createGunzip } from 'zlib'

const OUTPUT_DIR = join(process.cwd(), 'public/data')
const TMP_DIR = join(process.cwd(), '.proposicoes-tmp')

// Ensure directories exist
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Years to fetch
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2019, 2018, 2017, 2015, 2013, 2011, 2007]

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath)
    get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location!, destPath).then(resolve).catch(reject)
        return
      }
      pipeline(response, file)
        .then(() => resolve())
        .catch(reject)
    }).on('error', reject)
  })
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`, { stdio: 'pipe' })
  } catch (e) {
    console.error('Extract error:', e)
  }
}

interface Proposicao {
  id: number
  tipo: string
  numero: number
  ano: number
  ementa?: string
  tema?: string
  situacao?: string
  dataApresentacao?: string
}

interface DeputyProjects {
  deputyId: number
  nome?: string
  partido?: string
  uf?: string
  totalProposicoes: number
  proposicoes: Proposicao[]
  byTipo: Record<string, number>
  byAno: Record<string, number>
  bySituacao: Record<string, number>
}

async function fetchProjetosData(): Promise<void> {
  console.log('=== Fetching Real Project Data from Câmara ===\n')
  
  // Map deputy IDs to their info (we'll populate from propositions)
  const deputyProjects: Record<number, DeputyProjects> = {}
  
  // Also track propositions for reference
  const allProposicoes: Record<number, Proposicao> = {}
  
  for (const year of YEARS) {
    console.log(`Fetching propositions from ${year}...`)
    const zipPath = join(TMP_DIR, `proposicoes-${year}.zip`)
    const extractDir = join(TMP_DIR, `proposicoes-${year}`)
    
    try {
      // Download propositions
      const url = `http://dadosabertos.camara.leg.br/arquivos/proposicoes/csv/proposicoes-${year}.csv.zip`
      console.log(`  Downloading propositions: ${url}`)
      await downloadFile(url, zipPath)
      await extractZip(zipPath, extractDir)
      
      // Download authors
      const authorsZipPath = join(TMP_DIR, `proposicoesAutores-${year}.zip`)
      const authorsDir = join(TMP_DIR, `proposicoesAutores-${year}`)
      const authorsUrl = `http://dadosabertos.camara.leg.br/arquivos/proposicoesAutores/csv/proposicoesAutores-${year}.csv.zip`
      console.log(`  Downloading authors: ${authorsUrl}`)
      await downloadFile(authorsUrl, authorsZipPath)
      await extractZip(authorsZipPath, authorsDir)
      
      // Parse propositions
      const csvPath = join(extractDir, `proposicoes-${year}.csv`)
      if (existsSync(csvPath)) {
        const content = readFileSync(csvPath, 'utf8')
        const lines = content.split('\n')
        
        // Header: id;uri;siglaTipo;numero;ano;ementa;tema;codTema;situacao;dataApresentacao
        const header = lines[0].split(';').map(h => h.replace(/"/g, ''))
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const parts = line.split(';')
          if (parts.length >= 10) {
            const id = parseInt(parts[0])
            if (id) {
              allProposicoes[id] = {
                id,
                tipo: parts[2]?.replace(/"/g, '') || '',
                numero: parseInt(parts[3]) || 0,
                ano: parseInt(parts[4]) || year,
                ementa: parts[5]?.replace(/"/g, '').substring(0, 200),
                tema: parts[6]?.replace(/"/g, ''),
                situacao: parts[8]?.replace(/"/g, ''),
                dataApresentacao: parts[9]?.replace(/"/g, '').substring(0, 10)
              }
            }
          }
        }
        console.log(`  Processed ${lines.length - 1} propositions`)
      }
      
      // Parse authors and link to deputies
      const authorsPath = join(authorsDir, `proposicoesAutores-${year}.csv`)
      if (existsSync(authorsPath)) {
        const content = readFileSync(authorsPath, 'utf8')
        const lines = content.split('\n')
        
        // Header: idProposicao;nomeAutor;tipoAutor;codTipoAutor;uriAutor
        // uriAutor format: https://dadosabertos.camara.leg.br/deputados/{id}
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          const parts = line.split(';')
          if (parts.length >= 5) {
            const propId = parseInt(parts[0])
            const uriAutor = parts[4]?.replace(/"/g, '') || ''
            
            // Extract deputy ID from URI
            const match = uriAutor.match(/deputados\/(\d+)/)
            if (match && propId) {
              const deputyId = parseInt(match[1])
              
              if (!deputyProjects[deputyId]) {
                deputyProjects[deputyId] = {
                  deputyId,
                  totalProposicoes: 0,
                  proposicoes: [],
                  byTipo: {},
                  byAno: {},
                  bySituacao: {}
                }
              }
              
              const prop = allProposicoes[propId]
              if (prop) {
                deputyProjects[deputyId].proposicoes.push(prop)
                deputyProjects[deputyId].totalProposicoes++
                
                // Count by type
                deputyProjects[deputyId].byTipo[prop.tipo] = 
                  (deputyProjects[deputyId].byTipo[prop.tipo] || 0) + 1
                
                // Count by year
                deputyProjects[deputyId].byAno[String(prop.ano)] = 
                  (deputyProjects[deputyId].byAno[String(prop.ano)] || 0) + 1
                
                // Count by situation
                if (prop.situacao) {
                  deputyProjects[deputyId].bySituacao[prop.situacao] = 
                    (deputyProjects[deputyId].bySituacao[prop.situacao] || 0) + 1
                }
              }
            }
          }
        }
        console.log(`  Processed ${lines.length - 1} author records`)
      }
      
    } catch (e) {
      console.error(`  Error fetching ${year}:`, e)
    }
  }
  
  // Save results
  const outputPath = join(OUTPUT_DIR, 'projetos-real.json')
  require('fs').writeFileSync(outputPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Câmara dos Deputados - Dados Abertos',
    sourceUrl: 'http://dadosabertos.camara.leg.br/arquivos/proposicoes/',
    totalDeputies: Object.keys(deputyProjects).length,
    deputies: deputyProjects
  }, null, 2))
  
  console.log(`\n=== Results ===`)
  console.log(`Total deputies with propositions: ${Object.keys(deputyProjects).length}`)
  console.log(`Total propositions tracked: ${Object.keys(allProposicoes).length}`)
  console.log(`Output saved to: ${outputPath}`)
  
  // Show sample
  const sample = Object.values(deputyProjects).slice(0, 3)
  for (const s of sample) {
    console.log(`\nDeputy ID ${s.deputyId}:`)
    console.log(`  Total propositions: ${s.totalProposicoes}`)
    console.log(`  By type:`, s.byTipo)
  }
}

// Run
fetchProjetosData().catch(console.error)
