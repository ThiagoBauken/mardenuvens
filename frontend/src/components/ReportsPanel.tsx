import { useEffect, useState, FormEvent } from 'react';
import type { Report, ReportSummary } from '../types';
import { fetchReportsForDate, postReport } from '../api';

interface Props {
  mountainId: string;
  date: string;
}

export function ReportsPanel({ mountainId, date }: Props): JSX.Element {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({ yes: 0, no: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReportsForDate(mountainId, date)
      .then((d) => {
        if (cancelled) return;
        setReports(d.reports);
        setSummary(d.summary);
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
  }, [mountainId, date, reload]);

  const isFutureDay = isInFuture(date);
  const total = summary.yes + summary.no;

  return (
    <section className="border-t border-sky-soft/30 pt-4 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="text-xs uppercase tracking-widest text-cloud-dim">
          Relatos da galera
        </h3>
        {total > 0 && (
          <div className="text-xs text-cloud-dim">
            <span className="text-emerald-300">{summary.yes} ✓ teve</span>
            {' · '}
            <span className="text-slate-400">{summary.no} ✗ não teve</span>
          </div>
        )}
      </div>

      {!isFutureDay && (
        <ReportForm
          mountainId={mountainId}
          date={date}
          onPosted={() => setReload((n) => n + 1)}
        />
      )}

      {loading && <div className="text-cloud-dim text-sm animate-pulse">carregando…</div>}

      {error && <div className="text-red-300 text-sm">Falha ao carregar: {error}</div>}

      {!loading && reports.length === 0 && !isFutureDay && (
        <p className="text-sm text-cloud-dim/70 italic">
          Ninguém relatou ainda. Você que esteve lá pode ser o primeiro.
        </p>
      )}

      {isFutureDay && (
        <p className="text-sm text-cloud-dim/70 italic">
          Os relatos abrem depois que o dia chegar.
        </p>
      )}

      {!loading && reports.length > 0 && (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="bg-sky-deep/50 border border-sky-soft/30 rounded-md p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold ${
                    r.happened ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  {r.happened ? '✓ TEVE' : '✗ NÃO TEVE'}
                </span>
                <span className="text-xs text-cloud-dim/70">
                  {r.authorName ?? 'anônimo'} · {formatRelative(r.createdAt)}
                </span>
              </div>
              {r.comment && (
                <p className="mt-1.5 text-cloud whitespace-pre-wrap break-words">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface FormProps {
  mountainId: string;
  date: string;
  onPosted: () => void;
}

function ReportForm({ mountainId, date, onPosted }: FormProps): JSX.Element {
  const [happened, setHappened] = useState<boolean | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (happened === null) {
      setErr('Diz aí se teve ou não.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await postReport({
        mountainId,
        reportDate: date,
        happened,
        comment: comment.trim() || undefined,
        authorName: authorName.trim() || undefined,
      });
      setDone(true);
      setComment('');
      setAuthorName('');
      setHappened(null);
      onPosted();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-md bg-emerald-500/10 border border-emerald-400/30 p-3 text-sm text-emerald-200">
        Valeu pelo relato! Ele já aparece na lista.{' '}
        <button
          type="button"
          onClick={() => setDone(false)}
          className="underline hover:text-cloud"
        >
          Enviar outro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md bg-sky-deep/40 border border-sky-soft/30 p-3">
      <div className="text-xs text-cloud-dim mb-1">
        Esteve lá em <strong>{formatDateLong(date)}</strong>? Conta pra galera.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setHappened(true)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
            happened === true
              ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-200'
              : 'bg-sky-mid/40 border-sky-soft/40 text-cloud-dim hover:text-cloud'
          }`}
        >
          ✓ Teve mar de nuvens
        </button>
        <button
          type="button"
          onClick={() => setHappened(false)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-colors ${
            happened === false
              ? 'bg-slate-500/30 border-slate-400/60 text-slate-100'
              : 'bg-sky-mid/40 border-sky-soft/40 text-cloud-dim hover:text-cloud'
          }`}
        >
          ✗ Não teve
        </button>
      </div>
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Seu nome (opcional)"
        maxLength={50}
        className="w-full rounded-md bg-sky-mid/60 border border-sky-soft/40 px-3 py-2 text-sm text-cloud placeholder:text-cloud-dim/60 focus:outline-none focus:ring-1 focus:ring-sky-400"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Como foi? (opcional, até 500 caracteres)"
        maxLength={500}
        rows={3}
        className="w-full rounded-md bg-sky-mid/60 border border-sky-soft/40 px-3 py-2 text-sm text-cloud placeholder:text-cloud-dim/60 focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none"
      />
      {err && <div className="text-red-300 text-xs">{err}</div>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || happened === null}
          className="rounded-md bg-sky-400/30 hover:bg-sky-400/50 disabled:bg-sky-mid/40 disabled:text-cloud-dim/60 disabled:cursor-not-allowed border border-sky-400/60 px-4 py-1.5 text-sm font-medium"
        >
          {submitting ? 'enviando…' : 'Enviar relato'}
        </button>
      </div>
    </form>
  );
}

function isInFuture(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return false;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return target.getTime() > today.getTime();
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} de ${MONTHS[m - 1]}`;
}
