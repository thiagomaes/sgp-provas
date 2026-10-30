/**
 * Estatísticas das notas de uma aplicação (RF12), sem banco: usadas pelo
 * ReportsService e pelos testes.
 */

export interface Estatisticas {
  quantidade: number;
  media: number;
  mediana: number;
  /** Desvio padrão populacional: a turma inteira é a população, não uma amostra. */
  desvioPadrao: number;
  maior: number;
  menor: number;
}

function duasCasas(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** null quando ainda não há nenhuma nota. */
export function calcularEstatisticas(notas: number[]): Estatisticas | null {
  if (notas.length === 0) return null;

  const ordenadas = [...notas].sort((a, b) => a - b);
  const quantidade = ordenadas.length;
  const media = ordenadas.reduce((soma, nota) => soma + nota, 0) / quantidade;
  const meio = Math.floor(quantidade / 2);
  const mediana = quantidade % 2 === 0 ? (ordenadas[meio - 1] + ordenadas[meio]) / 2 : ordenadas[meio];
  const variancia = ordenadas.reduce((soma, nota) => soma + (nota - media) ** 2, 0) / quantidade;

  return {
    quantidade,
    media: duasCasas(media),
    mediana: duasCasas(mediana),
    desvioPadrao: duasCasas(Math.sqrt(variancia)),
    maior: ordenadas[quantidade - 1],
    menor: ordenadas[0],
  };
}

/** Média simples, ou null sem notas (a lista de relatórios mostra "—"). */
export function media(notas: number[]): number | null {
  return calcularEstatisticas(notas)?.media ?? null;
}
