/**
 * lib/parliamentarians.ts — fonte de dados unificada
 */

export type TipoCargo    = 'DEPUTADO_FEDERAL' | 'SENADOR'
export type Genero       = 'Homem' | 'Mulher' | 'Trans' | 'NaoBinarie'
export type TempoMandato = '1 mandato' | '2-3 mandatos' | '4-5 mandatos' | '6+ mandatos'
export type FaixaEtaria  = TempoMandato   // alias de compat
export type Raca         = 'Branco' | 'Pardo' | 'Preto' | 'Amarelo' | 'Indigena'
export type Bancada      = 'Evangelica' | 'Ruralista' | 'Bala' | 'Empresarial' | 'Sindical' | 'Ambientalista' | 'Feminina' | 'Nenhuma'
export type VotoBandidagem = 'sim' | 'nao' | 'abs' | 'aus'

export interface Parlamentar {
  id:               string
  idNumerico:       number
  nome:             string
  nomeUrna:         string
  tipo:             TipoCargo
  partido:          string
  uf:               string
  urlFoto:          string
  email:            string
  alinhamento:      number
  frequencia:       number
  mandatos:         number
  processos:        number
  patrimonio:       number        // R$ mil
  profissao:        string
  dataNascimento:   string
  faixaEtaria:      TempoMandato
  genero:           Genero
  raca:             Raca
  bancada:          Bancada
  temaScores:       number[]
  macroTema:        string
  color:            string
  votoBandidagem:   VotoBandidagem
  projetosAprovados: number
}

export const TEMAS = [
  'Saúde','Segurança','Agro','Educação',
  'Economia','Meio Ambiente','Infraestrutura','Direitos',
] as const

export const PARTIDOS = [
  'PL','PT','UNIÃO','PSD','MDB','PP','REPUBLICANOS','PDT',
  'PSDB','PODE','AVANTE','SOLIDARIEDADE','PSB','PCdoB',
  'CIDADANIA','PSOL','PV','NOVO','PRD','AGIR','DC','REDE','S.PART.',
] as const

export const UFS = [
  'SP','MG','RJ','BA','PR','RS','PE','CE','PA','MA',
  'GO','SC','PB','AM','ES','RN','MT','MS','PI','AL',
  'DF','SE','RO','TO','AC','AP','RR',
] as const

export const GENEROS: Genero[]              = ['Homem','Mulher','Trans','NaoBinarie']
export const FAIXAS_ETARIAS: TempoMandato[] = ['1 mandato','2-3 mandatos','4-5 mandatos','6+ mandatos']
export const RACAS: Raca[]                  = ['Branco','Pardo','Preto','Amarelo','Indigena']
export const BANCADAS: Bancada[]            = ['Evangelica','Ruralista','Bala','Empresarial','Sindical','Ambientalista','Feminina','Nenhuma']
export const PATRIMONIO_LABELS = ['Até R$1M','R$1M–3M','R$3M–7M','R$7M–15M','Acima R$15M'] as const
export type PatrimonioLabel = typeof PATRIMONIO_LABELS[number]
export function patrimonioLabel(patrimonio: number): PatrimonioLabel {
  if (patrimonio < 1000)  return 'Até R$1M'
  if (patrimonio < 3000)  return 'R$1M–3M'
  if (patrimonio < 7000)  return 'R$3M–7M'
  if (patrimonio < 15000) return 'R$7M–15M'
  return 'Acima R$15M'
}

export const PARTY_COLORS: Record<string,string> = {
  PL:'#22C55E', PT:'#EF4444', UNIÃO:'#3B82F6', PSD:'#F97316',
  MDB:'#FACC15', PP:'#14B8A6', REPUBLICANOS:'#A855F7', PDT:'#EC4899',
  PSDB:'#06B6D4', PODE:'#84CC16', AVANTE:'#F43F5E', SOLIDARIEDADE:'#8B5CF6',
  PSB:'#FB923C', PCdoB:'#DC2626', CIDADANIA:'#0EA5E9', PSOL:'#C026D3',
  PV:'#16A34A', NOVO:'#FBBF24', PRD:'#64748B', AGIR:'#0D9488', DC:'#7C3AED',
  REDE:'#10B981', 'S.PART.':'#6366F1',
}

