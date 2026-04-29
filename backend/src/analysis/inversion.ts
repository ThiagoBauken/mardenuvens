import type { HourlyData, PressureLevelData } from '../types.js';
import { altitudeOfLevel } from '../providers/openMeteo.js';
import { clamp, expectedTempAtAltitude } from './meteo.js';

export interface LevelSelection {
  below: PressureLevelData | null;
  at: PressureLevelData | null;
  above: PressureLevelData | null;
}

/**
 * Dado o perfil vertical de uma hora, escolhe os níveis de pressão
 * imediatamente abaixo, próximo e acima da altitude do cume.
 *
 * - `below` é o nível com altitude < elevation, mais alto possível.
 * - `above` é o nível com altitude > elevation, mais baixo possível.
 * - `at`    é o nível mais próximo do cume (qualquer lado).
 */
export function selectLevels(
  hour: HourlyData,
  elevationM: number,
): LevelSelection {
  const sorted = Object.values(hour.pressureLevels)
    .map((lvl) => ({ lvl, alt: altitudeOfLevel(lvl) }))
    .sort((a, b) => a.alt - b.alt);

  let below: PressureLevelData | null = null;
  let above: PressureLevelData | null = null;
  let nearest: PressureLevelData | null = null;
  let nearestDist = Infinity;

  for (const { lvl, alt } of sorted) {
    if (alt < elevationM) below = lvl; // o último que cair embaixo é o "imediatamente abaixo"
    if (alt > elevationM && above === null) above = lvl; // o primeiro que cair acima
    const dist = Math.abs(alt - elevationM);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = lvl;
    }
  }

  return { below, at: nearest, above };
}

export interface InversionResult {
  /** Quão mais quente o nível superior está em relação ao esperado pelo lapse padrão (°C). */
  delta: number;
  /** Score 0..1: 0 = sem inversão, 1 = inversão muito forte. */
  score: number;
  /** Diferença real entre Tabove e Tbelow (°C). Positivo = inversão evidente. */
  rawTempDiff: number;
}

/**
 * Detecta inversão térmica entre os níveis abaixo e acima do cume.
 *
 * Lógica: numa atmosfera "normal" a temperatura cai ~6.5°C/km com a altitude.
 * Se o ar acima estiver mais quente que o esperado por essa taxa, há inversão.
 * Quanto maior o desvio para "mais quente que o esperado", mais forte a
 * inversão e mais provável que prenda nuvens baixas.
 */
export function inversionScore(
  below: PressureLevelData | null,
  above: PressureLevelData | null,
): InversionResult {
  if (!below || !above) {
    return { delta: 0, score: 0, rawTempDiff: 0 };
  }

  const altBelow = altitudeOfLevel(below);
  const altAbove = altitudeOfLevel(above);
  if (altAbove <= altBelow) {
    return { delta: 0, score: 0, rawTempDiff: 0 };
  }

  const expected = expectedTempAtAltitude(below.temperature, altBelow, altAbove);
  const delta = above.temperature - expected;
  const rawTempDiff = above.temperature - below.temperature;

  // Mapeia delta para score (calibração mais sensível para inversões reais):
  //   delta = -1°C  → 0.0   (decaimento normal, sem inversão)
  //   delta =  0°C  → 0.25  (atmosfera estável)
  //   delta = +1°C  → 0.50
  //   delta = +2°C  → 0.75
  //   delta = +3°C  → 1.00  (inversão forte)
  const score = clamp((delta + 1) / 4, 0, 1);

  return { delta, score, rawTempDiff };
}
