import * as fs from 'fs'
import * as path from 'path'

const SENATE_API = 'https://legis.senado.leg.br/dadosabertos'
const CURRENT_LEG = '2023-02-01'

interface VoteDetail {
  data: string
  sigla: string
  numero: number
  ano: number
  codigo: number
  ementa: string
  descricao: string
  voto: string  // Sim, Não, Abstenção, Votou, Não Votou
  resultado: string
}

interface SenatorVotosDetail {
  codigo: number
  nome: string
  votou: number
  naoVotou: number
  sim: number
  nao: number
  abstencao: number
  primeiroVoto: string
  ultimoVoto: string
  votos: VoteDetail[]
}

async function fetchSenatorVotos(codigo: number, nome: string): Promise<SenatorVotosDetail> {
  const data: SenatorVotosDetail = {
    codigo,
    nome,
    votou: 0,
    naoVotou: 0,
    sim: 0,
    nao: 0,
    abstencao: 0,
    primeiroVoto: '',
    ultimoVoto: '',
    votos: [],
  }

  try {
    const res = await fetch(`${SENATE_API}/senador/${codigo}/votacoes`)
    if (!res.ok) return data

    const xml = await res.text()
    
    // Split by Votacao tags
    const votacoesBlocks = xml.split('<Votacao>').slice(1)
    
    // Filter current legislature
    const currentBlocks = votacoesBlocks.filter(v => {
      const dateMatch = v.match(/<DataSessao>(\d{4}-\d{2}-\d{2})/)
      return dateMatch && dateMatch[1] >= CURRENT_LEG
    })
    
    // Process each voting
    for (const block of currentBlocks) {
      const dateMatch = block.match(/<DataSessao>(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) continue
      const dataVoto = dateMatch[1]
      
      const siglaMatch = block.match(/<Sigla>(\w+)<\/Sigla>/)
      const numeroMatch = block.match(/<Numero>(\d+)<\/Numero>/)
      const anoMatch = block.match(/<Ano>(\d{4})<\/Ano>/)
      const codigoMatch = block.match(/<Codigo>(\d+)<\/Codigo>/)
      const ementaMatch = block.match(/<Ementa>([^<]+)<\/Ementa>/)
      const descMatch = block.match(/<DescricaoVotacao>([^<]+)<\/DescricaoVotacao>/)
      const resultadoMatch = block.match(/<DescricaoResultado>([^<]+)<\/DescricaoResultado>/)
      const siglaVotoMatch = block.match(/<SiglaDescricaoVoto>([^<]+)<\/SiglaDescricaoVoto>/)
      const votoMatch = block.match(/<Voto>([^<]+)<\/Voto>/)
      
      const sigla = siglaMatch?.[1] || ''
      const numero = parseInt(numeroMatch?.[1] || '0')
      const ano = parseInt(anoMatch?.[1] || '0')
      const codigo = parseInt(codigoMatch?.[1] || '0')
      const ementa = ementaMatch?.[1]?.substring(0, 150) || ''
      const descricao = descMatch?.[1]?.substring(0, 200) || ''
      const resultado = resultadoMatch?.[1] || ''
      const siglaVoto = siglaVotoMatch?.[1] || ''
      const voto = votoMatch?.[1] || ''
      
      // Count votes
      if (siglaVoto === 'Votou') {
        data.votou++
        if (voto === 'Sim') data.sim++
        else if (voto === 'Não') data.nao++
        else if (voto === 'Abstenção') data.abstencao++
      } else if (siglaVoto === 'Não Votou') {
        data.naoVotou++
      }
      
      // Store vote detail
      data.votos.push({
        data: dataVoto,
        sigla,
        numero,
        ano,
        codigo,
        ementa,
        descricao,
        voto: voto || siglaVoto,
        resultado,
      })
    }
    
    // Sort by date descending
    data.votos.sort((a, b) => b.data.localeCompare(a.data))
    
    if (data.votos.length > 0) {
      data.primeiroVoto = data.votos[data.votos.length - 1].data
      data.ultimoVoto = data.votos[0].data
    }

  } catch (e) {
    console.error(`Error fetching votos for ${codigo}:`, e)
  }

  return data
}

async function main() {
  const res = await fetch(`${SENATE_API}/senador/lista/atual.json`)
  if (!res.ok) {
    console.error('Failed to fetch senators list')
    process.exit(1)
  }

  const json = await res.json()
  const parlamentares = json.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || []
  console.log(`Found ${parlamentares.length} senators`)

  const outputPath = path.join(process.cwd(), 'public', 'data', 'senadores-votacoes-detail.json')
  const existing: Record<number, SenatorVotosDetail> = {}
  
  if (fs.existsSync(outputPath)) {
    try {
      Object.assign(existing, JSON.parse(fs.readFileSync(outputPath, 'utf8')))
      console.log(`Loaded ${Object.keys(existing).length} existing entries`)
    } catch {}
  }

  let fetched = 0
  for (const p of parlamentares) {
    const ip = p.IdentificacaoParlamentar
    if (!ip) continue

    const codigo = parseInt(ip.CodigoParlamentar)
    if (!codigo || existing[codigo]?.votos?.length > 0) continue

    const nome = ip.NomeParlamentar || ''
    console.log(`Fetching ${nome}...`)
    
    const data = await fetchSenatorVotos(codigo, nome)
    existing[codigo] = data
    fetched++

    // Save progress every 10
    if (fetched % 10 === 0) {
      fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
      console.log(`Progress: ${fetched} entries`)
    }

    await new Promise(r => setTimeout(r, 100))
  }

  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
  console.log(`\nDone! Fetched ${fetched} entries, total: ${Object.keys(existing).length}`)
  
  // Summary
  const vals = Object.values(existing)
  const totalVotos = vals.reduce((sum, v) => sum + v.votos.length, 0)
  console.log(`Total individual votes: ${totalVotos}`)
}

main().catch(console.error)
