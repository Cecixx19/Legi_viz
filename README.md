# Painel de Transparência Parlamentar — legi-viz

Plataforma pública para visualização e análise dos 594 parlamentares do Congresso Nacional do Brasil (513 Deputados Federais + 81 Senadores).

## Início rápido

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para ativar dados reais do TSE (gênero, raça, patrimônio):
```bash
npx tsx scripts/fetch-tse-data.ts
```

## Fontes de dados

| Fonte | Dados | URL |
|---|---|---|
| **API da Câmara dos Deputados** | Deputados ativos, votações, proposições, presença, cota parlamentar | https://dadosabertos.camara.leg.br/api/v2 |
| **API do Senado Federal (Dados Abertos)** | Senadores ativos, atividades legislativas | https://legis.senado.leg.br/dadosabertos |
| **TSE — Divulga Contas** | Bens declarados (patrimônio), financiamento de campanha | https://divulgacandcontas.tse.jus.br |
| **Portal da Transparência (CGU)** | Cota parlamentar detalhada, remunerações | https://www.portaltransparencia.gov.br |
| **Portal da Câmara — Proposições** | Fichas de tramitação de PLs e PECs | https://www.camara.leg.br/proposicoesWeb |

### Dados simulados (quando API indisponível)

Dados de raça, gênero, mandatos anteriores, filiações a bancadas, e
alinhamento ao governo são gerados deterministicamente via LCG (Linear
Congruential Generator) para fins de demonstração. O script
`scripts/fetch-tse-data.ts` sobrepõe esses valores com dados reais do TSE
quando disponíveis.

## Stack

- **Next.js 14** + TypeScript + Tailwind CSS
- **D3 / Canvas 2D** — network graph de força com 594 nós
- **SVG Patterns** — Design System de pixelagem para gráficos

## Arquitetura

```
app/
  page.tsx          — Página principal (network graph + filtros)
  perfil/page.tsx   — Dashboard do usuário (coleções, favoritos)
  api/parlamentares — Proxy API para contornar CORS
components/
  network-graph.tsx         — Canvas force-graph com animação Congresso Nacional
  parliamentarian-profile.tsx — Card de perfil com 10 abas
  pixel-patterns.tsx        — Design system de padrões SVG
lib/
  parliamentarians.ts       — Tipos, dados, congressLayout()
scripts/
  fetch-tse-data.ts         — Baixa dados reais do TSE
```

## Licença

Dados governamentais de domínio público. Código sob MIT.
