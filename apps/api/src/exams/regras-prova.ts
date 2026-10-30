/**
 * Regras da montagem de prova (RF04), sem banco: usadas pelo ExamsService e
 * pelos testes.
 */

export const MAXIMO_DE_QUESTOES = 20;

export interface ItemDaProva {
  questaoId: string;
  ordem?: number;
  pontuacao: number;
}

/** Devolve a mensagem de erro, ou null quando a lista é válida. */
export function validarItensDaProva(itens: ItemDaProva[]): string | null {
  if (itens.length === 0) return 'A prova precisa ter pelo menos uma questão.';
  if (itens.length > MAXIMO_DE_QUESTOES) {
    return `A prova pode ter no máximo ${MAXIMO_DE_QUESTOES} questões (recebidas: ${itens.length}).`;
  }
  if (new Set(itens.map((item) => item.questaoId)).size !== itens.length) {
    return 'A mesma questão aparece mais de uma vez na prova.';
  }
  return null;
}

/** Ordena pela ordem informada (ou pela posição na lista) e numera de 1 a N. */
export function normalizarOrdem<T extends ItemDaProva>(itens: T[]): (T & { ordem: number })[] {
  return itens
    .map((item, indice) => ({ item, chave: item.ordem ?? indice + 1, indice }))
    .sort((a, b) => a.chave - b.chave || a.indice - b.indice)
    .map(({ item }, posicao) => ({ ...item, ordem: posicao + 1 }));
}

/** Soma das pontuações, com 2 casas (ex.: 1,5 + 2,25). */
export function calcularTotalPontos(itens: ItemDaProva[]): number {
  return Math.round(itens.reduce((soma, item) => soma + item.pontuacao, 0) * 100) / 100;
}
