import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import etag from '@fastify/etag';
import fastifyStatic from '@fastify/static';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mountainsRoutes } from './routes/mountains.js';
import { forecastRoutes } from './routes/forecast.js';
import { reportsRoutes } from './routes/reports.js';
import { highlightsRoutes } from './routes/highlights.js';
import { seoRoutes } from './routes/seo.js';
import { getHighlights, refreshHighlights } from './services/highlights.js';
import { startForecastCachePruner } from './services/forecast.js';

const PORT = Number(process.env.PORT ?? 7777);
const HOST = process.env.HOST ?? '0.0.0.0';
const FRONTEND_DIR = process.env.FRONTEND_DIR ?? resolveDefaultFrontendDir();
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'https://mardenuvens.com.br';
const IS_PROD = process.env.NODE_ENV === 'production';

async function main(): Promise<void> {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    bodyLimit: 50 * 1024,
  });

  // Security headers (CSP, X-Frame-Options, HSTS, etc).
  // contentSecurityPolicy desabilitado pra não quebrar inline scripts/styles do
  // Vite dev e do JSON-LD que injetamos no index.html. Em produção real, vale
  // configurar uma política específica.
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // Compressão gzip/brotli — reduz payloads JSON em 70-80%.
  await app.register(compress, {
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024, // só comprime acima de 1KB
  });

  // ETag automático em todas as respostas 200 com body.
  await app.register(etag);

  // CORS: em prod, só aceita o domínio público; em dev, libera local + tools.
  await app.register(cors, {
    origin: IS_PROD
      ? [PUBLIC_BASE_URL, PUBLIC_BASE_URL.replace('https://', 'https://www.')]
      : true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(mountainsRoutes);
  await app.register(forecastRoutes);
  await app.register(highlightsRoutes);
  await app.register(reportsRoutes);
  await app.register(seoRoutes);

  if (existsSync(FRONTEND_DIR)) {
    app.log.info(`Servindo frontend estático de ${FRONTEND_DIR}`);
    await app.register(fastifyStatic, {
      root: FRONTEND_DIR,
      prefix: '/',
      wildcard: false,
      // Cache aggressive nos assets versionados (Vite hash no nome); HTML curto.
      setHeaders: (res, path) => {
        if (path.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=300');
        }
      },
    });

    const indexPath = resolve(FRONTEND_DIR, 'index.html');
    const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : null;
    if (indexHtml) {
      app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api/') || request.url.startsWith('/health')) {
          reply.code(404).send({ error: 'Not found', url: request.url });
          return;
        }
        reply
          .type('text/html')
          .header('Cache-Control', 'public, max-age=300')
          .send(indexHtml);
      });
    }
  } else {
    app.log.info(`FRONTEND_DIR não encontrado em ${FRONTEND_DIR} (modo dev — Vite serve separado)`);
  }

  await app.listen({ port: PORT, host: HOST });

  void getHighlights()
    .then((r) => app.log.info(`Warmup do /api/highlights ok: ${r.count} destinos`))
    .catch((err) => app.log.warn({ err }, 'Warmup do /api/highlights falhou'));

  setInterval(() => {
    void refreshHighlights()
      .then((r) => app.log.info(`Refresh do /api/highlights: ${r.count} destinos`))
      .catch((err) => app.log.warn({ err }, 'Refresh do /api/highlights falhou'));
  }, 25 * 60 * 1000);

  startForecastCachePruner();
}

function resolveDefaultFrontendDir(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      resolve(here, '../public'),
      resolve(here, '../../public'),
      resolve(here, '../../frontend/dist'),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return candidates[0]!;
  } catch {
    return './public';
  }
}

main().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
