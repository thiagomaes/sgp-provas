/**
 * Gabarito de uma versão como ela foi impressa (RF08), sem banco: usado pelo
 * ApplicationsService e pelos testes.
 *
 * A tela de correção marca as letras impressas no cartão; para gravar, ela
 * converte cada uma para a letra original com `alternativas[posição]`
 * (docs/arquitetura/cartao-resposta.md, seção 8).
 */
import type { LayoutVersao, Letra } from './versoes.js';

export const LETRAS_IMPRESSAS: readonly Letra[] = ['A', 'B', 'C', 'D', 'E'];

/** Uma questão da prova, com o gabarito original do banco. */
export interface QuestaoDoBanco {
  questaoId: string;
  tipo: 'objetiva' | 'discursiva';
  pontuacao: number;
  /** Letra original da alternativa correta; null nas discursivas. */
  letraCorreta: Letra | null;
}

export interface QuestaoImpressa {
  ordem: number;
  questaoId: string;
  tipo: 'objetiva' | 'discursiva';
  pontuacao: number;
  /** Letra original de cada alternativa, na ordem impressa (A, B, C...). */
  alternativas: Letra[];
  /** Letra da alternativa correta como foi impressa; null nas discursivas. */
  corretaImpressa: Letra | null;
}

export function questoesImpressas(layout: LayoutVersao, questoes: QuestaoDoBanco[]): QuestaoImpressa[] {
  const porId = new Map(questoes.map((questao) => [questao.questaoId, questao]));

  return [...layout.questoes]
    .sort((a, b) => a.ordem - b.ordem)
    .flatMap((item) => {
      const questao = porId.get(item.questaoId);
      if (!questao) return [];
      const posicao = questao.letraCorreta ? item.alternativas.indexOf(questao.letraCorreta) : -1;
      return [
        {
          ordem: item.ordem,
          questaoId: item.questaoId,
          tipo: questao.tipo,
          pontuacao: questao.pontuacao,
          alternativas: questao.tipo === 'objetiva' ? [...item.alternativas] : [],
          corretaImpressa: questao.tipo === 'objetiva' && posicao >= 0 ? LETRAS_IMPRESSAS[posicao] : null,
        },
      ];
    });
}
