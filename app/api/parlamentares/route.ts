/**
 * API Route para carregar parlamentares (contorna CORS)
 */

interface RawDeputado {
  id: number
  nome: string
  nomeCivil?: string
  siglaPartido?: string
  siglaUf?: string
  urlFoto?: string
  email?: string
  sexo?: string
  dataNascimento?: string
  escolaridade?: string
}

interface RawSenador {
  IdentificacaoParlamentar?: {
    CodigoParlamentar?: string
    NomeParlamentar?: string
    NomeCompletoParlamentar?: string
    SexoParlamentar?: string
    UrlFotoParlamentar?: string
    EmailParlamentar?: string
    SiglaPartidoParlamentar?: string
    UfParlamentar?: string
  }
}

export async function GET() {
  try {
    const depRaw: RawDeputado[] = []
    const baseUrl = 'https://dadosabertos.camara.leg.br/api/v2/deputados'
    const params = 'idLegislatura=57&itens=100&ordem=ASC&ordenarPor=nome'
    
    for (let page = 1; page <= 6; page++) {
      const url = `${baseUrl}?${params}&pagina=${page}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.ok) {
        const j = await res.json()
        const dados = j.dados ?? []
        if (dados.length === 0) break
        depRaw.push(...dados)
      } else {
        break
      }
    }

    let senRaw: RawSenador[] = []
    try {
      const res = await fetch(
        'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',
        { headers: { Accept: 'application/json' } }
      )
      if (res.ok) {
        const j = await res.json()
        senRaw = j?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar ?? []
      }
    } catch { /* ignore */ }
    
    return Response.json({
      deputados: depRaw,
      senadores: senRaw,
      counts: {
        deputados: depRaw.length,
        senadores: senRaw.length,
        total: depRaw.length + senRaw.length,
      }
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    })
  } catch (error) {
    console.error('[API parlamentares]', error)
    return Response.json({ error: 'Failed to fetch parlamentares' }, { status: 500 })
  }
}