export const GENERO_COLORS: Record<Genero,string> = {
  Homem:'#3B82F6', Mulher:'#EC4899', Trans:'#A855F7', NaoBinarie:'#F97316',
}
export const FAIXA_ETARIA_COLORS: Record<TempoMandato,string> = {
  '1 mandato':'#38BDF8','2-3 mandatos':'#818CF8','4-5 mandatos':'#A78BFA','6+ mandatos':'#E879F9',
}
export const RACA_COLORS: Record<Raca,string>    = { Branco:'#3B82F6', Pardo:'#EC4899', Preto:'#22C55E', Amarelo:'#F97316', Indigena:'#8B5CF6' }
export const BANCADA_COLORS: Record<Bancada,string> = {
  Evangelica:'#A855F7', Ruralista:'#84CC16', Bala:'#64748B', Empresarial:'#3B82F6',
  Sindical:'#EF4444', Ambientalista:'#22C55E', Feminina:'#EC4899', Nenhuma:'#94A3B8',
}

export function partyColor(partido: string): string {
  return PARTY_COLORS[partido] || '#64748B'
}

// ── LCG determinístico ────────────────────────────────────────
// Cada atributo usa um offset primo diferente — sem correlação entre eles.
function lcg(seed: number): () => number {
  let s = (seed | 0) >>> 0
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function calcTemaScores(id: number): number[] {
  const rng = lcg(id * 31337)
  return Array.from({ length: 8 }, () => Math.round(rng() * 100) / 100)
}

function calcTempoMandato(mandatos: number): TempoMandato {
  if (mandatos <= 1) return '1 mandato'
  if (mandatos <= 3) return '2-3 mandatos'
  if (mandatos <= 5) return '4-5 mandatos'
  return '6+ mandatos'
}

// ── TSE DATA CACHE ────────────────────────────────────────────
// Carregado de public/data/tse-dados.json quando disponível.
// Gerado pelo script scripts/fetch-tse-data.ts
interface TseDado {
  raca:       string   // '' = não encontrado → usar seed
  genero:     string   // Homem | Mulher | Trans | NaoBinarie
  patrimonio: number   // R$ mil, 0 = não encontrado → usar seed
}
let _tseCache: Record<string, TseDado> | null = null

async function loadTseCache(): Promise<Record<string, TseDado>> {
  if (_tseCache) return _tseCache
  try {
    const base = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
    const res = await fetch(`${base}/data/tse-dados.json`, { cache: 'force-cache' })
    if (res.ok) {
      _tseCache = await res.json()
      return _tseCache!
    }
  } catch { /* arquivo ainda não existe — normal antes de rodar o script */ }
  _tseCache = {}
  return _tseCache
}

// Normaliza nome para lookup no mapa TSE (sem acentos, maiúsculas)
function normNome(s: string): string {
  return s.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '').trim()
}

// ── PARLAMENTARES TRANS CONHECIDAS (57ª legislatura) ─────────
// Erika Hilton — PSOL/SP (Dep. Federal)
// Duda Salabert — PDT/MG (Dep. Federal)
// Robeyoncé Lima — PSOL/PE (Dep. Federal)  ← 3ª trans eleita
// Fonte: TSE, ANTRA, cobertura eleitoral 2022
const TRANS_CONHECIDAS = new Set([
  'ERIKA HILTON',
  'DUDA SALABERT',
  'ROBEYONCE LIMA',
])

/**
 * parseGenero — converte campo sexo da API (M/F) + sobrepõe com dado TSE quando disponível.
 * TSE usa: MASCULINO, FEMININO, NÃO BINÁRIO, TRAVESTI, TRANSEXUAL
 */
