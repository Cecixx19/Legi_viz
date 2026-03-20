import * as fs from 'fs'
import * as path from 'path'

const SENATE_API = 'https://legis.senado.leg.br/dadosabertos'
const CURRENT_LEG = '2023-02-01'

interface SenatorVotacaoData {
  codigo: number
  nome: string
  votou: number
  totalSessoes: number
  primeiroVoto: string
  ultimoVoto: string
  taxaPresenca: number
}

async function fetchSenatorVotacoes(codigo: number, nome: string): Promise<SenatorVotacaoData> {
  const data: SenatorVotacaoData = {
    codigo,
    nome,
    votou: 0,
    totalSessoes: 0,
    primeiroVoto: '',
    ultimoVoto: '',
    taxaPresenca: 0,
  }

  try {
    const res = await fetch(`${SENATE_API}/senador/${codigo}/votacoes`)
    if (!res.ok) return data

    const xml = await res.text()
    
    // Split by Votacao tags and process each
    const votacoes = xml.split('<Votacao>').slice(1)
    
    // Filter current legislature
    const currentVotacoes = votacoes.filter(v => {
      const dateMatch = v.match(/<DataSessao>(\d{4}-\d{2}-\d{2})/)
      return dateMatch && dateMatch[1] >= CURRENT_LEG
    })
    
    data.totalSessoes = currentVotacoes.length
    data.votou = currentVotacoes.filter(v => 
      /<SiglaDescricaoVoto>Votou<\/SiglaDescricaoVoto>/.test(v)
    ).length

    // Get date range
    const dates = currentVotacoes
      .map(v => v.match(/<DataSessao>(\d{4}-\d{2}-\d{2})/)?.[1])
      .filter(Boolean) as string[]
    
    if (dates.length > 0) {
      dates.sort()
      data.primeiroVoto = dates[0]
      data.ultimoVoto = dates[dates.length - 1]
    }

    if (data.totalSessoes > 0) {
      data.taxaPresenca = Math.round((data.votou / data.totalSessoes) * 100)
    }

  } catch (e) {
    console.error(`Error fetching votacoes for ${codigo}:`, e)
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

  const existingPath = path.join(process.cwd(), 'public', 'data', 'senadores-votacoes.json')
  const existing: Record<number, any> = {}
  if (fs.existsSync(existingPath)) {
    try {
      Object.assign(existing, JSON.parse(fs.readFileSync(existingPath, 'utf8')))
    } catch {}
  }

  let fetched = 0
  for (const p of parlamentares) {
    const ip = p.IdentificacaoParlamentar
    if (!ip) continue

    const codigo = parseInt(ip.CodigoParlamentar)
    if (!codigo) continue

    const nome = ip.NomeParlamentar || ''
    console.log(`Fetching ${nome}...`)
    
    const data = await fetchSenatorVotacoes(codigo, nome)
    existing[codigo] = data
    fetched++

    await new Promise(r => setTimeout(r, 100))
  }

  fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2))
  console.log(`\nFetched ${fetched} entries`)
  
  // Summary
  const vals = Object.values(existing) as SenatorVotacaoData[]
  vals.sort((a, b) => b.taxaPresenca - a.taxaPresenca)
  console.log('\n--- Attendance Summary (Current Legislature) ---')
  vals.forEach(v => {
    console.log(`${v.nome}: ${v.taxaPresenca}% (${v.votou}/${v.totalSessoes})`)
  })
}

main().catch(console.error)
