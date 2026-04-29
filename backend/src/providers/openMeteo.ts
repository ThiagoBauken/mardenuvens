import type { ParsedForecast, HourlyData, PressureLevelData } from '../types.js';
import { pressureToAltitudeM } from '../analysis/meteo.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/** Níveis de pressão que pedimos. Cobrem do nível do mar até ~5500m. */
const PRESSURE_LEVELS = [1000, 925, 850, 700, 500] as const;

const HOURLY_SURFACE = [
  'temperature_2m',
  'dew_point_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'surface_pressure',
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
] as const;

const HOURLY_PRESSURE_BASE = [
  'temperature',
  'relative_humidity',
  'wind_speed',
  'geopotential_height',
] as const;

function buildHourlyParam(): string {
  const surface = [...HOURLY_SURFACE];
  const levels = PRESSURE_LEVELS.flatMap((hPa) =>
    HOURLY_PRESSURE_BASE.map((v) => `${v}_${hPa}hPa`),
  );
  return [...surface, ...levels].join(',');
}

interface OpenMeteoResponse {
  timezone: string;
  utc_offset_seconds: number;
  hourly: Record<string, Array<number | null> | string[]>;
}

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OpenMeteoError';
  }
}

export interface FetchOptions {
  model?: 'ecmwf_ifs025' | 'best_match' | 'gfs_seamless';
  forecastDays?: number;
  signal?: AbortSignal;
}

export async function fetchForecast(
  lat: number,
  lon: number,
  options: FetchOptions = {},
): Promise<ParsedForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: buildHourlyParam(),
    timezone: 'auto',
    forecast_days: String(options.forecastDays ?? 7),
    models: options.model ?? 'ecmwf_ifs025',
  });

  const url = `${OPEN_METEO_BASE}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { signal: options.signal });
  } catch (err) {
    throw new OpenMeteoError('Falha de rede ao consultar Open-Meteo', undefined, err);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new OpenMeteoError(
      `Open-Meteo respondeu com HTTP ${response.status}: ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;
  return parseResponse(data);
}

/**
 * Converte a resposta crua da Open-Meteo (arrays paralelos por variável) em
 * uma lista de horas, com cada hora carregando seu snapshot de superfície
 * + perfil de níveis de pressão.
 */
function parseResponse(data: OpenMeteoResponse): ParsedForecast {
  const times = (data.hourly.time ?? []) as string[];
  const hours: HourlyData[] = [];

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (!time) continue;

    const pressureLevels: Record<number, PressureLevelData> = {};
    for (const hPa of PRESSURE_LEVELS) {
      const t = numAt(data.hourly, `temperature_${hPa}hPa`, i);
      const rh = numAt(data.hourly, `relative_humidity_${hPa}hPa`, i);
      const ws = numAt(data.hourly, `wind_speed_${hPa}hPa`, i);
      const gh = numAt(data.hourly, `geopotential_height_${hPa}hPa`, i);

      if (t === null || rh === null) continue;

      pressureLevels[hPa] = {
        hPa,
        geopotentialHeightM: gh,
        temperature: t,
        relativeHumidity: rh,
        windSpeed: ws,
      };
    }

    hours.push({
      time,
      temperature_2m: numAt(data.hourly, 'temperature_2m', i) ?? Number.NaN,
      dew_point_2m: numAt(data.hourly, 'dew_point_2m', i) ?? Number.NaN,
      relative_humidity_2m: numAt(data.hourly, 'relative_humidity_2m', i) ?? 0,
      wind_speed_10m: numAt(data.hourly, 'wind_speed_10m', i) ?? 0,
      surface_pressure: numAt(data.hourly, 'surface_pressure', i) ?? 1013,
      cloud_cover: numAt(data.hourly, 'cloud_cover', i) ?? 0,
      cloud_cover_low: numAt(data.hourly, 'cloud_cover_low', i) ?? 0,
      cloud_cover_mid: numAt(data.hourly, 'cloud_cover_mid', i) ?? 0,
      cloud_cover_high: numAt(data.hourly, 'cloud_cover_high', i) ?? 0,
      pressureLevels,
    });
  }

  return {
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
    hours,
  };
}

function numAt(
  hourly: Record<string, Array<number | null> | string[]>,
  key: string,
  i: number,
): number | null {
  const arr = hourly[key];
  if (!arr || typeof arr[i] !== 'number') return null;
  return arr[i] as number;
}

/**
 * Para níveis sem geopotential_height, fornece uma altitude aproximada via
 * atmosfera padrão. Usado como fallback no algoritmo de seleção de níveis.
 */
export function altitudeOfLevel(level: PressureLevelData): number {
  return level.geopotentialHeightM ?? pressureToAltitudeM(level.hPa);
}
