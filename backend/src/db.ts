import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? './data/ceunuvens.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    mountain_id  TEXT NOT NULL,
    report_date  TEXT NOT NULL,
    happened     INTEGER NOT NULL CHECK (happened IN (0, 1)),
    comment      TEXT,
    author_name  TEXT,
    ip_hash      TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reports_mountain_date
    ON reports(mountain_id, report_date DESC, created_at DESC);

  CREATE UNIQUE INDEX IF NOT EXISTS uniq_reports_per_ip_per_day
    ON reports(mountain_id, report_date, ip_hash);

  CREATE TABLE IF NOT EXISTS forecast_cache (
    mountain_id TEXT PRIMARY KEY,
    payload     TEXT NOT NULL,
    stale_at    INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_forecast_cache_expires
    ON forecast_cache(expires_at);

  CREATE TABLE IF NOT EXISTS forecast_snapshots (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    mountain_id  TEXT NOT NULL,
    for_date     TEXT NOT NULL,
    capture_day  TEXT NOT NULL,
    captured_at  TEXT NOT NULL,
    verdict      TEXT NOT NULL,
    score        REAL NOT NULL,
    UNIQUE (mountain_id, for_date, capture_day)
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_for_date
    ON forecast_snapshots(for_date);

  CREATE INDEX IF NOT EXISTS idx_snapshots_mountain
    ON forecast_snapshots(mountain_id);
`);

// Migração simples: adiciona stale_at se a tabela existia sem essa coluna.
try {
  const cols = db
    .prepare('PRAGMA table_info(forecast_cache)')
    .all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'stale_at')) {
    db.exec(
      'ALTER TABLE forecast_cache ADD COLUMN stale_at INTEGER NOT NULL DEFAULT 0',
    );
  }
} catch {
  // best-effort
}

export interface ReportRow {
  id: number;
  mountain_id: string;
  report_date: string;
  happened: 0 | 1;
  comment: string | null;
  author_name: string | null;
  created_at: string;
}

export interface ReportPublic {
  id: number;
  mountainId: string;
  reportDate: string;
  happened: boolean;
  comment: string | null;
  authorName: string | null;
  createdAt: string;
}

export function reportRowToPublic(row: ReportRow): ReportPublic {
  return {
    id: row.id,
    mountainId: row.mountain_id,
    reportDate: row.report_date,
    happened: row.happened === 1,
    comment: row.comment,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

const insertStmt = db.prepare<
  [string, string, number, string | null, string | null, string]
>(`
  INSERT INTO reports (mountain_id, report_date, happened, comment, author_name, ip_hash)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const listByMountainStmt = db.prepare<[string, number]>(`
  SELECT * FROM reports
  WHERE mountain_id = ?
  ORDER BY report_date DESC, created_at DESC
  LIMIT ?
`);

const listByMountainAndDateStmt = db.prepare<[string, string]>(`
  SELECT * FROM reports
  WHERE mountain_id = ? AND report_date = ?
  ORDER BY created_at DESC
`);

const summaryStmt = db.prepare<[string, string]>(`
  SELECT
    SUM(CASE WHEN happened = 1 THEN 1 ELSE 0 END) AS yes_count,
    SUM(CASE WHEN happened = 0 THEN 1 ELSE 0 END) AS no_count
  FROM reports
  WHERE mountain_id = ? AND report_date = ?
`);

const countByIpRecentStmt = db.prepare<[string, string]>(`
  SELECT COUNT(*) AS n FROM reports
  WHERE ip_hash = ? AND created_at > ?
`);

export function insertReport(input: {
  mountainId: string;
  reportDate: string;
  happened: boolean;
  comment: string | null;
  authorName: string | null;
  ipHash: string;
}): ReportPublic {
  const result = insertStmt.run(
    input.mountainId,
    input.reportDate,
    input.happened ? 1 : 0,
    input.comment,
    input.authorName,
    input.ipHash,
  );
  const id = Number(result.lastInsertRowid);
  const row = db.prepare<[number]>('SELECT * FROM reports WHERE id = ?').get(id) as ReportRow;
  return reportRowToPublic(row);
}

export function listReports(mountainId: string, limit = 50): ReportPublic[] {
  const rows = listByMountainStmt.all(mountainId, limit) as ReportRow[];
  return rows.map(reportRowToPublic);
}

export function listReportsForDate(mountainId: string, reportDate: string): ReportPublic[] {
  const rows = listByMountainAndDateStmt.all(mountainId, reportDate) as ReportRow[];
  return rows.map(reportRowToPublic);
}

export function summaryForDate(mountainId: string, reportDate: string): {
  yes: number;
  no: number;
} {
  const row = summaryStmt.get(mountainId, reportDate) as { yes_count: number | null; no_count: number | null } | undefined;
  return { yes: row?.yes_count ?? 0, no: row?.no_count ?? 0 };
}

export function countRecentReportsByIp(ipHash: string, sinceISO: string): number {
  const row = countByIpRecentStmt.get(ipHash, sinceISO) as { n: number } | undefined;
  return row?.n ?? 0;
}

// ─── Forecast cache (camada persistente entre restarts) ─────────────────────

const upsertForecastStmt = db.prepare<[string, string, number, number]>(`
  INSERT INTO forecast_cache (mountain_id, payload, stale_at, expires_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(mountain_id) DO UPDATE SET
    payload = excluded.payload,
    stale_at = excluded.stale_at,
    expires_at = excluded.expires_at
`);

const selectForecastStmt = db.prepare<[string]>(`
  SELECT payload, stale_at, expires_at FROM forecast_cache WHERE mountain_id = ?
`);

const pruneForecastStmt = db.prepare<[number]>(`
  DELETE FROM forecast_cache WHERE expires_at < ?
`);

export interface CachedForecast<T> {
  value: T;
  /** true se a entrada ainda é válida mas passou do stale_at — pode revalidar em bg. */
  isStale: boolean;
}

/**
 * Retorna a entrada se ainda dentro do TTL absoluto (expires_at). Se passou de
 * stale_at mas ainda não expirou, retorna marcando isStale=true — caller pode
 * decidir entre servir + revalidar (SWR) ou bloquear.
 */
export function readForecastCache<T>(mountainId: string): CachedForecast<T> | null {
  const row = selectForecastStmt.get(mountainId) as
    | { payload: string; stale_at: number; expires_at: number }
    | undefined;
  if (!row) return null;
  const now = Date.now();
  if (row.expires_at < now) return null;
  try {
    const value = JSON.parse(row.payload) as T;
    return { value, isStale: row.stale_at < now };
  } catch {
    return null;
  }
}

export function writeForecastCache<T>(
  mountainId: string,
  payload: T,
  staleMs: number,
  maxAgeMs: number = staleMs * 6,
): void {
  const now = Date.now();
  upsertForecastStmt.run(
    mountainId,
    JSON.stringify(payload),
    now + staleMs,
    now + maxAgeMs,
  );
}

export function pruneExpiredForecastCache(): number {
  const result = pruneForecastStmt.run(Date.now());
  return result.changes ?? 0;
}

// ─── Forecast snapshots (histórico p/ medir acurácia) ───────────────────────

const upsertSnapshotStmt = db.prepare<
  [string, string, string, string, string, number]
>(`
  INSERT INTO forecast_snapshots
    (mountain_id, for_date, capture_day, captured_at, verdict, score)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(mountain_id, for_date, capture_day) DO UPDATE SET
    captured_at = excluded.captured_at,
    verdict     = excluded.verdict,
    score       = excluded.score
`);

const lastSnapshotBeforeStmt = db.prepare<[string, string, string]>(`
  SELECT verdict, score, captured_at, capture_day
  FROM forecast_snapshots
  WHERE mountain_id = ? AND for_date = ? AND capture_day <= ?
  ORDER BY captured_at DESC
  LIMIT 1
`);

const reportSummaryStmt = db.prepare<[string, string]>(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN happened = 1 THEN 1 ELSE 0 END) AS yes_count
  FROM reports
  WHERE mountain_id = ? AND report_date = ?
`);

const evaluablePairsStmt = db.prepare(`
  SELECT DISTINCT s.mountain_id AS mountain_id, s.for_date AS for_date
  FROM forecast_snapshots s
  INNER JOIN reports r
    ON r.mountain_id = s.mountain_id AND r.report_date = s.for_date
`);

export interface SnapshotRow {
  verdict: string;
  score: number;
  captured_at: string;
  capture_day: string;
}

export function upsertForecastSnapshot(input: {
  mountainId: string;
  forDate: string;
  captureDay: string;
  capturedAt: string;
  verdict: string;
  score: number;
}): void {
  upsertSnapshotStmt.run(
    input.mountainId,
    input.forDate,
    input.captureDay,
    input.capturedAt,
    input.verdict,
    input.score,
  );
}

export function lastSnapshotBefore(
  mountainId: string,
  forDate: string,
  captureDayUpperBound: string,
): SnapshotRow | null {
  const row = lastSnapshotBeforeStmt.get(
    mountainId,
    forDate,
    captureDayUpperBound,
  ) as SnapshotRow | undefined;
  return row ?? null;
}

export function reportSummary(
  mountainId: string,
  reportDate: string,
): { total: number; yesCount: number } {
  const row = reportSummaryStmt.get(mountainId, reportDate) as
    | { total: number; yes_count: number | null }
    | undefined;
  return {
    total: row?.total ?? 0,
    yesCount: row?.yes_count ?? 0,
  };
}

export function listEvaluablePairs(): Array<{
  mountainId: string;
  forDate: string;
}> {
  const rows = evaluablePairsStmt.all() as Array<{
    mountain_id: string;
    for_date: string;
  }>;
  return rows.map((r) => ({ mountainId: r.mountain_id, forDate: r.for_date }));
}
