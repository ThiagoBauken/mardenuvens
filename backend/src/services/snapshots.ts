import { MOUNTAINS } from '../data/mountains.js';
import { upsertForecastSnapshot } from '../db.js';
import { getForecastsBatch } from './forecast.js';

/**
 * Pra cada destino, persiste a previsão atual pra hoje e os 2 próximos dias.
 *
 * Roda 1x ao dia (ou no boot). A constraint UNIQUE (mountain_id, for_date,
 * capture_day) garante 1 snapshot por dia por par; chamadas adicionais no
 * mesmo dia só atualizam o registro existente — útil pra capturar a
 * previsão "final" do dia conforme se aproxima do alvo.
 */
export async function captureSnapshots(): Promise<{
  destinations: number;
  rows: number;
}> {
  const forecasts = await getForecastsBatch(MOUNTAINS);
  const today = new Date();
  const captureDay = isoDay(today);
  const capturedAt = today.toISOString();

  let rows = 0;
  for (const mountain of MOUNTAINS) {
    const f = forecasts.get(mountain.id);
    if (!f) continue;

    // Captura snapshots pra hoje + próximos 2 dias (são os mais úteis pra
    // avaliar acurácia perto do alvo).
    for (const day of f.days.slice(0, 3)) {
      try {
        upsertForecastSnapshot({
          mountainId: mountain.id,
          forDate: day.date,
          captureDay,
          capturedAt,
          verdict: day.verdict,
          score: day.score,
        });
        rows++;
      } catch {
        // best-effort; continua os demais
      }
    }
  }

  return { destinations: forecasts.size, rows };
}

/**
 * Agenda captura diária. Roda imediatamente (best-effort) e depois a cada 24h.
 */
export function startSnapshotCron(intervalMs = 24 * 60 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    void captureSnapshots().catch(() => {
      // melhoria futura: logar via logger fastify se passarmos referência
    });
  }, intervalMs);
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
