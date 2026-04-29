import type { BestWindow, DayForecast, Mountain, Verdict } from '../types.js';
import type { HourlyScore } from './seaOfClouds.js';
import { getProfile } from './profiles.js';

/**
 * Agrupa horas por dia local (YYYY-MM-DD) preservando a ordem.
 */
export function groupByLocalDate(scores: HourlyScore[]): Map<string, HourlyScore[]> {
  const out = new Map<string, HourlyScore[]>();
  for (const s of scores) {
    const date = s.time.slice(0, 10);
    let bucket = out.get(date);
    if (!bucket) {
      bucket = [];
      out.set(date, bucket);
    }
    bucket.push(s);
  }
  return out;
}

/**
 * Para cada dia, encontra a melhor janela contígua dentro da janela horária
 * favorável do perfil, classifica e gera a explicação.
 */
export function buildDailyForecasts(
  scores: HourlyScore[],
  mountain: Mountain,
): DayForecast[] {
  const profile = getProfile(mountain.climate);
  const [winStart, winEnd] = profile.morningWindow;
  const days = groupByLocalDate(scores);
  const result: DayForecast[] = [];

  for (const [date, hours] of days) {
    // Filtra apenas horas dentro da janela favorável do dia.
    const inWindow = hours.filter((h) => h.localHour >= winStart && h.localHour < winEnd);

    const best = pickBestWindow(inWindow, profile.hourThreshold);

    // Score representativo do dia: pico se houver janela, senão melhor hora dentro da janela favorável.
    const peakScore = best?.peakScore ?? maxScore(inWindow) ?? maxScore(hours) ?? 0;

    const verdict = classify(peakScore);

    // Hora-pico para gerar reasoning a partir dela.
    const peakHour = pickPeakHour(inWindow.length > 0 ? inWindow : hours);
    const reasoning = peakHour ? buildReasoning(peakHour, mountain) : [];

    result.push({
      date,
      verdict,
      score: round2(peakScore),
      bestWindow: best,
      reasoning,
      raw: peakHour ? peakHour.raw : emptyRaw(),
    });
  }

  return result;
}

function pickBestWindow(hours: HourlyScore[], threshold: number): BestWindow | null {
  if (hours.length === 0) return null;

  // Acha a sequência contígua de horas com score >= threshold de maior pico.
  let bestStartIdx = -1;
  let bestEndIdx = -1;
  let bestPeak = 0;

  let runStart = -1;
  let runPeak = 0;

  for (let i = 0; i < hours.length; i++) {
    const h = hours[i]!;
    if (h.score >= threshold) {
      if (runStart === -1) {
        runStart = i;
        runPeak = h.score;
      } else {
        runPeak = Math.max(runPeak, h.score);
      }
    } else if (runStart !== -1) {
      // Fecha a corrida atual.
      if (runPeak > bestPeak) {
        bestPeak = runPeak;
        bestStartIdx = runStart;
        bestEndIdx = i - 1;
      }
      runStart = -1;
      runPeak = 0;
    }
  }
  // Caso a corrida termine no final do array.
  if (runStart !== -1 && runPeak > bestPeak) {
    bestPeak = runPeak;
    bestStartIdx = runStart;
    bestEndIdx = hours.length - 1;
  }

  if (bestStartIdx === -1) return null;

  const start = hours[bestStartIdx]!;
  const end = hours[bestEndIdx]!;

  return {
    startLocal: formatLocalTime(start.time),
    endLocal: formatLocalTime(addOneHour(end.time)),
    peakScore: round2(bestPeak),
  };
}

function classify(score: number): Verdict {
  if (score >= 0.70) return 'SIM';
  if (score >= 0.55) return 'PROVAVEL';
  if (score >= 0.40) return 'TALVEZ';
  return 'NAO';
}

function pickPeakHour(hours: HourlyScore[]): HourlyScore | null {
  if (hours.length === 0) return null;
  let best: HourlyScore = hours[0]!;
  for (const h of hours) if (h.score > best.score) best = h;
  return best;
}

