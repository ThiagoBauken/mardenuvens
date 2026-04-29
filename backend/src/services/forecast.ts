import { fetchForecast, OpenMeteoError } from '../providers/openMeteo.js';
import { scoreAllHours } from '../analysis/seaOfClouds.js';
import { buildDailyForecasts } from '../analysis/windowSelect.js';
import { TTLCache } from '../cache.js';
import type { ForecastResponse, Mountain } from '../types.js';

const FORECAST_TTL_MS = 60 * 60 * 1000;
export const forecastCache = new TTLCache<ForecastResponse>(FORECAST_TTL_MS);

const inFlight = new Map<string, Promise<ForecastResponse>>();

/**
 * Retorna a previsão para uma montanha, com cache e dedup de chamadas em voo.
 * Tenta ECMWF primeiro; se falhar, cai pra best_match.
 */
export async function getForecastFor(mountain: Mountain): Promise<ForecastResponse> {
  const cached = forecastCache.get(mountain.id);
  if (cached) return cached;

  const inflight = inFlight.get(mountain.id);
  if (inflight) return inflight;

  const promise = computeForecast(mountain).finally(() => {
    inFlight.delete(mountain.id);
  });
  inFlight.set(mountain.id, promise);
  return promise;
}

async function computeForecast(mountain: Mountain): Promise<ForecastResponse> {
  const model = 'ecmwf_ifs025' as const;

  let parsed;
  try {
    parsed = await fetchForecast(mountain.lat, mountain.lon, { model });
  } catch (primaryErr) {
    if (primaryErr instanceof OpenMeteoError) {
      // Fallback automático
      parsed = await fetchForecast(mountain.lat, mountain.lon, { model: 'best_match' });
    } else {
      throw primaryErr;
    }
  }

  const scores = scoreAllHours(parsed.hours, mountain);
  const days = buildDailyForecasts(scores, mountain);

  const response: ForecastResponse = {
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
    model,
    generatedAt: new Date().toISOString(),
    days,
  };

  forecastCache.set(mountain.id, response);
  return response;
}
