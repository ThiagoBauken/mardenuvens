import type { Verdict as V } from '../types';

const STYLES: Record<V, { bg: string; text: string; label: string; emoji: string }> = {
  SIM: {
    bg: 'bg-emerald-500/20 border-emerald-400/40',
    text: 'text-emerald-300',
    label: 'SIM',
    emoji: '☁️',
  },
  PROVAVEL: {
    bg: 'bg-sky-500/20 border-sky-400/40',
    text: 'text-sky-300',
    label: 'PROVÁVEL',
    emoji: '🌤️',
  },
  TALVEZ: {
    bg: 'bg-amber-500/20 border-amber-400/40',
    text: 'text-amber-300',
    label: 'TALVEZ',
    emoji: '⛅',
  },
  NAO: {
    bg: 'bg-slate-700/40 border-slate-500/40',
    text: 'text-slate-300',
    label: 'NÃO',
    emoji: '🌥️',
  },
};

interface Props {
  verdict: V;
  size?: 'sm' | 'lg';
}

export function VerdictBadge({ verdict, size = 'sm' }: Props): JSX.Element {
  const s = STYLES[verdict];
  const sizes = size === 'lg'
    ? 'px-5 py-2 text-2xl font-bold'
    : 'px-3 py-1 text-sm font-semibold';
  return (
    <span className={`inline-flex items-center gap-2 border rounded-full ${s.bg} ${s.text} ${sizes}`}>
      <span aria-hidden>{s.emoji}</span>
      {s.label}
    </span>
  );
}
