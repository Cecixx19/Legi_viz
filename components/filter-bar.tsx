'use client'

import { Search, X, Filter, Grid3X3, MapPin, Users, TrendingUp } from 'lucide-react'
import { PARTIDOS, UFS } from '@/lib/parliamentarians'
import { type ClusterMode } from './network-graph'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filterPartido: string
  onFilterPartidoChange: (value: string) => void
  filterUF: string
  onFilterUFChange: (value: string) => void
  filterTipo: string
  onFilterTipoChange: (value: string) => void
  clusterMode: ClusterMode
  onClusterModeChange: (mode: ClusterMode) => void
}

export function FilterBar({
  search,
  onSearchChange,
  filterPartido,
  onFilterPartidoChange,
  filterUF,
  onFilterUFChange,
  filterTipo,
  onFilterTipoChange,
  clusterMode,
  onClusterModeChange,
}: FilterBarProps) {
  const hasFilters = search || filterPartido || filterUF || filterTipo

  const clusterModes: { mode: ClusterMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'partido', icon: <Users size={14} />, label: 'Partido' },
    { mode: 'uf', icon: <MapPin size={14} />, label: 'Estado' },
  ]

  const clearFilters = () => {
    onSearchChange('')
    onFilterPartidoChange('')
    onFilterUFChange('')
    onFilterTipoChange('')
  }

  return (
    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
      <div className="p-4">
        {/* Linha principal de busca e filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Campo de busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por nome, partido ou UF..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted text-white text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              aria-label="Buscar parlamentar"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Seletor de Partido */}
          <div className="relative">
            <select
              value={filterPartido}
              onChange={(e) => onFilterPartidoChange(e.target.value)}
              className="appearance-none bg-muted text-white text-sm px-4 py-2 pr-8 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Filtrar por partido"
            >
              <option value="">Todos os Partidos</option>
              {PARTIDOS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Filter size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Seletor de UF */}
          <div className="relative">
            <select
              value={filterUF}
              onChange={(e) => onFilterUFChange(e.target.value)}
              className="appearance-none bg-muted text-white text-sm px-4 py-2 pr-8 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Filtrar por estado"
            >
              <option value="">Todos os Estados</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <MapPin size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Seletor de Tipo */}
          <div className="relative">
            <select
              value={filterTipo}
              onChange={(e) => onFilterTipoChange(e.target.value)}
              className="appearance-none bg-muted text-white text-sm px-4 py-2 pr-8 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos os Cargos</option>
              <option value="DEPUTADO_FEDERAL">Deputados Federais</option>
              <option value="SENADOR">Senadores</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Users size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Botão de limpar filtros */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-muted rounded-lg transition-colors"
              aria-label="Limpar todos os filtros"
            >
              <X size={14} />
              Limpar
            </button>
          )}
        </div>

        {/* Modos de agrupamento */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground mr-2">Agrupar por:</span>
          {clusterModes.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => onClusterModeChange(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                clusterMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-white hover:bg-muted/80'
              }`}
              aria-pressed={clusterMode === mode}
              aria-label={`Agrupar por ${label}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
