/**
 * Regras de uma questão (RF02), sem banco: usadas pelo QuestionsService e
 * pelos testes. Devolvem a mensagem de erro, ou null quando está tudo certo.
 */

export interface QuestaoParaValidar {
  tipo: 'objetiva' | 'discursiva';
  alternativas?: { letra: string; correta: boolean }[];
  pontuacaoMaxima?: number | null;
}

export function validarQuestao(questao: QuestaoParaValidar): string | null {
  if (questao.tipo === 'objetiva') {
    const alternativas = questao.alternativas ?? [];
    if (alternativas.length < 2 || alternativas.length > 5) {
      return 'Questão objetiva precisa ter de 2 a 5 alternativas.';
    }
    const letras = new Set(alternativas.map((alternativa) => alternativa.letra));
    if (letras.size !== alternativas.length) {
      return 'Cada alternativa precisa ter uma letra diferente.';
    }
    const corretas = alternativas.filter((alternativa) => alternativa.correta).length;
    if (corretas !== 1) {
      return 'Questão objetiva precisa ter exatamente uma alternativa correta.';
    }
    return null;
  }

  if ((questao.alternativas ?? []).length > 0) {
    return 'Questão discursiva não tem alternativas.';
  }
  if (!questao.pontuacaoMaxima || questao.pontuacaoMaxima <= 0) {
    return 'Questão discursiva precisa de pontuação máxima maior que zero.';
  }
  return null;
}
