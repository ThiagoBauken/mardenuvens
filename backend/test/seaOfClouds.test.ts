import { describe, it, expect } from 'vitest';
import type { HourlyData, Mountain } from '../src/types.js';
import { scoreHour } from '../src/analysis/seaOfClouds.js';
import { PROFILES } from '../src/analysis/profiles.js';
import { buildDailyForecasts } from '../src/analysis/windowSelect.js';
import { scoreAllHours } from '../src/analysis/seaOfClouds.js';

const cambirela: Mountain = {
  id: 'cambirela',
  name: 'Morro do Cambirela',
  city: 'Palhoça',
  state: 'SC',
  lat: -27.69,
  lon: -48.64,
  elevationM: 880,
  type: 'morro',
  climate: 'subtropical-umido',
};

function makeHour(overrides: Partial<HourlyData> = {}): HourlyData {
  return {
    time: '2026-04-29T07:00',
    temperature_2m: 14,
    dew_point_2m: 13.5,
    relative_humidity_2m: 96,
    wind_speed_10m: 2,
    surface_pressure: 1018,
    cloud_cover: 70,
    cloud_cover_low: 80,
    cloud_cover_mid: 5,
    cloud_cover_high: 5,
    pressureLevels: {
      1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 14, relativeHumidity: 95, windSpeed: 2 },
      925: { hPa: 925, geopotentialHeightM: 760, temperature: 13.5, relativeHumidity: 90, windSpeed: 3 },
      850: { hPa: 850, geopotentialHeightM: 1500, temperature: 18, relativeHumidity: 35, windSpeed: 4 },
      700: { hPa: 700, geopotentialHeightM: 3000, temperature: 8, relativeHumidity: 30, windSpeed: 6 },
      500: { hPa: 500, geopotentialHeightM: 5500, temperature: -7, relativeHumidity: 20, windSpeed: 10 },
    },
    ...overrides,
  };
}

const W = PROFILES['subtropical-umido'].weights;

describe('scoreHour', () => {
  it('classic inversion + high low cover + dry above → high score', () => {
    const result = scoreHour(makeHour(), cambirela, W);
    expect(result.score).toBeGreaterThanOrEqual(0.65);
    expect(result.inversion.score).toBeGreaterThan(0.6);
    expect(result.layers.lowCover).toBeGreaterThan(0.9);
  });

  it('cenário ideal saturado → score >= 0.80 (SIM)', () => {
    const h = makeHour({
      temperature_2m: 12,
      dew_point_2m: 12,
      relative_humidity_2m: 100,
      wind_speed_10m: 1,
      cloud_cover_low: 95,
      cloud_cover_mid: 0,
      cloud_cover_high: 0,
      pressureLevels: {
        1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 12, relativeHumidity: 100, windSpeed: 1 },
        925: { hPa: 925, geopotentialHeightM: 760, temperature: 12, relativeHumidity: 95, windSpeed: 2 },
        850: { hPa: 850, geopotentialHeightM: 1500, temperature: 18, relativeHumidity: 25, windSpeed: 3 },
        700: { hPa: 700, geopotentialHeightM: 3000, temperature: 8, relativeHumidity: 20, windSpeed: 5 },
        500: { hPa: 500, geopotentialHeightM: 5500, temperature: -8, relativeHumidity: 15, windSpeed: 8 },
      },
    });
    const result = scoreHour(h, cambirela, W);
    expect(result.score).toBeGreaterThanOrEqual(0.80);
  });

  it('no inversion (normal lapse) → low inversion score', () => {
    const h = makeHour({
      pressureLevels: {
        1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 14, relativeHumidity: 80, windSpeed: 2 },
        925: { hPa: 925, geopotentialHeightM: 760, temperature: 9, relativeHumidity: 70, windSpeed: 3 },
        850: { hPa: 850, geopotentialHeightM: 1500, temperature: 4, relativeHumidity: 65, windSpeed: 4 },
        700: { hPa: 700, geopotentialHeightM: 3000, temperature: -5, relativeHumidity: 60, windSpeed: 6 },
        500: { hPa: 500, geopotentialHeightM: 5500, temperature: -20, relativeHumidity: 40, windSpeed: 10 },
      },
    });
    const result = scoreHour(h, cambirela, W);
    expect(result.inversion.score).toBeLessThan(0.3);
  });

  it('inversion + low cover but cume úmido + nuvens médias/altas → score reduzido em dryAbove e skyClearAloft', () => {
    const h = makeHour({
      cloud_cover_high: 90,
      cloud_cover_mid: 80,
      pressureLevels: {
        1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 14, relativeHumidity: 95, windSpeed: 2 },
        925: { hPa: 925, geopotentialHeightM: 760, temperature: 13.5, relativeHumidity: 90, windSpeed: 3 },
        850: { hPa: 850, geopotentialHeightM: 1500, temperature: 18, relativeHumidity: 95, windSpeed: 4 },
        700: { hPa: 700, geopotentialHeightM: 3000, temperature: 8, relativeHumidity: 90, windSpeed: 6 },
        500: { hPa: 500, geopotentialHeightM: 5500, temperature: -7, relativeHumidity: 80, windSpeed: 10 },
      },
    });
    const result = scoreHour(h, cambirela, W);
    // Mar de nuvens ainda existe (camada baixa presa por inversão), mas céu nublado em altitude
    // afeta a experiência. Componentes específicos devem cair, score geral fica moderado.
    expect(result.components.dryAbove).toBeLessThan(0.3);
    expect(result.components.skyClearAloft).toBeLessThan(0.2);
    expect(result.score).toBeLessThan(0.8);
  });

  it('strong wind kills the score', () => {
    const h = makeHour({ wind_speed_10m: 15 });
    h.pressureLevels[925]!.windSpeed = 16;
    const result = scoreHour(h, cambirela, W);
    expect(result.components.wind).toBeLessThan(0.2);
  });

  it('low cloud cover with no inversion → low score', () => {
    const h = makeHour({
      cloud_cover_low: 5,
      cloud_cover_mid: 5,
      cloud_cover_high: 5,
      pressureLevels: {
        1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 25, relativeHumidity: 50, windSpeed: 4 },
        925: { hPa: 925, geopotentialHeightM: 760, temperature: 20, relativeHumidity: 45, windSpeed: 5 },
        850: { hPa: 850, geopotentialHeightM: 1500, temperature: 15, relativeHumidity: 40, windSpeed: 6 },
        700: { hPa: 700, geopotentialHeightM: 3000, temperature: 5, relativeHumidity: 30, windSpeed: 8 },
        500: { hPa: 500, geopotentialHeightM: 5500, temperature: -10, relativeHumidity: 20, windSpeed: 12 },
      },
    });
    const result = scoreHour(h, cambirela, W);
    expect(result.score).toBeLessThan(0.45);
  });
});

