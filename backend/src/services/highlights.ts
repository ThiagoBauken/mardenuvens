import { MOUNTAINS } from '../data/mountains.js';
import { getForecastFor } from './forecast.js';
import { TTLCache } from '../cache.js';
import type {
  Mountain,
  MountainPublic,
  BestWindow,
  Verdict,
  DayForecast,
} from '../types.js';

const HIGHLIGHTS_TTL_MS = 30 * 60 * 1000;
const CONCURRENCY = 16;

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
  const items: HighlightItem[] = [];

  for (let i = 0; i < MOUNTAINS.length; i += CONCURRENCY) {
    const batch = MOUNTAINS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(buildHighlight));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) items.push(r.value);
    }
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

async function buildHighlight(mountain: Mountain): Promise<HighlightItem | null> {
  try {
    const forecast = await getForecastFor(mountain);
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
        id: mountain.id,
        name: mountain.name,
        city: mountain.city,
        state: mountain.state,
        elevationM: mountain.elevationM,
        type: mountain.type,
        tags: mountain.tags ?? [],
      },
      bestDay: {
        date: best.date,
        verdict: best.verdict,
        score: best.score,
        bestWindow: best.bestWindow,
      },
    };
  } catch {
    return null;
  }
}
