import { useEffect, useState } from 'react';
import type { ForecastResponse, DayForecast } from '../types';
import { fetchForecast } from '../api';
import { VerdictBadge } from './Verdict';
import { ReportsPanel } from './ReportsPanel';
import { FavoriteStar } from './FavoriteStar';
import { useDocumentTitle, useDocumentMeta } from '../lib/useDocumentTitle';

interface Props {
  mountainId: string;
  onBack: () => void;
}

export function ForecastView({ mountainId, onBack }: Props): JSX.Element {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useDocumentTitle(
    data ? `${data.mountain.name} (${data.mountain.state}) — Mar de Nuvens` : null,
  );
  useDocumentMeta(
    'description',
    data
      ? `Previsão de mar de nuvens em ${data.mountain.name}, ${data.mountain.city}/${data.mountain.state} (${data.mountain.elevationM}m). Veja se vale subir nos próximos 7 dias.`
      : null,
  );

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setSelectedIdx(0);
    fetchForecast(mountainId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [mountainId, retryNonce]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-cloud-dim hover:text-cloud text-sm flex items-center gap-1"
      >
        ← Voltar à lista
      </button>

      {error && (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-6 text-red-200">
          <p className="font-semibold">Falha ao buscar previsão</p>
          <p className="text-sm mt-1 opacity-80">{error}</p>
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            className="mt-3 rounded-md bg-red-400/20 hover:bg-red-400/30 px-3 py-1.5 text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!data && !error && (
        <div className="text-cloud-dim animate-pulse">Consultando modelo meteorológico…</div>
      )}

      {data && (
        <>
          <header>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-cloud">
                {data.mountain.name}
              </h1>
              <FavoriteStar id={data.mountain.id} size="md" />
            </div>
            <p className="text-cloud-dim mt-1">
              {data.mountain.city} · {data.mountain.state} · {data.mountain.elevationM}m · modelo{' '}
              <code className="text-xs">{data.model}</code>
            </p>
          </header>

          {data.days[selectedIdx] && (
            <DayDetailCard
              day={data.days[selectedIdx]!}
              mountainId={data.mountain.id}
            />
          )}

          <section>
            <h2 className="text-xs font-bold tracking-widest text-cloud-dim/70 mb-2">
              PRÓXIMOS 7 DIAS
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {data.days.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={`rounded-md px-2 py-3 text-left transition-colors border ${
                    i === selectedIdx
                      ? 'bg-sky-soft/40 border-sky-400/60'
                      : 'bg-sky-mid/40 border-sky-soft/30 hover:bg-sky-mid/70'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-cloud-dim">
                    {formatDateShort(d.date)}
                  </div>
                  <div className="mt-1.5 mb-1">
                    <VerdictBadge verdict={d.verdict} />
                  </div>
                  <div className="text-xs text-cloud-dim">
                    {Math.round(d.score * 100)}%
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function DayDetailCard({ day, mountainId }: { day: DayForecast; mountainId: string }): JSX.Element {
  return (
    <article className="rounded-xl border border-sky-soft/40 bg-sky-mid/40 p-6 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-cloud-dim/70">
            {formatDateLong(day.date)}
          </div>
          <div className="mt-2">
            <VerdictBadge verdict={day.verdict} size="lg" />
          </div>
        </div>
        {day.bestWindow && (
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-cloud-dim/70">
              Melhor janela
            </div>
            <div className="text-lg font-semibold text-cloud mt-1">
              {day.bestWindow.startLocal} – {day.bestWindow.endLocal}
            </div>
            <div className="text-sm text-cloud-dim">
              pico {Math.round(day.bestWindow.peakScore * 100)}%
            </div>
          </div>
        )}
      </header>

      {day.reasoning.length > 0 && (
        <ul className="space-y-2 border-t border-sky-soft/30 pt-4">
          {day.reasoning.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-cloud">
              <span className="text-sky-300 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      <details className="border-t border-sky-soft/30 pt-4 group">
        <summary className="cursor-pointer text-xs uppercase tracking-widest text-cloud-dim hover:text-cloud select-none">
          Variáveis brutas
        </summary>
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <Metric label="Temp. superfície" value={`${day.raw.tSurface}°C`} />
          <Metric label="Ponto de orvalho" value={`${day.raw.tdSurface}°C`} />
          <Metric label="Umidade superfície" value={`${day.raw.rhSurface}%`} />
          <Metric label="Vento superfície" value={`${day.raw.windSurface} m/s`} />
          <Metric label="Pressão" value={`${day.raw.surfacePressure} hPa`} />
          <Metric label="Cobertura total" value={`${day.raw.cloudCover}%`} />
          <Metric label="Nuvens baixas" value={`${day.raw.cloudCoverLow}%`} />
          <Metric label="Nuvens médias" value={`${day.raw.cloudCoverMid}%`} />
          <Metric label="Nuvens altas" value={`${day.raw.cloudCoverHigh}%`} />
          <Metric label="Base estimada" value={`~${day.raw.cloudBaseEstM} m`} />
          <Metric label="LCL" value={`~${day.raw.lclM} m`} />
        </dl>

        {(day.raw.belowLevel || day.raw.aboveLevel) && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-widest text-cloud-dim/70 mb-2">
              Perfil vertical
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cloud-dim/70 text-xs">
                  <th className="text-left font-normal py-1">Nível</th>
                  <th className="text-right font-normal py-1">Altitude</th>
                  <th className="text-right font-normal py-1">T</th>
                  <th className="text-right font-normal py-1">RH</th>
                  <th className="text-right font-normal py-1">Vento</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Acima do cume', lvl: day.raw.aboveLevel },
                  { label: 'No cume', lvl: day.raw.atLevel },
                  { label: 'Abaixo do cume', lvl: day.raw.belowLevel },
                ].map(
                  ({ label, lvl }) =>
                    lvl && (
                      <tr key={label} className="border-t border-sky-soft/20">
                        <td className="py-1.5 text-cloud-dim">
                          {label} <span className="text-xs opacity-60">({lvl.hPa} hPa)</span>
                        </td>
                        <td className="text-right">{lvl.altitudeM} m</td>
                        <td className="text-right">{lvl.temperature}°C</td>
                        <td className="text-right">{lvl.relativeHumidity}%</td>
                        <td className="text-right">
                          {lvl.windSpeed != null ? `${lvl.windSpeed} m/s` : '—'}
                        </td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </details>

      <ReportsPanel mountainId={mountainId} date={day.date} />
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-cloud-dim/70">{label}</dt>
      <dd className="font-medium text-cloud">{value}</dd>
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

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${WEEKDAY[date.getDay()]}, ${d} de ${months[m - 1]}`;
}
