import { useEffect, useMemo, useState } from 'react';
import type { MountainPublic } from '../types';
import { fetchMountains } from '../api';
import { useFavorites } from '../lib/favorites';
import { FavoriteStar } from './FavoriteStar';

interface Props {
  onSelect: (id: string) => void;
  onCompare: (ids: string[]) => void;
}

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
  TO: 'Tocantins',
};

export function MountainPicker({ onSelect, onCompare }: Props): JSX.Element {
  const [mountains, setMountains] = useState<MountainPublic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { favorites } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    fetchMountains()
      .then((d) => {
        if (!cancelled) setMountains(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!mountains) return [];
    const q = query.trim().toLowerCase();
    return mountains.filter((m) => {
      if (stateFilter && m.state !== stateFilter) return false;
      if (typeFilter && m.type !== typeFilter) return false;
      if (!q) return true;
      const hay = `${m.name} ${m.city} ${m.state} ${m.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [mountains, query, stateFilter, typeFilter]);

  const favoriteList = useMemo(() => {
    return filtered.filter((m) => favorites.has(m.id));
  }, [filtered, favorites]);

  const grouped = useMemo(() => {
    const map = new Map<string, MountainPublic[]>();
    for (const m of filtered) {
      if (favorites.has(m.id)) continue;
      let arr = map.get(m.state);
      if (!arr) {
        arr = [];
        map.set(m.state, arr);
      }
      arr.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, favorites]);

  const states = useMemo(() => {
    if (!mountains) return [];
    return Array.from(new Set(mountains.map((m) => m.state))).sort();
  }, [mountains]);

  const types = useMemo(() => {
    if (!mountains) return [];
    return Array.from(new Set(mountains.map((m) => m.type))).sort();
  }, [mountains]);

  const handleClick = (id: string): void => {
    if (compareMode) {
      setSelected((curr) => {
        if (curr.includes(id)) return curr.filter((x) => x !== id);
        if (curr.length >= 3) return curr;
        return [...curr, id];
      });
    } else {
      onSelect(id);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-6 text-red-200">
        <p className="font-semibold">Falha ao carregar a lista</p>
        <p className="text-sm mt-1 opacity-80">{error}</p>
      </div>
    );
  }

  if (!mountains) {
    return <div className="text-cloud-dim animate-pulse">Carregando destinos…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Buscar destino, cidade ou tag..."
          className="w-full rounded-lg bg-sky-mid border border-sky-soft px-4 py-2 text-cloud placeholder:text-cloud-dim/60 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg bg-sky-mid border border-sky-soft px-3 py-2 text-cloud focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos os estados</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s} — {STATE_NAMES[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg bg-sky-mid border border-sky-soft px-3 py-2 text-cloud focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-cloud-dim">
          {filtered.length} destino{filtered.length === 1 ? '' : 's'} de {mountains.length}
        </div>
        <div className="flex items-center gap-2">
          {compareMode && (
            <span className="text-xs text-cloud-dim">
              {selected.length}/3 selecionado{selected.length === 1 ? '' : 's'}
            </span>
          )}
          {compareMode && selected.length >= 2 && (
            <button
              type="button"
              onClick={() => onCompare(selected)}
              className="rounded-md bg-sky-400/30 hover:bg-sky-400/50 border border-sky-400/60 px-3 py-1.5 text-sm font-medium"
            >
              Comparar agora
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setCompareMode((v) => !v);
              setSelected([]);
            }}
            className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
              compareMode
                ? 'bg-sky-soft/50 border-sky-400/60 text-cloud'
                : 'bg-sky-mid/40 border-sky-soft/60 text-cloud-dim hover:text-cloud'
            }`}
          >
            {compareMode ? 'Cancelar' : 'Comparar destinos'}
          </button>
        </div>
      </div>

      {favoriteList.length > 0 && (
        <section>
          <h2 className="text-xs font-bold tracking-widest text-amber-300/80 mb-2 border-b border-amber-400/30 pb-1">
            ★ FAVORITOS
          </h2>
          <ul role="list" className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteList.map((m) => (
              <MountainItem
                key={m.id}
                mountain={m}
                isSelected={selected.includes(m.id)}
                compareMode={compareMode}
                onClick={() => handleClick(m.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {grouped.length === 0 && favoriteList.length === 0 && (
        <div className="text-cloud-dim italic">Nenhum destino bate os filtros.</div>
      )}

      <div className="space-y-6">
        {grouped.map(([state, list]) => (
          <section key={state}>
            <h2 className="text-xs font-bold tracking-widest text-cloud-dim/70 mb-2 border-b border-sky-soft/40 pb-1">
              {state} — {STATE_NAMES[state] ?? state}
            </h2>
            <ul role="list" className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <MountainItem
                  key={m.id}
                  mountain={m}
                  isSelected={selected.includes(m.id)}
                  compareMode={compareMode}
                  onClick={() => handleClick(m.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

interface ItemProps {
  mountain: MountainPublic;
  isSelected: boolean;
  compareMode: boolean;
  onClick: () => void;
}

function MountainItem({ mountain: m, isSelected, compareMode, onClick }: ItemProps): JSX.Element {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-md border px-3 py-2 pr-9 transition-colors ${
          isSelected
            ? 'bg-sky-400/20 border-sky-400/60'
            : 'bg-sky-mid/60 hover:bg-sky-mid border-sky-soft/60 hover:border-sky-400/60'
        }`}
      >
        <div className="font-medium text-cloud flex items-center gap-2">
          {compareMode && (
            <span
              className={`w-4 h-4 rounded border flex-shrink-0 inline-flex items-center justify-center text-xs ${
                isSelected ? 'bg-sky-400 border-sky-400 text-sky-deep' : 'border-cloud-dim/50'
              }`}
              aria-hidden
            >
              {isSelected && '✓'}
            </span>
          )}
          {m.name}
        </div>
        <div className="text-xs text-cloud-dim mt-0.5">
          {m.city} · {m.elevationM}m · {m.type}
        </div>
      </button>
      <div className="absolute top-1.5 right-1.5">
        <FavoriteStar id={m.id} />
      </div>
    </li>
  );
}
