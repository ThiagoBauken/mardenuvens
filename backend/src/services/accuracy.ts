import {
  lastSnapshotBefore,
  listEvaluablePairs,
  reportSummary,
} from '../db.js';
import { getMountainById } from '../data/mountains.js';
import type { Verdict } from '../types.js';

const VERDICTS: Verdict[] = ['SIM', 'PROVAVEL', 'TALVEZ', 'NAO'];

interface VerdictBucket {
  count: number;
  /** Soma das taxas de "happened: true" entre os pares avaliados. */
  happenedSum: number;
  /** Acertos: SIM/PROVAVEL → maioria reportou teve; NAO/TALVEZ → maioria não teve. */
  hits: number;
}

interface MountainBucket {
  id: string;
  name: string;
  state: string;
  total: number;
  hits: number;
}

export interface AccuracyByVerdict {
  verdict: Verdict;
  /** Quantos pares (destino,dia) o site classificou assim e têm relatos. */
  count: number;
  /** Taxa média de "happened: true" entre os pares dessa classificação. */
  happenedRate: number | null;
  /** Acurácia binária (predicao ~ realidade). */
  accuracy: number | null;
}

export interface AccuracyByMountain {
  id: string;
  name: string;
  state: string;
  totalEvaluations: number;
  accuracy: number;
}

export interface AccuracyResponse {
  generatedAt: string;
  totalEvaluatedPairs: number;
  overallAccuracy: number | null;
  byVerdict: AccuracyByVerdict[];
  byMountain: AccuracyByMountain[];
  note: string;
}

/**
 * Calcula a acurácia cruzando snapshots de previsão com relatos da galera.
 *
 * Pra cada par (destino, dia) que tem ao menos 1 relato:
 *   1. Pega o snapshot mais recente capturado ATÉ o dia do alvo
 *      (se só houve snapshot capturado no próprio dia, vale também — é a previsão
 *      mais informada disponível).
 *   2. Resume os relatos: `happenedRate = yes / total`.
 *   3. Considera "acerto":
 *        - SIM ou PROVAVEL  E  happenedRate >= 0.5 (maioria diz "teve")
 *        - NAO ou TALVEZ    E  happenedRate <  0.5 (maioria diz "não teve")
 */
export function computeAccuracy(): AccuracyResponse {
  const pairs = listEvaluablePairs();

  const byVerdict = new Map<Verdict, VerdictBucket>(
    VERDICTS.map((v) => [v, { count: 0, happenedSum: 0, hits: 0 }]),
  );
  const byMountain = new Map<string, MountainBucket>();

  let overallTotal = 0;
  let overallHits = 0;

  for (const pair of pairs) {
    const snap = lastSnapshotBefore(pair.mountainId, pair.forDate, pair.forDate);
    if (!snap) continue;
    if (!isVerdict(snap.verdict)) continue;

    const summary = reportSummary(pair.mountainId, pair.forDate);
    if (summary.total === 0) continue;

    const happenedRate = summary.yesCount / summary.total;
    const predictedHappened = snap.verdict === 'SIM' || snap.verdict === 'PROVAVEL';
    const actualHappened = happenedRate >= 0.5;
    const hit = predictedHappened === actualHappened;

    const bucket = byVerdict.get(snap.verdict)!;
    bucket.count++;
    bucket.happenedSum += happenedRate;
    if (hit) bucket.hits++;

    overallTotal++;
    if (hit) overallHits++;

    let mb = byMountain.get(pair.mountainId);
    if (!mb) {
      const m = getMountainById(pair.mountainId);
      mb = {
        id: pair.mountainId,
        name: m?.name ?? pair.mountainId,
        state: m?.state ?? '',
        total: 0,
        hits: 0,
      };
      byMountain.set(pair.mountainId, mb);
    }
    mb.total++;
    if (hit) mb.hits++;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalEvaluatedPairs: overallTotal,
    overallAccuracy: overallTotal > 0 ? overallHits / overallTotal : null,
    byVerdict: VERDICTS.map((v) => {
      const b = byVerdict.get(v)!;
      return {
        verdict: v,
        count: b.count,
        happenedRate: b.count > 0 ? b.happenedSum / b.count : null,
        accuracy: b.count > 0 ? b.hits / b.count : null,
      };
    }),
    byMountain: [...byMountain.values()]
      .map((m) => ({
        id: m.id,
        name: m.name,
        state: m.state,
        totalEvaluations: m.total,
        accuracy: m.total > 0 ? m.hits / m.total : 0,
      }))
      .sort((a, b) => b.totalEvaluations - a.totalEvaluations),
    note:
      overallTotal < 30
        ? 'Amostra pequena — números podem mudar bastante conforme mais relatos chegam.'
        : 'Cálculos baseados em comparação entre previsões salvas na véspera e relatos da comunidade.',
  };
}

function isVerdict(v: string): v is Verdict {
  return v === 'SIM' || v === 'PROVAVEL' || v === 'TALVEZ' || v === 'NAO';
}
