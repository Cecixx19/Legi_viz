import * as fs from 'fs'
import * as path from 'path'

const SENATE_API = 'https://legis.senado.leg.br/dadosabertos'

interface SenatorData {
  codigo: number
  nome: string
  partido: string
  uf: string
  mandatos: number
  leadership: string[]
  cargos: string[]
  autoriaCount: number
}

async function fetchSenatorDetail(codigo: number, nome: string, partido: string, uf: string): Promise<SenatorData> {
  const data: SenatorData = {
    codigo,
    nome,
    partido,
    uf,
    mandatos: 1,
    leadership: [],
    cargos: [],
    autoriaCount: 0,
  }

  try {
    // Fetch mandates
    const mandatosRes = await fetch(`${SENATE_API}/senador/${codigo}/mandatos`)
    if (mandatosRes.ok) {
      const xml = await mandatosRes.text()
      // Count mandates by counting Mandato tags
      const mandatoMatches = xml.match(/<Mandato>/g)
      if (mandatoMatches) data.mandatos = mandatoMatches.length
    }
  } catch (e) {
    console.error(`Error fetching mandatos for ${codigo}:`, e)
  }

  try {
    // Fetch leadership positions
    const liderancasRes = await fetch(`${SENATE_API}/senador/${codigo}/liderancas`)
    if (liderancasRes.ok) {
      const xml = await liderancasRes.text()
      // Extract leadership positions
      const cargoMatches = xml.match(/<DescricaoCargo>.*?<\/DescricaoCargo>/g)
      if (cargoMatches) {
        data.leadership = cargoMatches.map(m => m.replace(/<\/?DescricaoCargo>/g, ''))
      }
    }
  } catch (e) {
    console.error(`Error fetching liderancas for ${codigo}:`, e)
  }

  try {
    // Fetch cargos
    const cargosRes = await fetch(`${SENATE_API}/senador/${codigo}/cargos`)
    if (cargosRes.ok) {
      const xml = await cargosRes.text()
      // Extract cargo descriptions
      const cargoMatches = xml.match(/<DescricaoCargo>.*?<\/DescricaoCargo>/g)
      if (cargoMatches) {
        data.cargos = cargoMatches.map(m => m.replace(/<\/?DescricaoCargo>/g, ''))
      }
    }
  } catch (e) {
    console.error(`Error fetching cargos for ${codigo}:`, e)
  }

  try {
    // Fetch authorship count (deprecated but still works)
    const autoriasRes = await fetch(`${SENATE_API}/senador/${codigo}/autorias`)
    if (autoriasRes.ok) {
      const xml = await autoriasRes.text()
      // Count Materia tags
      const materiaMatches = xml.match(/<Materia>/g)
      if (materiaMatches) data.autoriaCount = materiaMatches.length
    }
  } catch (e) {
    console.error(`Error fetching autorias for ${codigo}:`, e)
  }

  return data
}

async function main() {
  console.log('Fetching senators list...')
  
  const res = await fetch(`${SENATE_API}/senador/lista/atual.json`)
  if (!res.ok) {
    console.error('Failed to fetch senators list')
    process.exit(1)
  }

  const json = await res.json()
  const parlamentares = json.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || []
  
  console.log(`Found ${parlamentares.length} senators`)

  const senatorsData: Record<number, SenatorData> = {}

  // Fetch data for each senator
  for (const p of parlamentares) {
    const ip = p.IdentificacaoParlamentar
    if (!ip) continue

    const codigo = parseInt(ip.CodigoParlamentar)
    if (!codigo) continue

    const partido = ip.SiglaPartidoParlamentar || ''
    const uf = ip.UfParlamentar || ''
    const nome = ip.NomeParlamentar || ''

    console.log(`Fetching data for ${nome} (${partido}/${uf})...`)
    
    const data = await fetchSenatorDetail(codigo, nome, partido, uf)
    senatorsData[codigo] = data

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100))
  }

  // Save results
  const outputPath = path.join(process.cwd(), 'public', 'data', 'senadores-real.json')
  fs.writeFileSync(outputPath, JSON.stringify(senatorsData, null, 2))
  console.log(`Saved to ${outputPath}`)
  
  // Print summary
  const totalMandatos = Object.values(senatorsData).reduce((sum, s) => sum + s.mandatos, 0)
  const withLeadership = Object.values(senatorsData).filter(s => s.leadership.length > 0).length
  const withCargos = Object.values(senatorsData).filter(s => s.cargos.length > 0).length
  const withAutorias = Object.values(senatorsData).filter(s => s.autoriaCount > 0).length
  
  console.log('\n--- Summary ---')
  console.log(`Total senators: ${Object.keys(senatorsData).length}`)
  console.log(`Total mandates: ${totalMandatos}`)
  console.log(`With leadership: ${withLeadership}`)
  console.log(`With cargos: ${withCargos}`)
  console.log(`With authorship: ${withAutorias}`)
}

main().catch(console.error)
