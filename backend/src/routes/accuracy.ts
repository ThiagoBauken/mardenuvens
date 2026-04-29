import type { FastifyInstance } from 'fastify';
import { computeAccuracy } from '../services/accuracy.js';

export async function accuracyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/accuracy', async (_request, reply) => {
    // Cálculo é leve (poucos rows até o site escalar) — pode regenerar a cada hora
    // sem dor. Browser cacheia por 5min.
    reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    return computeAccuracy();
  });
}
