/**
 * Cluster configuration constants
 * Extracted from app/page.tsx and components/network-graph.tsx
 */

import { BarChart2, DollarSign, MapPin, TrendingUp, Users, Wallet } from 'lucide-react'
import type { ClusterMode } from '@/components/network-graph'

export interface ClusterOption {
  mode: ClusterMode
  label: string
  icon: React.ReactNode
  desc: string
}

export const CLUSTER_OPTIONS: ClusterOption[] = [
  { mode: 'partido',    label: 'Partido',      icon: <Users size={13} />,       desc: 'Agrupa pelos 18 partidos' },
  { mode: 'uf',         label: 'Estado',       icon: <MapPin size={13} />,      desc: 'Distribuição geográfica' },
  { mode: 'tipo',       label: 'Casa',         icon: <BarChart2 size={13} />,   desc: 'Câmara vs Senado' },
  { mode: 'bancada',    label: 'Bancada',      icon: <Users size={13} />,       desc: 'Frentes parlamentares' },
  { mode: 'genero',     label: 'Gênero',       icon: <Users size={13} />,       desc: 'Homem Cis · Mulher Cis · Mulher Trans · Não-binárie' },
  { mode: 'faixaEtaria',label: 'Mandatos',     icon: <Users size={13} />,       desc: 'Tempo no poder' },
  { mode: 'raca',       label: 'Raça',         icon: <Users size={13} />,       desc: 'Autodeclaração racial' },
  { mode: 'cotas',      label: 'Cotas',        icon: <DollarSign size={13} />,  desc: 'Despesas da Cota Parlamentar' },
  { mode: 'patrimonio', label: 'Patrimônio',   icon: <Wallet size={13} />,      desc: 'Declaração patrimonial (TSE)' },
]

export const CLUSTER_LABELS: Record<ClusterMode, string> = {
  partido: 'Partido',
  uf: 'Estado',
  tipo: 'Casa',
  bancada: 'Bancada',
  genero: 'Gênero',
  faixaEtaria: 'Mandatos',
  raca: 'Raça',
  cotas: 'Cotas',
  patrimonio: 'Patrimônio',
}

export const CLUSTER_DESCRIPTIONS: Record<ClusterMode, string> = {
  partido: 'Agrupa pelos 18 partidos',
  uf: 'Distribuição geográfica',
  tipo: 'Câmara vs Senado',
  bancada: 'Frentes parlamentares',
  genero: 'Homem Cis · Mulher Cis · Mulher Trans · Não-binárie',
  faixaEtaria: 'Tempo no poder',
  raca: 'Autodeclaração racial',
  cotas: 'Despesas da Cota Parlamentar',
  patrimonio: 'Declaração patrimonial (TSE)',
}
