export type ClimateProfile =
  | 'subtropical-umido'
  | 'tropical-de-altitude'
  | 'tropical-litoraneo'
  | 'cerrado-altitude'
  | 'semiarido'
  | 'equatorial-amazonico'
  | 'subtropical-canion';

export type DestinationType =
  | 'morro'
  | 'pico'
  | 'serra'
  | 'canion'
  | 'chapada'
  | 'mirante'
  | 'tepui'
  | 'pedra';

export interface Mountain {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  elevationM: number;
  type: DestinationType;
  climate: ClimateProfile;
  tags?: string[];
  notes?: string;
}

export interface MountainPublic {
  id: string;
  name: string;
  city: string;
  state: string;
  elevationM: number;
  type: DestinationType;
  tags: string[];
}

export type Verdict = 'SIM' | 'PROVAVEL' | 'TALVEZ' | 'NAO';

export interface BestWindow {
  startLocal: string;
  endLocal: string;
  peakScore: number;
}

export interface DayForecast {
  date: string;
  verdict: Verdict;
  score: number;
  bestWindow: BestWindow | null;
  reasoning: string[];
  raw: RawMetrics;
}

export interface RawMetrics {
  tSurface: number;
  tdSurface: number;
  rhSurface: number;
  windSurface: number;
  surfacePressure: number;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverMid: number;
  cloudCoverHigh: number;
  cloudBaseEstM: number;
  lclM: number;
  belowLevel: PressureLevelSnapshot | null;
  atLevel: PressureLevelSnapshot | null;
  aboveLevel: PressureLevelSnapshot | null;
}

export interface PressureLevelSnapshot {
  hPa: number;
  altitudeM: number;
  temperature: number;
  relativeHumidity: number;
  windSpeed?: number;
}

export interface ForecastResponse {
  mountain: MountainPublic & { lat: number; lon: number };
  model: string;
  generatedAt: string;
  days: DayForecast[];
}

export interface HourlyData {
  time: string;
  temperature_2m: number;
  dew_point_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  surface_pressure: number;
  cloud_cover: number;
  cloud_cover_low: number;
  cloud_cover_mid: number;
  cloud_cover_high: number;
  pressureLevels: Record<number, PressureLevelData>;
}

export interface PressureLevelData {
  hPa: number;
  geopotentialHeightM: number | null;
  temperature: number;
  relativeHumidity: number;
  windSpeed: number | null;
}

export interface ParsedForecast {
  timezone: string;
  utcOffsetSeconds: number;
  hours: HourlyData[];
}