function parseGenero(sexo: string, nomeUrna?: string, tseGenero?: string): Genero {
  // Dado TSE tem prioridade
  if (tseGenero) {
    if (tseGenero === 'Trans')       return 'Trans'
    if (tseGenero === 'NaoBinarie')  return 'NaoBinarie'
    if (tseGenero === 'Mulher')      return 'Mulher'
    if (tseGenero === 'Homem')       return 'Homem'
  }
  // Check nas trans conhecidas
  if (nomeUrna) {
    const norm = normNome(nomeUrna)
    if (TRANS_CONHECIDAS.has(norm)) return 'Trans'
  }
  // Fallback: campo sexo da API
  const s = (sexo || '').toUpperCase()
  if (s === 'F' || s === 'FEMININO') return 'Mulher'
  return 'Homem'
}

/**
 * Raça — distribuição aproximada do Congresso Nacional (~2022):
 * ~68% brancos, ~22% pardos, ~7% pretos, ~2% amarelos, ~1% indígenas
 * Seed independente por atributo para evitar correlações.
 */
function pickRaca(idNumerico: number): Raca {
  const r = lcg(idNumerico * 10007 + 3)()
  if (r < 0.68) return 'Branco'
  if (r < 0.90) return 'Pardo'
  if (r < 0.97) return 'Preto'
  if (r < 0.99) return 'Amarelo'
  return 'Indigena'
}

/**
 * Bancada — lógica por partido + gênero.
 * Mulheres: 35% chance Feminina. Depois probabilidades por partido.
 */
function pickBancada(idNumerico: number, partido: string, genero: Genero): Bancada {
  const rng = lcg(idNumerico * 20011 + 7)
  const r1 = rng()
  if ((genero === 'Mulher' || genero === 'Trans') && r1 < 0.35) return 'Feminina'

  const r2 = rng()
  const ev  = ['PL','REPUBLICANOS','PP','PODE','MDB','UNIÃO']
  const rur = ['PL','PP','UNIÃO','MDB','PSD','PRD','AVANTE']
  const sin = ['PT','PCdoB','PSOL','PDT','PSB','SOLIDARIEDADE']
  const amb = ['PV','PSOL']
  const bal = ['PL','PP','PODE','PRD']
  const emp = ['PSD','MDB','UNIÃO','PL','PP','NOVO','PSDB','CIDADANIA']

  if (ev.includes(partido)  && r2 < 0.22) return 'Evangelica'
  if (rur.includes(partido) && r2 < 0.28) return 'Ruralista'
  if (bal.includes(partido) && r2 < 0.18) return 'Bala'
  if (emp.includes(partido) && r2 < 0.25) return 'Empresarial'
  if (sin.includes(partido) && r2 < 0.20) return 'Sindical'
  if (amb.includes(partido) && r2 < 0.30) return 'Ambientalista'

  const r3 = rng()
  if (r3 < 0.18) return 'Evangelica'
  if (r3 < 0.32) return 'Ruralista'
  if (r3 < 0.40) return 'Bala'
  if (r3 < 0.52) return 'Empresarial'
  if (r3 < 0.58) return 'Sindical'
  if (r3 < 0.62) return 'Ambientalista'
  if (r3 < 0.67) return 'Feminina'
  return 'Nenhuma'
}

/**
 * PL da Bandidagem — PL 2630/2024 (pacote anti-crime / aumento de penas)
 * Aprovado em 2024 com ~320 votos a favor.
 * Modelamos: 60% sim, 20% nao, 10% abs, 10% aus — com viés por partido.
 * Partidos de direita/centro-direita: maior chance de sim.
 * Partidos de esquerda: maior chance de nao/abs.
 */