describe('buildDailyForecasts', () => {
  it('classifies an ideal day as SIM with bestWindow in the morning', () => {
    const hours: HourlyData[] = [];
    for (let h = 0; h < 24; h++) {
      hours.push(
        makeHour({
          time: `2026-04-29T${String(h).padStart(2, '0')}:00`,
        }),
      );
    }
    const scored = scoreAllHours(hours, cambirela);
    const days = buildDailyForecasts(scored, cambirela);
    expect(days).toHaveLength(1);
    const day = days[0]!;
    expect(['SIM', 'PROVAVEL']).toContain(day.verdict);
    expect(day.bestWindow).not.toBeNull();
    expect(day.reasoning.length).toBeGreaterThan(0);
  });

  it('classifies a clear/dry day as NAO', () => {
    const hours: HourlyData[] = [];
    for (let h = 0; h < 24; h++) {
      hours.push(
        makeHour({
          time: `2026-04-29T${String(h).padStart(2, '0')}:00`,
          cloud_cover_low: 5,
          cloud_cover_mid: 5,
          cloud_cover_high: 5,
          pressureLevels: {
            1000: { hPa: 1000, geopotentialHeightM: 110, temperature: 25, relativeHumidity: 50, windSpeed: 4 },
            925: { hPa: 925, geopotentialHeightM: 760, temperature: 20, relativeHumidity: 45, windSpeed: 5 },
            850: { hPa: 850, geopotentialHeightM: 1500, temperature: 15, relativeHumidity: 40, windSpeed: 6 },
            700: { hPa: 700, geopotentialHeightM: 3000, temperature: 5, relativeHumidity: 30, windSpeed: 8 },
            500: { hPa: 500, geopotentialHeightM: 5500, temperature: -10, relativeHumidity: 20, windSpeed: 12 },
          },
        }),
      );
    }
    const scored = scoreAllHours(hours, cambirela);
    const days = buildDailyForecasts(scored, cambirela);
    expect(days[0]!.verdict).toBe('NAO');
  });
});
