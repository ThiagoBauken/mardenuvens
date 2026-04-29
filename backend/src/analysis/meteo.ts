/**
 * Helpers meteorológicos puros.
 *
 * Convenção: temperaturas em °C, pressões em hPa, alturas em metros,
 * velocidades em m/s, umidade relativa em % (0-100).
 */

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Converte pressão (hPa) para altitude geométrica aproximada (m) usando a
 * atmosfera padrão internacional (ISA) — boa o suficiente para detectar o
 * nível imediatamente acima/abaixo do cume quando geopotential_height não
 * estiver disponível.
 */
export function pressureToAltitudeM(pressureHPa: number): number {
  // ISA hipsometric formula:  h = 44330 * (1 - (P/P0)^(1/5.255))
  return 44330 * (1 - Math.pow(pressureHPa / 1013.25, 1 / 5.255));
}

/**
 * Estimativa rápida da base das nuvens convectivas via fórmula de Espy:
 * base_m ≈ 125 * (T - Td)  (para T, Td em °C)
 */
export function estimateCloudBaseM(tempC: number, dewPointC: number): number {
  return Math.max(0, 125 * (tempC - dewPointC));
}

/**
 * Lifted Condensation Level via aproximação de Bolton (1980).
 *
 *   LCL_m = 125 * (T - Td)  é a versão simplificada;
 *   uma versão mais precisa usa a fórmula iterativa, mas Espy é suficiente
 *   para a granularidade desta aplicação. Mantido como função à parte para
 *   poder evoluir sem mudar o restante do código.
 */
export function liftedCondensationLevelM(tempC: number, dewPointC: number): number {
  return estimateCloudBaseM(tempC, dewPointC);
}

/**
 * Magnus-Tetens approximation: dew point a partir de T (°C) e RH (%).
 */
export function magnusDewPoint(tempC: number, rhPct: number): number {
  const a = 17.625;
  const b = 243.04;
  const rh = clamp(rhPct, 0.1, 100) / 100;
  const alpha = Math.log(rh) + (a * tempC) / (b + tempC);
  return (b * alpha) / (a - alpha);
}

/**
 * Lapse rate padrão (taxa de queda da temperatura com altitude em ar seco
 * atmosfericamente "normal"): 6.5 °C por km.
 */
export const STANDARD_LAPSE_RATE_C_PER_KM = 6.5;

/**
 * Temperatura esperada num nível mais alto, dado lapse rate padrão a partir
 * de uma temperatura de referência mais baixa.
 */
export function expectedTempAtAltitude(
  tBelowC: number,
  altBelowM: number,
  altAboveM: number,
): number {
  const dh = (altAboveM - altBelowM) / 1000;
  return tBelowC - STANDARD_LAPSE_RATE_C_PER_KM * dh;
}

/**
 * Média de N números, ignorando undefined.
 */
export function avg(...values: Array<number | undefined | null>): number {
  const xs = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
