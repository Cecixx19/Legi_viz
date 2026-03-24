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
- **Zustand** — Gerenciamento de estado global

## Arquitetura

### Estrutura do Projeto

```
app/
  page.tsx                    — Página principal (orquestra componentes)
  perfil/
    page.tsx                  — Dashboard do usuário
    [id]/page.tsx             — Perfil individual do parlamentar
  api/                        — Rotas de API (extensível)
components/
  network-graph.tsx           — Canvas force-graph (594 parlamentares)
  parliamentarian-profile.tsx — Perfil completo com 10 abas de informação
  dashboard/                  — Componentes do dashboard do usuário
    top-bar.tsx               — Barra de navegação e busca
    sidebar-menu.tsx          — Menu lateral
    saved-card.tsx            — Card de parlamentar salvo
    collection-modals.tsx     — Modais de coleção
    dashboard-view.tsx        — View completa do dashboard
  filters/
    filter-panel.tsx          — Painel de filtros (partido, UF, etc.)
lib/
  parliamentarians.ts         — Tipos, dados, layout do Congresso
  constants/                  — Constantes centralizadas
    colors.ts                 — Cores de partidos, estados, temas
    clusters.ts               — Configurações de agrupamento
    layouts.ts                — Posições e constantes de layout
    data.ts                   — Aliases e normalização de dados
  stores/                     — Estado global (Zustand)
    filter-store.ts           — Filtros e busca
    collections-store.ts      — Parlamentares salvos e coleções
    ui-store.ts               — Tema, views, menus, animações
scripts/
  fetch-*.ts                  — Scripts de coleta de dados (37 arquivos)
  process-*.ts                — Scripts de processamento de dados
public/data/                  — Dados estáticos pré-processados
  deputados-info.json         — Informações dos deputados
  senadores-real.json         — Dados dos senadores
  *.json                      — Dados de votações, cotas, patrimônio, etc.
docs/                         — Documentação do projeto
  CLEANUP.md                  — Log de limpeza e refatoração
  SIMPLIFICATION.md           — Guia de migração e uso
```

### Padrões de Design

- **Componentes Funcionais** — React 19 com hooks
- **Estado Global** — Zustand para gerenciamento de estado
- **Renderização** — Next.js estático (output: 'export')
- **Visualização** — Canvas 2D para graph de rede com D3
- **Tipagem** — TypeScript estrito

### Fluxo de Dados

1. **Build time**: Scripts em `scripts/` coletam dados das APIs governamentais
2. **Static generation**: Dados pré-processados em `public/data/`
3. **Client-side**: Zustand stores gerenciam estado da UI
4. **Persistência**: localStorage para favoritos e coleções do usuário

## Licença

Dados governamentais de domínio público. Código sob MIT.
