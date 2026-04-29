import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { getMountainById } from '../data/mountains.js';
import {
  insertReport,
  listReports,
  listReportsForDate,
  summaryForDate,
  countRecentReportsByIp,
} from '../db.js';

const MAX_COMMENT = 500;
const MAX_AUTHOR = 50;
const MAX_REPORTS_PER_IP_PER_HOUR = 5;
const REPORT_AGE_LIMIT_DAYS = 30;

interface PostBody {
  mountainId?: unknown;
  reportDate?: unknown;
  happened?: unknown;
  comment?: unknown;
  authorName?: unknown;
}

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>('/api/reports/:id', async (request, reply) => {
    const id = request.params.id;
    if (!getMountainById(id)) {
      reply.code(404);
      return { error: 'Montanha não encontrada', id };
    }
    // Conteúdo muda a cada novo relato; cache curto + revalidação ajuda.
    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return { reports: listReports(id, 50) };
  });

  app.get<{ Params: { id: string; date: string } }>(
    '/api/reports/:id/:date',
    async (request, reply) => {
      const { id, date } = request.params;
      if (!getMountainById(id)) {
        reply.code(404);
        return { error: 'Montanha não encontrada', id };
      }
      if (!isValidDate(date)) {
        reply.code(400);
        return { error: 'Formato de data inválido (use YYYY-MM-DD)' };
      }
      reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return {
        reports: listReportsForDate(id, date),
        summary: summaryForDate(id, date),
      };
    },
  );

  app.post<{ Body: PostBody }>('/api/reports', async (request, reply) => {
    const body = request.body ?? {};

    const mountainId = typeof body.mountainId === 'string' ? body.mountainId.trim() : '';
    const reportDate = typeof body.reportDate === 'string' ? body.reportDate.trim() : '';
    const happened = typeof body.happened === 'boolean' ? body.happened : null;
    const comment = sanitizeOptionalText(body.comment, MAX_COMMENT);
    const authorName = sanitizeOptionalText(body.authorName, MAX_AUTHOR);

    if (!getMountainById(mountainId)) {
      reply.code(400);
      return { error: 'mountainId inválido' };
    }
    if (!isValidDate(reportDate)) {
      reply.code(400);
      return { error: 'reportDate inválido (use YYYY-MM-DD)' };
    }
    if (!isWithinAllowedRange(reportDate)) {
      reply.code(400);
      return { error: `reportDate deve estar entre hoje e ${REPORT_AGE_LIMIT_DAYS} dias atrás` };
    }
    if (happened === null) {
      reply.code(400);
      return { error: 'happened deve ser boolean' };
    }
    if (comment === false || authorName === false) {
      reply.code(400);
      return {
        error: `comment até ${MAX_COMMENT} caracteres, authorName até ${MAX_AUTHOR}`,
      };
    }

    const ipHash = hashIp(request);

    // Rate limit: máximo 5 reports por IP por hora.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = countRecentReportsByIp(ipHash, oneHourAgo);
    if (recent >= MAX_REPORTS_PER_IP_PER_HOUR) {
      reply.code(429);
      return { error: 'Muitos relatos recentes. Tente novamente em 1h.' };
    }

    try {
      const created = insertReport({
        mountainId,
        reportDate,
        happened,
        comment: comment ?? null,
        authorName: authorName ?? null,
        ipHash,
      });
      reply.code(201);
      return created;
    } catch (e) {
      const msg = (e as Error).message ?? '';
      if (msg.includes('UNIQUE')) {
        reply.code(409);
        return { error: 'Você já enviou um relato para este destino nesse dia.' };
      }
      app.log.error({ err: e }, 'Falha ao gravar report');
      reply.code(500);
      return { error: 'Falha ao gravar' };
    }
  });
}

function sanitizeOptionalText(v: unknown, max: number): string | null | false {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') return false;
  const trimmed = v.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) return false;
  return trimmed;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function isWithinAllowedRange(s: string): boolean {
  const date = new Date(s + 'T00:00:00Z');
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (date.getTime() > today.getTime() + 24 * 60 * 60 * 1000) return false;
  const earliest = today.getTime() - REPORT_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000;
  return date.getTime() >= earliest;
}

const IP_SALT = process.env.IP_HASH_SALT ?? 'ceunuvens-default-salt-change-in-prod';

function hashIp(request: FastifyRequest): string {
  const xff = request.headers['x-forwarded-for'];
  const ip =
    (typeof xff === 'string' ? xff.split(',')[0]!.trim() : Array.isArray(xff) ? xff[0] ?? '' : '') ||
    request.ip ||
    'unknown';
  return createHash('sha256').update(ip + ':' + IP_SALT).digest('hex').slice(0, 32);
}
