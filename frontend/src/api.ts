import type {
  MountainPublic,
  ForecastResponse,
  ReportsForDateResponse,
  NewReport,
  Report,
  HighlightsResponse,
} from './types';

export async function fetchMountains(): Promise<MountainPublic[]> {
  const res = await fetch('/api/mountains');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchForecast(id: string): Promise<ForecastResponse> {
  const res = await fetch(`/api/forecast/${encodeURIComponent(id)}`);
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error ?? '';
    } catch {
      // ignore
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchHighlights(): Promise<HighlightsResponse> {
  const res = await fetch('/api/highlights');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchReportsForDate(
  id: string,
  date: string,
): Promise<ReportsForDateResponse> {
  const res = await fetch(
    `/api/reports/${encodeURIComponent(id)}/${encodeURIComponent(date)}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postReport(input: NewReport): Promise<Report> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error ?? '';
    } catch {
      // ignore
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}
