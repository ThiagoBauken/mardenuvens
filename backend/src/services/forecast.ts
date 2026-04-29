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

const FORECAST_TTL_MS = 60 * 60 * 1000; // 1h
/** Limite seguro de pontos por request multi-location ao Open-Meteo. */
const BATCH_SIZE = 20;

/** Cache em memória (L1) — mais rápido que SQLite (L2). */
export const forecastCache = new TTLCache<ForecastResponse>(FORECAST_TTL_MS);

/** Dedup de chamadas em voo pra mesma montanha. */
const inFlight = new Map<string, Promise<ForecastResponse>>();

/**
 * Lê do L1 (memória) e, em miss, do L2 (SQLite). Quando L2 hit, popula L1.
 */
function readCached(mountainId: string): ForecastResponse | null {
  const memHit = forecastCache.get(mountainId);
  if (memHit) return memHit;

  const diskHit = readForecastCache<ForecastResponse>(mountainId);
  if (diskHit) {
    forecastCache.set(mountainId, diskHit);
    return diskHit;
  }
  return null;
}

function writeCached(mountainId: string, value: ForecastResponse): void {
  forecastCache.set(mountainId, value);
  writeForecastCache(mountainId, value, FORECAST_TTL_MS);
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
 * Busca a previsão para uma montanha, na ordem:
 *   1. Cache em memória (L1)
 *   2. Cache persistente em SQLite (L2)
 *   3. Open-Meteo (ECMWF, com fallback p/ best_match)
 *
 * Chamadas concorrentes pra mesma montanha compartilham a mesma promise.
 */
export async function getForecastFor(mountain: Mountain): Promise<ForecastResponse> {
  const cached = readCached(mountain.id);
  if (cached) return cached;

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
 * Versão batched: lê cache para todas as montanhas e busca apenas as faltantes
 * no Open-Meteo, agrupando ~20 pontos por requisição HTTP.
 *
 * Pra warmup de 154 destinos:
 *   - Antes: 154 round-trips (concurrency 16 → ~3-5s)
 *   - Depois: ~8 round-trips (paralelos → <1s na maioria dos casos)
 */
export async function getForecastsBatch(
  mountains: Mountain[],
): Promise<Map<string, ForecastResponse>> {
  const out = new Map<string, ForecastResponse>();
  const missing: Mountain[] = [];

  for (const m of mountains) {
    const cached = readCached(m.id);
    if (cached) {
      out.set(m.id, cached);
    } else {
      missing.push(m);
    }
  }

  if (missing.length === 0) return out;

  const batches: Mountain[][] = [];
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    batches.push(missing.slice(i, i + BATCH_SIZE));
  }

  // Roda os batches em paralelo — cada batch já é uma única request.
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
      } catch (err) {
        // Se o batch falhar, cai pro modo single por montanha (retorna o que conseguir)
        for (const m of batch) {
          try {
            const r = await getForecastFor(m);
            out.set(m.id, r);
          } catch {
            // Continua — outras montanhas podem ter dado certo
          }
        }
      }
    }),
  );

  return out;
}

/**
 * Limpeza periódica de entradas expiradas no cache em SQLite. Sem isso, o
 * arquivo cresce indefinidamente com payloads obsoletos.
 */
export function startForecastCachePruner(intervalMs = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    try {
      pruneExpiredForecastCache();
    } catch {
      // best-effort
    }
  }, intervalMs);
}