function maxScore(hours: HourlyScore[]): number | null {
  if (hours.length === 0) return null;
  let m = 0;
  for (const h of hours) if (h.score > m) m = h.score;
  return m;
}

/**
 * Constrói a lista de bullets explicando por que o score do dia é o que é.
 *
 * Pega os componentes mais relevantes (positivos e negativos) e gera frases
 * humanas. A ideia é que o usuário veja "por que" e não só o veredito.
 */
function buildReasoning(peak: HourlyScore, mountain: Mountain): string[] {
  const out: string[] = [];
  const c = peak.components;
  const inv = peak.inversion;
  const layers = peak.layers;

  // Inversão térmica
  if (c.inversion >= 0.7) {
    out.push(
      `Inversão térmica forte: ar acima do cume está ${formatDelta(inv.delta)} mais quente que o esperado pelo decaimento normal.`,
    );
  } else if (c.inversion <= 0.3) {
    out.push('Sem inversão térmica significativa — nuvens devem subir até o cume.');
  }

  // Cobertura baixa + base
  if (c.lowCover >= 0.6 && layers.cloudBaseM < mountain.elevationM - 50) {
    const diff = Math.round(mountain.elevationM - layers.cloudBaseM);
    out.push(
      `Camada de nuvens baixas com base estimada em ~${Math.round(layers.cloudBaseM)}m (${diff}m abaixo do cume).`,
    );
  } else if (c.lowCover <= 0.25) {
    out.push('Pouca nuvem baixa — talvez não exista camada para formar mar de nuvens.');
  }

  // Ar seco acima
  if (c.dryAbove >= 0.6) {
    const rh = peak.raw.aboveLevel?.relativeHumidity ?? 0;
    out.push(`Ar seco acima da camada (RH ${rh}%) — cume deve ficar limpo.`);
  } else if (c.dryAbove <= 0.25) {
    const rh = peak.raw.aboveLevel?.relativeHumidity ?? 0;
    out.push(`Ar úmido em altitude (RH ${rh}%) — cume também deve ficar nublado.`);
  }

  // Nuvens médias/altas
  if (c.skyClearAloft <= 0.3) {
    out.push(
      `Nuvens médias/altas (${peak.raw.cloudCoverMid}% / ${peak.raw.cloudCoverHigh}%) podem cobrir o cume.`,
    );
  }

  // Vento
  if (c.wind >= 0.7) {
    out.push(`Vento fraco (${peak.raw.atLevel?.windSpeed ?? peak.raw.windSurface} m/s) — inversão deve se manter estável.`);
  } else if (c.wind <= 0.3) {
    out.push(`Vento forte (${peak.raw.atLevel?.windSpeed ?? peak.raw.windSurface} m/s) deve dispersar a inversão.`);
  }

  // Garante pelo menos uma frase
  if (out.length === 0) {
    out.push('Condições mistas: alguns ingredientes presentes, outros faltando.');
  }

  // No máximo 4 bullets
  return out.slice(0, 4);
}

function formatDelta(delta: number): string {
  const v = Math.abs(delta);
  return `${v.toFixed(1)}°C`;
}

function formatLocalTime(isoLocal: string): string {
  const m = /T(\d{2}:\d{2})/.exec(isoLocal);
  return m ? m[1]! : '00:00';
}

function addOneHour(isoLocal: string): string {
  // isoLocal vem como "2026-04-29T07:00"
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(isoLocal);
  if (!m) return isoLocal;
  const date = m[1]!;
  const hh = parseInt(m[2]!, 10);
  const mm = m[3]!;
  const next = (hh + 1) % 24;
  return `${date}T${String(next).padStart(2, '0')}:${mm}`;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function emptyRaw(): DayForecast['raw'] {
  return {
    tSurface: 0,
    tdSurface: 0,
    rhSurface: 0,
    windSurface: 0,
    surfacePressure: 0,
    cloudCover: 0,
    cloudCoverLow: 0,
    cloudCoverMid: 0,
    cloudCoverHigh: 0,
    cloudBaseEstM: 0,
    lclM: 0,
    belowLevel: null,
    atLevel: null,
    aboveLevel: null,
  };
}
