import { MOUNTAINS } from '../data/mountains.js';
import { getForecastsBatch } from './forecast.js';
import { TTLCache } from '../cache.js';
import type {
  MountainPublic,
  BestWindow,
  Verdict,
  DayForecast,
  ForecastResponse,
} from '../types.js';

const HIGHLIGHTS_TTL_MS = 30 * 60 * 1000;

export interface HighlightItem {
  mountain: MountainPublic;
  bestDay: {
    date: string;
    verdict: Verdict;
    score: number;
    bestWindow: BestWindow | null;
  };
}

export interface HighlightsResponse {
  generatedAt: string;
  count: number;
  destinations: HighlightItem[];
}

export const highlightsCache = new TTLCache<HighlightsResponse>(HIGHLIGHTS_TTL_MS);

let inFlight: Promise<HighlightsResponse> | null = null;

export async function getHighlights(): Promise<HighlightsResponse> {
  const cached = highlightsCache.get('all');
  if (cached) return cached;

  if (inFlight) return inFlight;

  inFlight = compute().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Força recálculo ignorando cache. Usado pelo refresh periódico em background. */
export async function refreshHighlights(): Promise<HighlightsResponse> {
  if (inFlight) return inFlight;
  inFlight = compute().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function compute(): Promise<HighlightsResponse> {
  const forecasts = await getForecastsBatch(MOUNTAINS);
  const items: HighlightItem[] = [];

  for (const mountain of MOUNTAINS) {
    const forecast = forecasts.get(mountain.id);
    if (!forecast) continue;
    const item = pickBestDay(mountain.id, forecast);
    if (item) items.push(item);
  }

  items.sort((a, b) => {
    if (b.bestDay.score !== a.bestDay.score) return b.bestDay.score - a.bestDay.score;
    return a.bestDay.date.localeCompare(b.bestDay.date);
  });

  const response: HighlightsResponse = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    destinations: items,
  };

  highlightsCache.set('all', response);
  return response;
}

function pickBestDay(_mountainId: string, forecast: ForecastResponse): HighlightItem | null {
  const todayStr = new Date().toISOString().slice(0, 10);
  const candidates = forecast.days.filter(
    (d) => d.date >= todayStr && (d.verdict === 'SIM' || d.verdict === 'PROVAVEL'),
  );
  if (candidates.length === 0) return null;

  const best = candidates.reduce<DayForecast>((acc, cur) => {
    if (cur.score > acc.score) return cur;
    if (cur.score === acc.score && cur.date < acc.date) return cur;
    return acc;
  }, candidates[0]!);

  return {
    mountain: {
      id: forecast.mountain.id,
      name: forecast.mountain.name,
      city: forecast.mountain.city,
      state: forecast.mountain.state,
      elevationM: forecast.mountain.elevationM,
      type: forecast.mountain.type,
      tags: forecast.mountain.tags ?? [],
    },
    bestDay: {
      date: best.date,
      verdict: best.verdict,
      score: best.score,
      bestWindow: best.bestWindow,
    },
  };
}