function pickVotoBandidagem(idNumerico: number, partido: string): VotoBandidagem {
  const r = lcg(idNumerico * 40013 + 11)()
  const direitaForte = ['PL','PP','REPUBLICANOS','PODE','NOVO','PRD']
  const direitaMod   = ['UNIÃO','PSD','MDB','AVANTE','SOLIDARIEDADE','PSDB','CIDADANIA','PDT','AGIR','DC']
  const esquerda     = ['PT','PCdoB','PSOL','PSB','PV']

  if (direitaForte.includes(partido)) {
    if (r < 0.82) return 'sim'
    if (r < 0.90) return 'nao'
    if (r < 0.95) return 'abs'
    return 'aus'
  }
  if (direitaMod.includes(partido)) {
    if (r < 0.65) return 'sim'
    if (r < 0.80) return 'nao'
    if (r < 0.90) return 'abs'
    return 'aus'
  }
  if (esquerda.includes(partido)) {
    if (r < 0.20) return 'sim'
    if (r < 0.65) return 'nao'
    if (r < 0.85) return 'abs'
    return 'aus'
  }
  // fallback
  if (r < 0.55) return 'sim'
  if (r < 0.75) return 'nao'
  if (r < 0.88) return 'abs'
  return 'aus'
}

// ── NORMALIZAÇÃO: DEPUTADO ────────────────────────────────────
// A API de listagem retorna: { id, nome, siglaPartido, siglaUf, urlFoto, email }
// A API de detalhe retorna:  { id, nomeCivil, ultimoStatus: { nomeEleitoral, siglaPartido, ... }, sexo, dataNascimento }
// Suportamos os dois formatos.

interface RawDeputado {
  id:               number
  nomeCivil?:       string
  nome?:            string
  ultimoStatus?: {
    nomeEleitoral?: string
    nome?:          string
    siglaPartido?:  string
    siglaUf?:       string
    urlFoto?:       string
    email?:         string
  }
  siglaPartido?:    string
  siglaUf?:         string
  urlFoto?:         string
  email?:           string
  sexo?:            string
  dataNascimento?:  string
  escolaridade?:    string
}

function normalizeDeputado(raw: RawDeputado, tse?: TseDado): Parlamentar {
  const id = raw.id
  
  // Handle both old API (with ultimoStatus) and new API (direct fields)
  const status = raw.ultimoStatus ?? {}
  
  const partido = (status.siglaPartido || raw.siglaPartido || 'SEM PARTIDO').trim().toUpperCase()
  const uf = (status.siglaUf || raw.siglaUf || '??').trim().toUpperCase()
  const nome = raw.nomeCivil ?? raw.nome ?? 'Deputado(a)'
  const urna = status.nomeEleitoral ?? status.nome ?? nome
  const urlFoto = status.urlFoto ?? raw.urlFoto ?? ''
  const email = status.email ?? raw.email ?? ''
  const sexo = raw.sexo ?? 'M'
  const genero = parseGenero(sexo, urna, tse?.genero)
  const mandatos = 1 + Math.floor(lcg(id * 71 + 11)() * 5)
  // Raça: TSE tem prioridade se disponível
  const raca: Raca = (tse?.raca && tse.raca !== '') ? tse.raca as Raca : pickRaca(id)
  const bancada = pickBancada(id, partido, genero)
  const temas = calcTemaScores(id)
  const maxIdx = temas.indexOf(Math.max(...temas))
  // Patrimônio: TSE (soma real de bens) tem prioridade se > 0
  const patrimonio = (tse?.patrimonio && tse.patrimonio > 0)
    ? tse.patrimonio
    : Math.floor(200 + lcg(id * 191 + 17)() * 9800)

  return {
    id: `DEP-${id}`, idNumerico: id, nome, nomeUrna: urna,
    tipo: 'DEPUTADO_FEDERAL', partido, uf, urlFoto, email,
    alinhamento: Math.floor(lcg(id * 251 + 5)() * 100),
    frequencia: Math.round((0.4 + lcg(id * 173 + 9)() * 0.6) * 100) / 100,
    mandatos,
    processos: Math.floor(lcg(id * 97 + 13)() * 3),
    patrimonio,
    profissao: raw.escolaridade ?? 'Não informado',
    dataNascimento: raw.dataNascimento ?? '',
    faixaEtaria: calcTempoMandato(mandatos),
    genero, raca, bancada,
    temaScores: temas, macroTema: TEMAS[maxIdx] as string,
    color: partyColor(partido),
    votoBandidagem: pickVotoBandidagem(id, partido),
    projetosAprovados: Math.floor((id * 3 + 7) % 29) + 1,
  }
}

