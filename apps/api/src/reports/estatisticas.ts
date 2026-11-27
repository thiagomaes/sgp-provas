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

/** Acerto de uma questão da prova em todas as provas lidas pela câmera (RF12). */
export interface EstatisticaQuestao {
  questaoId: string;
  /** Posição da questão na prova original (1, 2, 3...). */
  numero: number;
  /** Provas lidas que têm esta questão; lançamentos manuais não entram. */
  respondidas: number;
  /** 0 a 100, ou null sem provas lidas. */
  percentualAcerto: number | null;
  /** Letra original mais marcada; null sem marcação ou na discursiva. */
  maisMarcada: string | null;
}

interface RespostaGravada {
  questaoId: string;
  marcada: string | null;
  correta: boolean;
}

/** Uma linha por questão, na ordem da prova, a partir das respostas gravadas em cada correção. */
export function estatisticasPorQuestao(
  questoes: { questaoId: string; ordem: number }[],
  respostasPorCorrecao: RespostaGravada[][],
): EstatisticaQuestao[] {
  const todas = respostasPorCorrecao.flat();
  return [...questoes]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ questaoId, ordem }) => {
      const daQuestao = todas.filter((resposta) => resposta.questaoId === questaoId);
      const acertos = daQuestao.filter((resposta) => resposta.correta).length;

      const marcacoes = new Map<string, number>();
      for (const { marcada } of daQuestao) {
        if (marcada) marcacoes.set(marcada, (marcacoes.get(marcada) ?? 0) + 1);
      }
      // Empate: fica a letra que apareceu primeiro.
      let maisMarcada: string | null = null;
      for (const [letra, vezes] of marcacoes) {
        if (!maisMarcada || vezes > marcacoes.get(maisMarcada)!) maisMarcada = letra;
      }

      return {
        questaoId,
        numero: ordem,
        respondidas: daQuestao.length,
        percentualAcerto: daQuestao.length ? duasCasas((acertos / daQuestao.length) * 100) : null,
        maisMarcada,
      };
    });
}
