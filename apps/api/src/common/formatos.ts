/**
 * Conversões para o formato dos tipos da web (apps/web-professor/src/mocks/types.ts).
 */

/** Date → "AAAA-MM-DD", como as datas dos mocks. */
export function dataIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Arredonda para 1 casa decimal (notas e pontuações, ex.: 8.5). */
export function umaCasa(valor: number): number {
  return Math.round(valor * 10) / 10;
}