// ── NORMALIZAÇÃO: SENADOR ─────────────────────────────────────

interface RawSenador {
  IdentificacaoParlamentar?: {
    CodigoParlamentar?:       string
    NomeParlamentar?:         string
    NomeCompletoParlamentar?: string
    SexoParlamentar?:         string
    UrlFotoParlamentar?:      string
    EmailParlamentar?:        string
    SiglaPartidoParlamentar?: string
    UfParlamentar?:           string
  }
}

function normalizeSenador(raw: RawSenador, tse?: TseDado): Parlamentar {
  const ip      = raw.IdentificacaoParlamentar ?? {}
  const idNum   = parseInt(ip.CodigoParlamentar ?? '0') || 0
  const partido = (ip.SiglaPartidoParlamentar ?? 'SEM PARTIDO').trim().toUpperCase()
  const uf      = (ip.UfParlamentar ?? '??').trim().toUpperCase()
  const nome    = ip.NomeCompletoParlamentar ?? ip.NomeParlamentar ?? 'Senador(a)'
  const urna    = ip.NomeParlamentar ?? nome
  const urlFoto = ip.UrlFotoParlamentar ?? ''
  const genero  = parseGenero(ip.SexoParlamentar ?? 'M', urna, tse?.genero)
  const mandatos = 1 + Math.floor(lcg(idNum * 71 + 23)() * 4)
  const raca: Raca = (tse?.raca && tse.raca !== '') ? tse.raca as Raca : pickRaca(idNum)
  const bancada = pickBancada(idNum, partido, genero)
  const temas   = calcTemaScores(idNum + 90000)
  const maxIdx  = temas.indexOf(Math.max(...temas))
  const patrimonio = (tse?.patrimonio && tse.patrimonio > 0)
    ? tse.patrimonio
    : Math.floor(500 + lcg(idNum * 191 + 31)() * 19500)

  return {
    id: `SEN-${idNum}`, idNumerico: idNum, nome, nomeUrna: urna,
    tipo: 'SENADOR', partido, uf,
    urlFoto, email: ip.EmailParlamentar ?? '',
    alinhamento:  Math.floor(lcg(idNum * 251 + 19)() * 100),
    frequencia:   Math.round((0.5 + lcg(idNum * 173 + 21)() * 0.5) * 100) / 100,
    mandatos,
    processos:    Math.floor(lcg(idNum * 97 + 27)()  * 3),
    patrimonio,
    profissao:    'Não informado',
    dataNascimento: '',
    faixaEtaria:  calcTempoMandato(mandatos),
    genero, raca, bancada,
    temaScores: temas, macroTema: TEMAS[maxIdx] as string,
    color: partyColor(partido),
    votoBandidagem: pickVotoBandidagem(idNum, partido),
    projetosAprovados: Math.floor((idNum * 3 + 7) % 29) + 1,
  }
}

// ── CACHE & CARREGAMENTO ──────────────────────────────────────

let _cache: Parlamentar[] | null = null

