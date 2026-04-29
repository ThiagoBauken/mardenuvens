import { useEffect, useState } from 'react';
import type { ForecastResponse } from '../types';
import { fetchForecast } from '../api';
import { VerdictBadge } from './Verdict';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Props {
  ids: string[];
  onBack: () => void;
  onOpen: (id: string) => void;
}

interface State {
  loading: boolean;
  data: ForecastResponse | null;
  error: string | null;
}

export function ComparisonView({ ids, onBack, onOpen }: Props): JSX.Element {
  const [byId, setById] = useState<Record<string, State>>({});

  useDocumentTitle(`Comparar ${ids.length} destinos — Mar de Nuvens`);

  useEffect(() => {
    let cancelled = false;
    setById(Object.fromEntries(ids.map((id) => [id, { loading: true, data: null, error: null }])));

    Promise.all(
      ids.map(async (id) => {
        try {
          const data = await fetchForecast(id);
          return [id, { loading: false, data, error: null }] as const;
        } catch (e) {
          return [id, { loading: false, data: null, error: (e as Error).message }] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setById(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [ids.join(',')]);

  // Coleta as datas exibidas. Usa as datas do primeiro destino com sucesso.
  const dates = (() => {
    for (const id of ids) {
      const s = byId[id];
      if (s?.data) return s.data.days.map((d) => d.date);
    }
    return [];
  })();

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-cloud-dim hover:text-cloud text-sm flex items-center gap-1"
      >
        ← Voltar à lista
      </button>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-cloud">
          Comparação de {ids.length} destinos
        </h1>
        <p className="text-cloud-dim mt-1 text-sm">
          Próximos 7 dias · clique no nome para abrir o destino completo.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-cloud-dim/70">
              <th className="py-2 pr-4 font-normal">Destino</th>
              {dates.map((d) => (
                <th key={d} className="py-2 px-2 font-normal text-center">
                  {formatDateShort(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const s = byId[id];
              return (
                <tr key={id} className="border-t border-sky-soft/30 align-top">
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => onOpen(id)}
                      className="text-left hover:text-sky-300 transition-colors"
                    >
                      <div className="font-medium text-cloud">
                        {s?.data?.mountain.name ?? id}
                      </div>
                      {s?.data && (
                        <div className="text-xs text-cloud-dim mt-0.5">
                          {s.data.mountain.city} · {s.data.mountain.elevationM}m
                        </div>
                      )}
                    </button>
                  </td>
                  {s?.loading && (
                    <td colSpan={dates.length || 1} className="py-3 px-2 text-cloud-dim text-xs animate-pulse">
                      consultando…
                    </td>
                  )}
                  {s?.error && (
                    <td colSpan={dates.length || 1} className="py-3 px-2 text-red-300 text-xs">
                      {s.error}
                    </td>
                  )}
                  {s?.data &&
                    s.data.days.map((d) => (
                      <td key={d.date} className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <VerdictBadge verdict={d.verdict} />
                          <span className="text-xs text-cloud-dim">
                            {Math.round(d.score * 100)}%
                          </span>
                          {d.bestWindow && (
                            <span className="text-[10px] text-cloud-dim/70 whitespace-nowrap">
                              {d.bestWindow.startLocal}–{d.bestWindow.endLocal}
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${WEEKDAY[date.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}
