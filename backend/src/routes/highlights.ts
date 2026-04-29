import type { FastifyInstance } from 'fastify';
import { getHighlights, highlightsCache } from '../services/highlights.js';

export async function highlightsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/highlights', async (_request, reply) => {
    const cached = highlightsCache.get('all');
    reply.header('x-cache', cached ? 'hit' : 'miss');
    reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
    return getHighlights();
  });
}
