import type { FastifyInstance } from 'fastify';
import { MOUNTAINS } from '../data/mountains.js';
import type { MountainPublic } from '../types.js';

export async function mountainsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/mountains', async (_request, reply) => {
    // Catálogo muda raramente — cache forte. ETag (do plugin) + revalidação 304
    // garante que mudanças aparecem rápido mesmo com max-age longo.
    reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    const list: MountainPublic[] = MOUNTAINS.map((m) => ({
      id: m.id,
      name: m.name,
      city: m.city,
      state: m.state,
      elevationM: m.elevationM,
      type: m.type,
      tags: m.tags ?? [],
    }));
    return list;
  });
}
