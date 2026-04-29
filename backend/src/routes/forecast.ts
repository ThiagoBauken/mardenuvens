import type { FastifyInstance } from 'fastify';
import { getMountainById } from '../data/mountains.js';
import { getForecastFor, forecastCache } from '../services/forecast.js';
import { OpenMeteoError } from '../providers/openMeteo.js';

export async function forecastRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>('/api/forecast/:id', async (request, reply) => {
    const { id } = request.params;
    const mountain = getMountainById(id);
    if (!mountain) {
      reply.code(404);
      return { error: 'Montanha não encontrada', id };
    }

    const cached = forecastCache.get(id);
    reply.header('x-cache', cached ? 'hit' : 'miss');

    try {
      return await getForecastFor(mountain);
    } catch (err) {
      const msg = err instanceof OpenMeteoError ? err.message : 'Falha ao consultar Open-Meteo';
      app.log.error({ err, mountain: id }, 'Falha ao gerar previsão');
      reply.code(503);
      return { error: msg, mountain: id };
    }
  });
}
