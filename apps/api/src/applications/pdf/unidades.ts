export const PONTOS_POR_MM = 72 / 25.4;
export const LARGURA_A4_MM = 210;
export const ALTURA_A4_MM = 297;

export function mmParaPontos(milimetros: number): number {
  return milimetros * PONTOS_POR_MM;
}

export function yDoPdf(yEmMm: number): number {
  return mmParaPontos(ALTURA_A4_MM - yEmMm);
}
