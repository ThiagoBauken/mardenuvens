import type {
  HourlyData,
  Mountain,
  PressureLevelSnapshot,
  RawMetrics,
} from '../types.js';
import { altitudeOfLevel } from '../providers/openMeteo.js';
import { cloudLayerScores, type CloudLayerScores } from './cloudLayer.js';
import { inversionScore, selectLevels, type InversionResult } from './inversion.js';
import { clamp, avg, liftedCondensationLevelM } from './meteo.js';
import { getProfile, type ScoreWeights } from './profiles.js';

export interface HourlyScore {
  /** ISO local timestamp da hora avaliada. */
  time: string;
  /** Hora local (0..23). */
  localHour: number;
  /** Score final 0..1. */
  score: number;
  /** Score só dos componentes (sem multiplicar pelos pesos), útil para reasoning. */
  components: ScoreComponents;
  /** Resultado da detecção de inversão (com delta em °C). */
  inversion: InversionResult;
  /** Avaliação das camadas de nuvens. */
  layers: CloudLayerScores;
  /** Snapshots dos níveis de pressão usados. */
  raw: RawMetrics;
}

export interface ScoreComponents {
  inversion: number;
  humidityBelow: number;
  dryAbove: number;
  lowCover: number;
  skyClearAloft: number;
  wind: number;
  baseBelow: number;
}

/**
 * Calcula o score de mar de nuvens para uma única hora.
 *
 * É a função pura mais importante do projeto. Recebe a hora bruta + a
 * montanha + os pesos do perfil climático, devolve um score 0..1 e os
 * componentes individuais (para gerar a explicação textual depois).
 */
export function scoreHour(
  hour: HourlyData,
  mountain: Mountain,
  weights: ScoreWeights,
): HourlyScore {
  const { below, at, above } = selectLevels(hour, mountain.elevationM);

  const inv = inversionScore(below, above);

  // Umidade abaixo do cume: média entre o nível imediatamente abaixo (e o
  // "at" se ele estiver abaixo do cume também) com a RH de superfície.
  // Mar de nuvens forma com RH 75-85% na camada baixa — não precisa estar a 95%.
  const rhBelow = below?.relativeHumidity;
  const rhAt = at?.relativeHumidity;
  const rhSurface = hour.relative_humidity_2m;
  const meanRhBelow = avg(rhBelow, rhAt, rhSurface);
  const humidityBelow = clamp((meanRhBelow - 55) / 25, 0, 1);

  // Ar seco acima do cume: 0% → 1.0, 75%+ → 0
  const rhAbove = above?.relativeHumidity ?? 100;
  const dryAbove = clamp(1 - rhAbove / 75, 0, 1);

  // Vento: prefere usar a velocidade no nível do cume ('at'); se não houver, usa superfície.
  const windAtCume = at?.windSpeed ?? hour.wind_speed_10m;
  const wind = clamp(1 - windAtCume / 7, 0, 1);

  const layers = cloudLayerScores(hour, mountain.elevationM);

  const components: ScoreComponents = {
    inversion: inv.score,
    humidityBelow,
    dryAbove,
    lowCover: layers.lowCover,
    skyClearAloft: layers.skyClearAloft,
    wind,
    baseBelow: layers.baseBelow,
  };

  const score = clamp(
    weights.inversion * components.inversion +
      weights.humidityBelow * components.humidityBelow +
      weights.dryAbove * components.dryAbove +
      weights.lowCover * components.lowCover +
      weights.skyClearAloft * components.skyClearAloft +
      weights.wind * components.wind +
      weights.baseBelow * components.baseBelow,
    0,
    1,
  );

  const raw: RawMetrics = {
    tSurface: round(hour.temperature_2m, 1),
    tdSurface: round(hour.dew_point_2m, 1),
    rhSurface: round(hour.relative_humidity_2m, 0),
    windSurface: round(hour.wind_speed_10m, 1),
    surfacePressure: round(hour.surface_pressure, 0),
    cloudCover: round(hour.cloud_cover, 0),
    cloudCoverLow: round(hour.cloud_cover_low, 0),
    cloudCoverMid: round(hour.cloud_cover_mid, 0),
    cloudCoverHigh: round(hour.cloud_cover_high, 0),
    cloudBaseEstM: round(layers.cloudBaseM, 0),
    lclM: round(liftedCondensationLevelM(hour.temperature_2m, hour.dew_point_2m), 0),
    belowLevel: snapshotOf(below),
    atLevel: snapshotOf(at),
    aboveLevel: snapshotOf(above),
  };

  const localHour = parseLocalHour(hour.time);

  return {
    time: hour.time,
    localHour,
    score,
    components,
    inversion: inv,
    layers,
    raw,
  };
}

/**
 * Aplica `scoreHour` em todas as horas, usando o perfil climático da montanha.
 */
export function scoreAllHours(
  hours: HourlyData[],
  mountain: Mountain,
): HourlyScore[] {
  const profile = getProfile(mountain.climate);
  return hours.map((h) => scoreHour(h, mountain, profile.weights));
}

function snapshotOf(level: ReturnType<typeof selectLevels>['at']): PressureLevelSnapshot | null {
  if (!level) return null;
  return {
    hPa: level.hPa,
    altitudeM: round(altitudeOfLevel(level), 0),
    temperature: round(level.temperature, 1),
    relativeHumidity: round(level.relativeHumidity, 0),
    windSpeed: level.windSpeed != null ? round(level.windSpeed, 1) : undefined,
  };
}

function round(v: number, decimals: number): number {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

/**
 * Open-Meteo retorna timestamps no formato local (`timezone=auto`), tipo
 * "2026-04-29T07:00". Extrai a hora.
 */
function parseLocalHour(isoLocal: string): number {
  const m = /T(\d{2}):/.exec(isoLocal);
  return m ? parseInt(m[1]!, 10) : 0;
}