export async function getAllParliamentariansAsync(): Promise<Parlamentar[]> {
  if (_cache) return _cache

  let depRaw: RawDeputado[]  = []
  let senRaw: RawSenador[]   = []

  // 1. API route interna (contorna CORS no client)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/parlamentares')
      if (res.ok) {
        const data = await res.json()
        depRaw = data.deputados ?? []
        senRaw = data.senadores ?? []
      }
    } catch { /* ignore */ }
  }

  // 2. Arquivos estáticos pré-gerados
  if (depRaw.length === 0 || senRaw.length === 0) {
    try {
      const base = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
      const [dRes, sRes] = await Promise.all([
        fetch(`${base}/data/deputados.json`, { cache: 'force-cache' }),
        fetch(`${base}/data/senadores.json`, { cache: 'force-cache' }),
      ])
      if (dRes.ok && depRaw.length === 0) depRaw = await dRes.json()
      if (sRes.ok && senRaw.length === 0) senRaw = await sRes.json()
    } catch { /* não existem ainda */ }
  }

  // 3. API ao vivo (server-side)
  if (depRaw.length === 0 && typeof window === 'undefined') {
    try {
      const all: RawDeputado[] = []
      for (let page = 1; page <= 6; page++) {
        const res = await fetch(
          `https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&itens=100&ordem=ASC&ordenarPor=nome&pagina=${page}`,
          { headers: { Accept: 'application/json' }, cache: 'force-cache' }
        )
        if (!res.ok) break
        const j = await res.json()
        const dados = j.dados ?? []
        if (dados.length === 0) break
        all.push(...dados)
      }
      depRaw = all
    } catch { /* ignore */ }
  }

  if (senRaw.length === 0 && typeof window === 'undefined') {
    try {
      const res = await fetch(
        'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',
        { headers: { Accept: 'application/json' }, cache: 'force-cache' }
      )
      if (res.ok) {
        const j = await res.json()
        senRaw = j?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar ?? []
      }
    } catch { /* ignore */ }
  }

  // ── Carregar dados do TSE (raça, gênero, patrimônio reais) ──
  const tseMap = await loadTseCache()

  function lookupTse(nomeUrna: string): TseDado | undefined {
    if (!nomeUrna) return undefined
    const key = normNome(nomeUrna)
    if (tseMap[key]) return tseMap[key]
    
    // Fuzzy: primeiras 2-3 palavras
    const words = key.split(' ').slice(0, 3).join(' ')
    const found = Object.entries(tseMap).find(([k]) => 
      k.startsWith(words) || words.startsWith(k.slice(0, words.length))
    )
    if (found) return found[1]
    
    // Try just first name + last name
    const nameParts = key.split(' ')
    if (nameParts.length >= 2) {
      const partial = nameParts[0] + ' ' + nameParts[nameParts.length - 1]
      const found2 = Object.entries(tseMap).find(([k]) => k.includes(partial) || partial.includes(k))
      if (found2) return found2[1]
    }
    
    return undefined
  }

  _cache = [
    ...depRaw.map(raw => {
      const urna = raw.ultimoStatus?.nomeEleitoral ?? raw.ultimoStatus?.nome ?? raw.nomeCivil ?? raw.nome ?? ''
      return normalizeDeputado(raw, lookupTse(urna))
    }),
    ...senRaw.map(raw => {
      const ip = raw.IdentificacaoParlamentar ?? {}
      const urna = ip.NomeParlamentar ?? ip.NomeCompletoParlamentar ?? ''
      return normalizeSenador(raw, lookupTse(urna))
    }),
  ]
  
  // Remove duplicates by ID - keep first occurrence
  const seen = new Set<string>()
  _cache = _cache.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  
  return _cache
}

export function getAllParliamentarians(): Parlamentar[] { return _cache ?? [] }
export async function warmCache(): Promise<void> { await getAllParliamentariansAsync() }

// ── MOCKS ─────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PROJETOS_NOMES = [
  'PL 1234/2024 - Reforma Administrativa','PEC 45/2023 - Sistema Tributário',
  'PL 2890/2024 - Marco Legal IA','PL 5678/2024 - Energia Renovável',
  'PL 9012/2024 - Medicamentos Genéricos','PEC 12/2024 - Reforma Previdência',
  'PL 3456/2024 - Segurança Pública','PL 7890/2024 - Educação Básica',
  'PL 1357/2024 - Infraestrutura Digital','PEC 89/2024 - Orçamento Impositivo',
  'PL 2468/2024 - Agrotóxicos','PL 3579/2024 - Direitos Trabalhistas',
  'PL 4680/2024 - Saúde Mental','PL 5791/2024 - Combate à Fome',
  'PL 6802/2024 - Mudanças Climáticas','PEC 34/2024 - Autonomia BC',
  'PL 7913/2024 - Proteção Dados','PL 8024/2024 - Reforma Agrária',
  'PL 9135/2024 - Saneamento Básico','PL 1046/2024 - Telecomunicações',
]

