import { useEffect, useRef, useState } from 'react';
import type { HighlightItem } from '../types';
import { fetchHighlights } from '../api';
import { VerdictBadge } from './Verdict';

interface Props {
  onSelect: (id: string) => void;
}

export function Highlights({ onSelect }: Props): JSX.Element | null {
  const [items, setItems] = useState<HighlightItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHighlights()
      .then((d) => {
        if (cancelled) return;
        setItems(d.destinations);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null; // falha silenciosa: a lista principal segue funcionando
  if (!loading && (!items || items.length === 0)) return null;

  const scroll = (dir: -1 | 1): void => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = 280;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-bold tracking-widest text-emerald-300/80 uppercase">
          ☁️ Pode rolar mar de nuvens
        </h2>
        <div className="hidden sm:flex gap-1">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="w-8 h-8 rounded-md bg-sky-mid/60 hover:bg-sky-mid border border-sky-soft/60 text-cloud-dim hover:text-cloud"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximo"
            className="w-8 h-8 rounded-md bg-sky-mid/60 hover:bg-sky-mid border border-sky-soft/60 text-cloud-dim hover:text-cloud"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div>
          <p className="text-xs text-cloud-dim/70 mb-2 italic">
            Calculando previsão para 150+ destinos…
          </p>
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] h-32 rounded-lg bg-sky-mid/40 border border-sky-soft/30 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-1 px-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items!.map((item) => (
            <HighlightCard key={item.mountain.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function HighlightCard({
  item,
  onSelect,
}: {
  item: HighlightItem;
  onSelect: (id: string) => void;
}): JSX.Element {
  const m = item.mountain;
  const day = item.bestDay;
  const isToday = isSameDayAsToday(day.date);
  const dayLabel = formatDayLabel(day.date);

  return (
    <button
      type="button"
      onClick={() => onSelect(m.id)}
      className="flex-shrink-0 w-[260px] snap-start text-left rounded-lg border border-sky-soft/50 bg-gradient-to-br from-sky-mid/80 to-sky-mid/40 hover:from-sky-soft/40 hover:border-emerald-400/40 transition-colors p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[10px] uppercase tracking-widest font-bold ${
            isToday ? 'text-amber-300' : 'text-emerald-300/80'
          }`}
        >
          {dayLabel}
        </span>
        <VerdictBadge verdict={day.verdict} />
      </div>
      <div className="font-semibold text-cloud truncate">{m.name}</div>
      <div className="text-xs text-cloud-dim mt-0.5 truncate">
        {m.city} · {m.state} · {m.elevationM}m
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-cloud">
          {Math.round(day.score * 100)}%
        </span>
        {day.bestWindow && (
          <span className="text-xs text-cloud-dim">
            {day.bestWindow.startLocal}–{day.bestWindow.endLocal}
          </span>
        )}
      </div>
    </button>
  );
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function isSameDayAsToday(iso: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return iso === todayStr;
}

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round(
    (date.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return 'HOJE';
  if (diffDays === 1) return 'AMANHÃ';
  if (diffDays >= 2 && diffDays <= 6) {
    return `${WEEKDAYS[date.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  }
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}
