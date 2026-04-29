// Converte scripts/og-image.svg em frontend/public/og-image.png (1200x630).
// Uso: `node scripts/build-og-image.mjs`
//
// Usa @resvg/resvg-js (WASM, sem deps nativas — funciona no Windows e Alpine).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(here, 'og-image.svg');
const outPath = resolve(here, '../frontend/public/og-image.png');

const svg = readFileSync(svgPath, 'utf8');

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  background: '#0e1a2b',
  font: { loadSystemFonts: true },
});

const png = resvg.render().asPng();
writeFileSync(outPath, png);

console.log(`OG image gerado: ${outPath} (${png.byteLength} bytes)`);
