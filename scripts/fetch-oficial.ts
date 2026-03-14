/**
 * Script para buscar a lista oficial de deputados eleitos do site da Câmara
 */

import { writeFileSync } from 'fs'

const URL = 'https://www.camara.leg.br/internet/agencia/infograficos-html5/tabelasEleicoes/deputados-eleitos-estado/'

async function fetchOfficialList() {
  console.log('Fetching official list...')
  const res = await fetch(URL)
  const html = await res.text()
  
  // Parse the HTML - it's a simple table format
  const deputies: Array<{uf: string, nome: string, partido: string}> = []
  
  // Match pattern: UF, NAME, PARTY
  const regex = /<tr>[\s\S]*?<td[^>]*>([A-Z]{2})<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([A-Z]+)<\/td>[\s\S]*?<\/tr>/g
  
  let match
  while ((match = regex.exec(html)) !== null) {
    const uf = match[1]
    const nome = match[2].trim()
    const partido = match[3].trim()
    
    if (uf && nome && partido && nome.length > 2) {
      deputies.push({ uf, nome, partido })
    }
  }
  
  console.log(`Found ${deputies.length} deputies`)
  
  // Save to file
  const OUTPUT = 'public/data/deputados-oficiais-2022.json'
  writeFileSync(OUTPUT, JSON.stringify(deputies, null, 2))
  console.log(`Saved to ${OUTPUT}`)
  
  // Show sample
  console.log('\nSample:')
  deputies.slice(0, 10).forEach(d => console.log(`  ${d.uf} - ${d.nome} (${d.partido})`))
  
  return deputies
}

fetchOfficialList().catch(console.error)