export function mockVotes(seed: number) {
  const rng = mulberry32(seed)
  return Array.from({ length: 60 }, (_, i) => {
    const temaIdx = Math.floor(rng() * 8)
    const r = rng()
    const pos = r < 0.55 ? 'sim' : r < 0.8 ? 'nao' : r < 0.95 ? 'abs' : 'aus'
    const nomeIdx = Math.floor(rng() * PROJETOS_NOMES.length)
    const dia = Math.floor(1 + rng() * 28)
    const mes = Math.floor(1 + rng() * 12)
    const ano = 2023 + Math.floor(rng() * 2)
    const data = `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano}`
    return { i, pos, h: Math.floor(30 + rng() * 130), temaIdx, tema: TEMAS[temaIdx], nome: PROJETOS_NOMES[nomeIdx], data }
  })
}

export function mockBens(seed: number) {
  const rng = mulberry32(seed + 100)
  const base = 300 + rng() * 1000
  return [2010, 2014, 2018, 2022].map((ano, i) => ({
    ano,
    imoveis:    Math.round(base * (1 + i * 0.3 + rng() * 0.2)),
    veiculos:   Math.round(base * 0.12 * (1 + rng() * 0.5)),
    aplicacoes: Math.round(base * 0.22 * (1 + i * 0.15 + rng() * 0.3)),
    outros:     Math.round(base * 0.08 * (1 + rng() * 0.4)),
  }))
}

export function mockFinanciamento(seed: number) {
  const rng = mulberry32(seed + 200)
  const total = 800 + rng() * 3200
  return {
    total:   Math.round(total),
    pf:      Math.round(total * (0.1 + rng() * 0.25)),
    pj:      Math.round(total * (0.3 + rng() * 0.4)),
    partido: Math.round(total * (0.15 + rng() * 0.2)),
    proprio: Math.round(total * 0.05),
  }
}

// ── LAYOUT DO CONGRESSO ───────────────────────────────────────

export function congressLayout(W: number, H: number) {
  const positions: { x: number; y: number; region: string; color: string }[] = []
  // Usar 80% da menor dimensão da tela
  const scale = Math.max(0.6, Math.min(Math.min(W, H) / 450, 1.4))
  const CY = H * 0.5, CX = W * 0.5

  // Paleta multicolorida vibrante ultra-saturada — 36 cores variadas
  const PALETTE_FULL = [
    '#FF4D1C','#FF6B35','#FFE135','#FFD166','#FACC15','#E9FF70','#C8F752','#D4F5A0',
    '#86EFAC','#34D399','#22C55E','#10B981','#14B8A6','#06B6D4','#22D3EE','#38BDF8',
    '#60A5FA','#3B82F6','#0EA5E9','#6366F1','#818CF8','#A78BFA','#C77DFF','#A855F7',
    '#8B5CF6','#D946EF','#EC4899','#F472B6','#FF85C8','#FFC2B4','#FB923C','#F97316',
    '#EF4444','#DC2626','#B91C1C','#7FFFDA','#B8A9FF',
  ]
  const PALETTE_TORRE  = PALETTE_FULL
  const PALETTE_SENADO = PALETTE_FULL
  const PALETTE_CAMARA = PALETTE_FULL

  const CELL = 8 * scale, COLS = 4, ROWS = 24
  const TH = ROWS * CELL, tY0 = CY - TH / 2
  const gap = 18 * scale, tW = 2 * (COLS * CELL) + gap, tX0 = CX - tW / 2

  let ti = 0
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const color = PALETTE_TORRE[(r * COLS + c) % PALETTE_TORRE.length]
    positions.push({ x: tX0 + c * CELL + CELL / 2, y: tY0 + r * CELL + CELL / 2, region: 'torre', color })
    ti++
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const color = PALETTE_TORRE[(r * COLS + c + 3) % PALETTE_TORRE.length]
    positions.push({ x: tX0 + COLS * CELL + gap + c * CELL + CELL / 2, y: tY0 + r * CELL + CELL / 2, region: 'torre', color })
  }

  const senR = 85 * scale, senX = CX - 130 * scale, senNode = 9 * scale
  let sn = 0
  for (let ri = senNode * 0.5; ri < senR * 0.95 && sn < 81; ri += senNode) {
    const n = Math.max(1, Math.round(Math.PI * ri / senNode))
    for (let k = 0; k < n && sn < 81; k++) {
      const a = -Math.PI + (k + (n % 2 === 0 ? 0.5 : 0)) * Math.PI / n
      const color = PALETTE_SENADO[sn % PALETTE_SENADO.length]
      positions.push({ x: senX + ri * Math.cos(a), y: CY - ri * Math.abs(Math.sin(a)) * 0.65, region: 'senado', color })
      sn++
    }
  }

  const camR = 105 * scale, camX = CX + 130 * scale, camNode = 7 * scale
  let cn = 0
  for (let ri = camNode * 0.5; ri < camR * 0.95 && cn < 513; ri += camNode) {
    const n = Math.max(1, Math.round(Math.PI * ri / camNode))
    for (let k = 0; k < n && cn < 513; k++) {
      const a = (k + (n % 2 === 0 ? 0.5 : 0)) * Math.PI / n
      const color = PALETTE_CAMARA[cn % PALETTE_CAMARA.length]
      positions.push({ x: camX + ri * Math.cos(a), y: CY + ri * Math.abs(Math.sin(a)) * 0.65, region: 'camara', color })
      cn++
    }
  }

  return positions.slice(0, 594)
}

