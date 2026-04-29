import type { FastifyInstance } from 'fastify';
import { MOUNTAINS } from '../data/mountains.js';
import type { MountainPublic } from '../types.js';

export async function mountainsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/mountains', async () => {
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
