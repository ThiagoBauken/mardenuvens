export type Verdict = 'SIM' | 'PROVAVEL' | 'TALVEZ' | 'NAO';

export type DestinationType =
  | 'morro'
  | 'pico'
  | 'serra'
  | 'canion'
  | 'chapada'
  | 'mirante'
  | 'tepui'
  | 'pedra';

export interface MountainPublic {
  id: string;
  name: string;
  city: string;
  state: string;
  elevationM: number;
  type: DestinationType;
  tags: string[];
}

export interface BestWindow {
  startLocal: string;
  endLocal: string;
  peakScore: number;
}

export interface PressureLevelSnapshot {
  hPa: number;
  altitudeM: number;
  temperature: number;
  relativeHumidity: number;
  windSpeed?: number;
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

export interface DayForecast {
  date: string;
  verdict: Verdict;
  score: number;
  bestWindow: BestWindow | null;
  reasoning: string[];
  raw: RawMetrics;
}

export interface ForecastResponse {
  mountain: MountainPublic & { lat: number; lon: number };
  model: string;
  generatedAt: string;
  days: DayForecast[];
}

export interface Report {
  id: number;
  mountainId: string;
  reportDate: string;
  happened: boolean;
  comment: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface ReportSummary {
  yes: number;
  no: number;
}

export interface ReportsForDateResponse {
  reports: Report[];
  summary: ReportSummary;
}

export interface NewReport {
  mountainId: string;
  reportDate: string;
  happened: boolean;
  comment?: string;
  authorName?: string;
}

export interface HighlightItem {
  mountain: MountainPublic;
  bestDay: {
    date: string;
    verdict: Verdict;
    score: number;
    bestWindow: BestWindow | null;
  };
}

export interface HighlightsResponse {
  generatedAt: string;
  count: number;
  destinations: HighlightItem[];
}