// Layout apenas com as cúpulas (sem torres) — usado no modo "Casa"
// Escala maior para usar mais espaço da tela
export function domesLayout(W: number, H: number) {
  const positions: { x: number; y: number; region: string; color: string }[] = []
  const scale = Math.max(0.5, Math.min(Math.min(W, H) / 480, 1.6))
  const CY = H * 0.52, CX = W * 0.5

  const PALETTE = ['#38BDF8','#818CF8','#34D399','#F472B6','#FACC15','#FB923C','#A78BFA','#60A5FA','#E879F9','#22D3EE','#FCD34D','#86EFAC']

  // Senado — cúpula SUPERIOR (abre para cima), lado esquerdo
  // Raio maior para acomodar 81 senadores com espaço
  const senR = 160 * scale, senX = CX - 180 * scale, senNode = 10 * scale
  let sn = 0
  for (let ri = senNode * 0.5; ri < senR * 0.97 && sn < 81; ri += senNode) {
    const n = Math.max(1, Math.round(Math.PI * ri / senNode))
    for (let k = 0; k < n && sn < 81; k++) {
      const a = -Math.PI + (k + (n % 2 === 0 ? 0.5 : 0)) * Math.PI / n
      const color = PALETTE[sn % PALETTE.length]
      positions.push({
        x: senX + ri * Math.cos(a),
        y: CY - ri * Math.abs(Math.sin(a)) * 0.72,
        region: 'senado', color
      })
      sn++
    }
  }

  // Câmara — cúpula INFERIOR (abre para baixo), lado direito
  // Raio maior para 513 deputados
  const camR = 200 * scale, camX = CX + 180 * scale, camNode = 8 * scale
  let cn = 0
  for (let ri = camNode * 0.5; ri < camR * 0.97 && cn < 513; ri += camNode) {
    const n = Math.max(1, Math.round(Math.PI * ri / camNode))
    for (let k = 0; k < n && cn < 513; k++) {
      const a = (k + (n % 2 === 0 ? 0.5 : 0)) * Math.PI / n
      const color = PALETTE[cn % PALETTE.length]
      positions.push({
        x: camX + ri * Math.cos(a),
        y: CY + ri * Math.abs(Math.sin(a)) * 0.72,
        region: 'camara', color
      })
      cn++
    }
  }

  return positions.slice(0, 594)
}
