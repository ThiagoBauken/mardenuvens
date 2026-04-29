import type { FastifyInstance } from 'fastify';
import { MOUNTAINS } from '../data/mountains.js';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'https://mardenuvens.com.br';

export async function seoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/robots.txt', async (_request, reply) => {
    reply.type('text/plain');
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml`,
      '',
    ].join('\n');
  });

  app.get('/sitemap.xml', async (_request, reply) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls: string[] = [
      url('/', today, '1.0'),
    ];
    for (const m of MOUNTAINS) {
      urls.push(url(`/m/${encodeURIComponent(m.id)}`, today, '0.8'));
    }
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join('\n') +
      `\n</urlset>\n`;
    reply.type('application/xml');
    return xml;
  });
}

function url(path: string, lastmod: string, priority: string): string {
  return (
    `  <url>\n` +
    `    <loc>${PUBLIC_BASE_URL}${path}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>daily</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `  </url>`
  );
}
