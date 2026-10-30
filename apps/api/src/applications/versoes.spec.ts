import { montarLayout, type QuestaoParaVersao } from './versoes.js';

const questoes: QuestaoParaVersao[] = Array.from({ length: 6 }, (_, i) => ({
  questaoId: `q${i + 1}`,
  ordem: i + 1,
  letras: ['A', 'B', 'C', 'D'],
}));
const embaralhando = { embaralharQuestoes: true, embaralharAlternativas: true };

describe('montarLayout', () => {
  it('mantém a versão 1 na ordem original', () => {
    const layout = montarLayout(questoes, 1, embaralhando, 'semente');
    expect(layout.questoes.map((q) => q.questaoId)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    expect(layout.questoes[0].alternativas).toEqual(['A', 'B', 'C', 'D']);
  });

  it('gera sempre o mesmo layout para a mesma semente', () => {
    expect(montarLayout(questoes, 3, embaralhando, 'x')).toEqual(montarLayout(questoes, 3, embaralhando, 'x'));
  });

  it('embaralha sem perder nem repetir questões e alternativas', () => {
    const layout = montarLayout(questoes, 2, embaralhando, 'outra');
    expect(layout.questoes.map((q) => q.questaoId).sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    expect(layout.questoes.map((q) => q.ordem)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const questao of layout.questoes) expect([...questao.alternativas].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('não embaralha quando a opção está desligada', () => {
    const layout = montarLayout(questoes, 2, { embaralharQuestoes: false, embaralharAlternativas: false }, 's');
    expect(layout.questoes.map((q) => q.questaoId)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
  });
});
