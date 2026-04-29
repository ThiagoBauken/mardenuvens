import {
  fetchForecast,
  fetchForecastBatch,
  OpenMeteoError,
} from '../providers/openMeteo.js';
import { scoreAllHours } from '../analysis/seaOfClouds.js';
import { buildDailyForecasts } from '../analysis/windowSelect.js';
import { TTLCache } from '../cache.js';
import {
  readForecastCache,
  writeForecastCache,
  pruneExpiredForecastCache,
} from '../db.js';
import type { ForecastResponse, Mountain, ParsedForecast } from '../types.js';

/** Tempo até a entrada virar stale (cliente continua recebendo, mas gatilha refresh em bg). */
const FORECAST_STALE_MS = 60 * 60 * 1000; // 1h
/** Tempo até remoção total (cliente tem que aguardar refetch). */
const FORECAST_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h
const BATCH_SIZE = 20;

/** Cache em memória (L1) — hit aqui não é stale, sempre fresco. */
export const forecastCache = new TTLCache<ForecastResponse>(FORECAST_STALE_MS);

/** Dedup de chamadas em voo pra mesma montanha. */
const inFlight = new Map<string, Promise<ForecastResponse>>();

/** Cache de revalidações em background pra evitar duplicatas. */
const revalidating = new Set<string>();

interface CacheLookup {
  value: ForecastResponse;
  isStale: boolean;
}

function readCached(mountainId: string): CacheLookup | null {
  const memHit = forecastCache.get(mountainId);
  if (memHit) return { value: memHit, isStale: false };

  const diskHit = readForecastCache<ForecastResponse>(mountainId);
  if (diskHit) {
    if (!diskHit.isStale) {
      // Promove pra L1 só se ainda fresco — entries stale ficam só no L2.
      forecastCache.set(mountainId, diskHit.value);
    }
    return { value: diskHit.value, isStale: diskHit.isStale };
  }
  return null;
}

function writeCached(mountainId: string, value: ForecastResponse): void {
  forecastCache.set(mountainId, value);
  writeForecastCache(mountainId, value, FORECAST_STALE_MS, FORECAST_MAX_AGE_MS);
}

function buildResponse(mountain: Mountain, parsed: ParsedForecast): ForecastResponse {
  const scores = scoreAllHours(parsed.hours, mountain);
  const days = buildDailyForecasts(scores, mountain);
  return {
    mountain: {
      id: mountain.id,
      name: mountain.name,
      city: mountain.city,
      state: mountain.state,
      elevationM: mountain.elevationM,
      type: mountain.type,
      tags: mountain.tags ?? [],
      lat: mountain.lat,
      lon: mountain.lon,
    },
    model: 'ecmwf_ifs025',
    generatedAt: new Date().toISOString(),
    days,
  };
}

/**
 * SWR: dispara refresh em background sem esperar. Marcado em `revalidating`
 * pra não duplicar chamadas se a mesma montanha for solicitada várias vezes
 * enquanto o refresh ainda não terminou.
 */
function triggerBackgroundRefresh(mountain: Mountain): void {
  if (revalidating.has(mountain.id)) return;
  revalidating.add(mountain.id);

  computeSingle(mountain)
    .catch(() => {
      // Mantém a entrada antiga no cache; tenta de novo no próximo hit stale.
    })
    .finally(() => {
      revalidating.delete(mountain.id);
    });
}

/**
 * Stale-while-revalidate:
 *   1. Memory hit (não stale) → retorna instantâneo
 *   2. SQLite hit (não stale) → retorna + popula L1
 *   3. SQLite hit (stale, dentro do max-age) → retorna entry antiga IMEDIATAMENTE
 *      e dispara refresh em background
 *   4. Miss / expirado → bloqueia esperando Open-Meteo
 *
 * Chamadas concorrentes pra mesma montanha compartilham a mesma promise.
 */
export async function getForecastFor(mountain: Mountain): Promise<ForecastResponse> {
  const cached = readCached(mountain.id);
  if (cached) {
    if (cached.isStale) {
      triggerBackgroundRefresh(mountain);
    }
    return cached.value;
  }

  const inflight = inFlight.get(mountain.id);
  if (inflight) return inflight;

  const promise = computeSingle(mountain).finally(() => {
    inFlight.delete(mountain.id);
  });
  inFlight.set(mountain.id, promise);
  return promise;
}

async function computeSingle(mountain: Mountain): Promise<ForecastResponse> {
  let parsed: ParsedForecast;
  try {
    parsed = await fetchForecast(mountain.lat, mountain.lon, { model: 'ecmwf_ifs025' });
  } catch (primaryErr) {
    if (primaryErr instanceof OpenMeteoError) {
      parsed = await fetchForecast(mountain.lat, mountain.lon, { model: 'best_match' });
    } else {
      throw primaryErr;
    }
  }
  const response = buildResponse(mountain, parsed);
  writeCached(mountain.id, response);
  return response;
}

/**
 * Versão batched: lê cache pra todas e busca apenas as missing (incluindo
 * stale) em batches de até 20 por request multi-location.
 *
 * Diferente do getForecastFor single, aqui revalidamos as stale agora —
 * se chegou aqui é porque alguém quer dados frescos pro highlights.
 */
export async function getForecastsBatch(
  mountains: Mountain[],
): Promise<Map<string, ForecastResponse>> {
  const out = new Map<string, ForecastResponse>();
  const missing: Mountain[] = [];

  for (const m of mountains) {
    const cached = readCached(m.id);
    if (cached && !cached.isStale) {
      out.set(m.id, cached.value);
    } else {
      // Stale ou ausente — vai ser refetched neste round.
      if (cached) out.set(m.id, cached.value); // serve o stale temporariamente
      missing.push(m);
    }
  }

  if (missing.length === 0) return out;

  const batches: Mountain[][] = [];
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    batches.push(missing.slice(i, i + BATCH_SIZE));
  }

  await Promise.all(
    batches.map(async (batch) => {
      try {
        const responses = await fetchForecastBatch(
          batch.map((m) => ({ lat: m.lat, lon: m.lon })),
          { model: 'ecmwf_ifs025' },
        );
        for (let i = 0; i < batch.length; i++) {
          const m = batch[i]!;
          const parsed = responses[i];
          if (!parsed) continue;
          const response = buildResponse(m, parsed);
          writeCached(m.id, response);
          out.set(m.id, response);
        }
      } catch {
        // Fallback per-mountain — mantém o que já estava no cache (até stale)
        for (const m of batch) {
          if (out.has(m.id)) continue;
          try {
            const r = await getForecastFor(m);
            out.set(m.id, r);
          } catch {
            // ignore
          }
        }
      }
    }),
  );

  return out;
}

export function startForecastCachePruner(intervalMs = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    try {
      pruneExpiredForecastCache();
    } catch {
      // best-effort
    }
  }, intervalMs);
}
