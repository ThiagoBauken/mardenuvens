import type { ClimateProfile } from '../types.js';

export interface ScoreWeights {
  inversion: number;
  humidityBelow: number;
  dryAbove: number;
  lowCover: number;
  skyClearAloft: number;
  wind: number;
  baseBelow: number;
}

export interface ProfileConfig {
  /** Janela horária local em que o fenômeno é mais provável (inclusiva-exclusiva). */
  morningWindow: [number, number];
  weights: ScoreWeights;
  /** Threshold mínimo para considerar uma hora como "candidato" à melhor janela. */
  hourThreshold: number;
  /** Texto curto explicando a particularidade do perfil (vai no UI futuramente). */
  description: string;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  inversion: 0.25,
  humidityBelow: 0.20,
  dryAbove: 0.15,
  lowCover: 0.15,
  skyClearAloft: 0.10,
  wind: 0.10,
  baseBelow: 0.05,
};

export const PROFILES: Record<ClimateProfile, ProfileConfig> = {
  'subtropical-umido': {
    morningWindow: [4, 11],
    weights: DEFAULT_WEIGHTS,
    hourThreshold: 0.50,
    description:
      'Sul do Brasil e serras de SP/MG: mar de nuvens clássico por inversão térmica noturna. Mais comum no outono e inverno.',
  },

  'tropical-de-altitude': {
    morningWindow: [4, 11],
    weights: {
      inversion: 0.22,
      humidityBelow: 0.20,
      dryAbove: 0.16,
      lowCover: 0.16,
      skyClearAloft: 0.12,
      wind: 0.09,
      baseBelow: 0.05,
    },
    hourThreshold: 0.50,
    description:
      'Mantiqueira, Caparaó, Itatiaia, Caraça: combinação de inversão térmica com efeito orográfico em altitudes elevadas.',
  },

  'tropical-litoraneo': {
    morningWindow: [3, 10],
    weights: {
      inversion: 0.18,
      humidityBelow: 0.22,
      dryAbove: 0.12,
      lowCover: 0.20,
      skyClearAloft: 0.13,
      wind: 0.10,
      baseBelow: 0.05,
    },
    hourThreshold: 0.50,
    description:
      'Serra do Mar litorânea e morros costeiros: ar marítimo úmido empurrado pelo relevo, mar de nuvens orográfico.',
  },

  'cerrado-altitude': {
    morningWindow: [4, 10],
    weights: {
      inversion: 0.20,
      humidityBelow: 0.18,
      dryAbove: 0.18,
      lowCover: 0.14,
      skyClearAloft: 0.13,
      wind: 0.12,
      baseBelow: 0.05,
    },
    hourThreshold: 0.50,
    description:
      'Chapadas (Diamantina, Veadeiros, Guimarães, Mesas): ar mais seco, vento e umidade são determinantes. Estação seca é difícil; transição é melhor.',
  },

  semiarido: {
    morningWindow: [4, 9],
    weights: {
      inversion: 0.30,
      humidityBelow: 0.25,
      dryAbove: 0.10,
      lowCover: 0.15,
      skyClearAloft: 0.08,
      wind: 0.07,
      baseBelow: 0.05,
    },
    hourThreshold: 0.55,
    description:
      'Sertão nordestino: mar de nuvens é raríssimo, depende fortemente de inversão noturna em pontos isolados de altitude.',
  },

  'equatorial-amazonico': {
    morningWindow: [3, 9],
    weights: {
      inversion: 0.10,
      humidityBelow: 0.22,
      dryAbove: 0.20,
      lowCover: 0.20,
      skyClearAloft: 0.15,
      wind: 0.08,
      baseBelow: 0.05,
    },
    hourThreshold: 0.50,
    description:
      'Amazônia e tepuis (Neblina, Roraima): nuvens orográficas forçadas dominam, não inversão. Avaliar se o cume estará acima das nuvens orográficas.',
  },

  'subtropical-canion': {
    morningWindow: [4, 11],
    weights: {
      inversion: 0.22,
      humidityBelow: 0.22,
      dryAbove: 0.10,
      lowCover: 0.22,
      skyClearAloft: 0.11,
      wind: 0.08,
      baseBelow: 0.05,
    },
    hourThreshold: 0.50,
    description:
      'Cânions de Aparados da Serra (Itaimbezinho, Fortaleza, Malacara): mar de nuvens DENTRO do cânion. Cobertura baixa alta + cume seco é o ideal.',
  },
};

export function getProfile(climate: ClimateProfile): ProfileConfig {
  return PROFILES[climate];
}
