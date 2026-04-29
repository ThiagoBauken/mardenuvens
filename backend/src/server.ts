import Fastify from 'fastify';
import cors from '@fastify/cors';
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

async function main(): Promise<void> {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    bodyLimit: 50 * 1024, // 50KB — suficiente p/ formulário de report; bloqueia abuso
  });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(mountainsRoutes);
  await app.register(forecastRoutes);
  await app.register(highlightsRoutes);
  await app.register(reportsRoutes);
  await app.register(seoRoutes);

  // Serve o frontend estático se a pasta existir (modo produção).
  // Em dev, o Vite roda separado e o frontend não está empacotado aqui.
  if (existsSync(FRONTEND_DIR)) {
    app.log.info(`Servindo frontend estático de ${FRONTEND_DIR}`);
    await app.register(fastifyStatic, {
      root: FRONTEND_DIR,
      prefix: '/',
      wildcard: false,
    });

    const indexPath = resolve(FRONTEND_DIR, 'index.html');
    const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : null;
    if (indexHtml) {
      // SPA fallback: qualquer rota não-API que não seja arquivo retorna o index.html.
      app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api/') || request.url.startsWith('/health')) {
          reply.code(404).send({ error: 'Not found', url: request.url });
          return;
        }
        reply.type('text/html').send(indexHtml);
      });
    }
  } else {
    app.log.info(`FRONTEND_DIR não encontrado em ${FRONTEND_DIR} (modo dev — Vite serve separado)`);
  }

  await app.listen({ port: PORT, host: HOST });

  // Warmup do carrossel da landing em background — primeira request fica
  // instantânea em vez de esperar 154 chamadas Open-Meteo.
  void getHighlights()
    .then((r) => app.log.info(`Warmup do /api/highlights ok: ${r.count} destinos`))
    .catch((err) => app.log.warn({ err }, 'Warmup do /api/highlights falhou (recupera no primeiro request)'));

  // Re-aquece o cache periodicamente (a cada 25 min) para nunca expirar
  // durante uso normal e sempre ter dados frescos.
  setInterval(() => {
    void refreshHighlights()
      .then((r) => app.log.info(`Refresh do /api/highlights: ${r.count} destinos`))
      .catch((err) => app.log.warn({ err }, 'Refresh do /api/highlights falhou'));
  }, 25 * 60 * 1000);

  // Limpa entradas expiradas do cache em SQLite a cada 6h
  startForecastCachePruner();
}

function resolveDefaultFrontendDir(): string {
  // Quando empacotado, server.js fica em /app/dist e o frontend em /app/public.
  // Em dev, este arquivo TS roda via tsx; tentamos /backend/../frontend/dist.
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
