import type { HourlyData } from '../types.js';
import { clamp, estimateCloudBaseM } from './meteo.js';

export interface CloudLayerScores {
  /** Cobertura de nuvens BAIXAS é alta (>50% é bom). */
  lowCover: number;
  /** Céu acima do cume está limpo (sem nuvens médias/altas). */
  skyClearAloft: number;
  /** Base estimada das nuvens está abaixo do cume. */
  baseBelow: number;
  /** Base estimada (m) — útil para mostrar pro usuário. */
  cloudBaseM: number;
}

/**
 * Avalia a estrutura vertical de nuvens em uma hora específica em relação à
 * altitude da montanha.
 */
export function cloudLayerScores(
  hour: HourlyData,
  elevationM: number,
): CloudLayerScores {
  const cloudBaseM = estimateCloudBaseM(hour.temperature_2m, hour.dew_point_2m);

  // Cobertura de nuvens baixas: 0% → 0; 60%+ → 1 (mais permissivo)
  const lowCover = clamp(hour.cloud_cover_low / 60, 0, 1);

  // Céu acima limpo: penaliza pela MAIOR cobertura entre média e alta.
  // 0% mid/high → 1; 60%+ → 0 (mais permissivo: nuvens médias/altas finas não são fatais)
  const aloftMax = Math.max(hour.cloud_cover_mid, hour.cloud_cover_high);
  const skyClearAloft = clamp(1 - aloftMax / 60, 0, 1);

  // Base abaixo do cume: ideal é que a estimativa fique abaixo da elevação.
  // Se base < elevation → score 1
  // Se base = elevation → score 1
  // Se base = elevation + 500m → score 0 (linear)
  let baseBelow: number;
  if (cloudBaseM <= elevationM) {
    baseBelow = 1;
  } else {
    baseBelow = clamp(1 - (cloudBaseM - elevationM) / 500, 0, 1);
  }

  return { lowCover, skyClearAloft, baseBelow, cloudBaseM };
}
