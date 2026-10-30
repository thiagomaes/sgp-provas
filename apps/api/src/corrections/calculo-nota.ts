/**
 * Cálculo da nota de uma prova lida (RF08), sem banco: usado pelo
 * CorrectionsService e pelos testes.
 */

export type Letra = 'A' | 'B' | 'C' | 'D' | 'E';

/** Uma questão da prova, com o gabarito. */
export interface QuestaoDoGabarito {
  questaoId: string;
  pontuacao: number;
  tipo: 'objetiva' | 'discursiva';
  /** Letra original da alternativa correta; null nas discursivas. */
  letraCorreta: Letra | null;
}

export interface RespostaLida {
  questaoId: string;
  marcada?: Letra | null;
  /** Discursivas: pontos dados pelo professor. */
  pontuacao?: number;
}

/** Mesmo formato do tipo CorrectionAnswer da web. */
export interface RespostaCorrigida {
  questaoId: string;
  marcada: Letra | null;
  correta: boolean;
  pontuacao: number;
}

export type ResultadoCorrecao =
  | { ok: true; respostas: RespostaCorrigida[]; nota: number }
  | { ok: false; erro: string };

function umaCasa(valor: number): number {
  return Math.round(valor * 10) / 10;
}

/**
 * Objetiva: vale a pontuação inteira se a marcada for a correta, senão 0.
 * Discursiva: vale o que o professor deu, de 0 até a pontuação da questão.
 * Questão sem resposta conta como em branco (0 ponto).
 */
export function calcularNota(gabarito: QuestaoDoGabarito[], lidas: RespostaLida[]): ResultadoCorrecao {
  const daProva = new Set(gabarito.map((questao) => questao.questaoId));
  const intrusa = lidas.find((resposta) => !daProva.has(resposta.questaoId));
  if (intrusa) return { ok: false, erro: `A questão ${intrusa.questaoId} não faz parte desta prova.` };

  const porQuestao = new Map(lidas.map((resposta) => [resposta.questaoId, resposta]));
  const respostas = gabarito.map((questao): RespostaCorrigida => {
    const lida = porQuestao.get(questao.questaoId);

    if (questao.tipo === 'discursiva') {
      const pontos = Math.min(Math.max(lida?.pontuacao ?? 0, 0), questao.pontuacao);
      return { questaoId: questao.questaoId, marcada: null, correta: pontos === questao.pontuacao, pontuacao: pontos };
    }

    const marcada = lida?.marcada ?? null;
    const correta = marcada !== null && marcada === questao.letraCorreta;
    return { questaoId: questao.questaoId, marcada, correta, pontuacao: correta ? questao.pontuacao : 0 };
  });

  const nota = umaCasa(respostas.reduce((soma, resposta) => soma + resposta.pontuacao, 0));
  return { ok: true, respostas, nota };
}
