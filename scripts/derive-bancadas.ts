/**
 * Derive real bancada data from frentes reais
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const INPUT_FILE = join(process.cwd(), 'public/data/frentes-real.json')
const OUTPUT_FILE = join(process.cwd(), 'public/data/bancadas-real.json')

// Mapping from frente keywords to bancada
const FRENTE_TO_BANCADA: Record<string, string> = {
  'evangélica': 'Evangelica',
  'evangelica': 'Evangelica',
  'família': 'Evangelica',
  'familia': 'Evangelica',
  'familiar': 'Evangelica',
  
  'agropecuária': 'Ruralista',
  'agro': 'Ruralista',
  'agrícola': 'Ruralista',
  'agrone': 'Ruralista',
  'rural': 'Ruralista',
  'fundiária': 'Ruralista',
  
  'segurança': 'Bala',
  'seguranca': 'Bala',
  'lei e ordem': 'Bala',
  'armament': 'Bala',
  'polícia': 'Bala',
  'defesa nacional': 'Bala',
  
  'ambiental': 'Ambientalista',
  'meio ambiente': 'Ambientalista',
  'amazônia': 'Ambientalista',
  'clima': 'Ambientalista',
  'energia limpa': 'Ambientalista',
  
  'mulher': 'Feminina',
  'gênero': 'Feminina',
  'genero': 'Feminina',
  'direitos da mulher': 'Feminina',
  
  'negra': 'Negra',
  'negro': 'Negra',
  'racismo': 'Negra',
  'igualdade racial': 'Negra',
  'indígena': 'Negra',
  'indigena': 'Negra',
  
  'empresarial': 'Empresarial',
  'empreendedorismo': 'Empresarial',
  'indústria': 'Empresarial',
  'industria': 'Empresarial',
  'comércio': 'Empresarial',
  'comercio': 'Empresarial',
  
  'trabalhador': 'Sindical',
  'sindical': 'Sindical',
  'previdência': 'Sindical',
  'previdencia': 'Sindical',
  'clt': 'Sindical',
}

function deriveBancada(frentes: { id: number; titulo: string }[]): string[] {
  const bancadasSet = new Set<string>()
  
  for (const frente of frentes) {
    const titulo = frente.titulo.toLowerCase()
    
    for (const [keyword, bancada] of Object.entries(FRENTE_TO_BANCADA)) {
      if (titulo.includes(keyword)) {
        bancadasSet.add(bancada)
        break
      }
    }
  }
  
  return Array.from(bancadasSet)
}

async function main() {
  console.log('=== Deriving Real Bancadas from Frentes ===\n')
  
  // Load frentes data
  const frentesData = JSON.parse(readFileSync(INPUT_FILE, 'utf8'))
  const frentesByDeputy = frentesData.frentesByDeputy || {}
  
  const bancadasByDeputy: Record<number, string[]> = {}
  const bancadaCounts: Record<string, number> = {}
  
  for (const [deputyId, frentes] of Object.entries(frentesByDeputy)) {
    const bancadas = deriveBancada(frentes as { id: number; titulo: string }[])
    bancadasByDeputy[parseInt(deputyId)] = bancadas
    
    for (const b of bancadas) {
      bancadaCounts[b] = (bancadaCounts[b] || 0) + 1
    }
  }
  
  // Save
  writeFileSync(OUTPUT_FILE, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: 'Derived from frentes reais',
    totalDeputies: Object.keys(bancadasByDeputy).length,
    bancadaCounts,
    bancadasByDeputy
  }, null, 2))
  
  console.log('=== Results ===')
  console.log('Deputies with bancadas: ' + Object.keys(bancadasByDeputy).length)
  console.log('\nBancada distribution:')
  for (const [bancada, count] of Object.entries(bancadaCounts).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + bancada + ': ' + count + ' deputies')
  }
  
  // Samples
  console.log('\n=== Samples ===')
  const samples = Object.entries(bancadasByDeputy).slice(0, 5)
  for (const [id, bancadas] of samples) {
    console.log('Deputy ' + id + ': ' + bancadas.join(', ') || 'Nenhuma')
  }
  
  console.log('\nSaved to: ' + OUTPUT_FILE)
}

main()
