import { calcularNota } from '../corrections/calculo-nota.js';
import { questoesImpressas, type QuestaoDoBanco } from './gabarito-versao.js';
import { montarLayout, type Letra } from './versoes.js';

const banco: QuestaoDoBanco[] = [
  { questaoId: 'q1', tipo: 'objetiva', pontuacao: 2, letraCorreta: 'A' },
  { questaoId: 'q2', tipo: 'objetiva', pontuacao: 3, letraCorreta: 'D' },
  { questaoId: 'q3', tipo: 'discursiva', pontuacao: 5, letraCorreta: null },
];

describe('questoesImpressas', () => {
  it('converte a correta original para a letra impressa', () => {
    const [questao] = questoesImpressas(
      { questoes: [{ questaoId: 'q1', ordem: 1, alternativas: ['C', 'A', 'B'] }] },
      banco,
    );
    expect(questao).toEqual({
      ordem: 1,
      questaoId: 'q1',
      tipo: 'objetiva',
      pontuacao: 2,
      alternativas: ['C', 'A', 'B'],
      corretaImpressa: 'B',
    });
  });

  it('segue a ordem impressa da versão', () => {
    const impressas = questoesImpressas(
      {
        questoes: [
          { questaoId: 'q2', ordem: 2, alternativas: ['D', 'A', 'B', 'C'] },
          { questaoId: 'q1', ordem: 1, alternativas: ['A', 'B'] },
        ],
      },
      banco,
    );
    expect(impressas.map((questao) => [questao.ordem, questao.questaoId, questao.corretaImpressa])).toEqual([
      [1, 'q1', 'A'],
      [2, 'q2', 'A'],
    ]);
  });

  it('discursiva não tem alternativas nem letra correta', () => {
    const [questao] = questoesImpressas({ questoes: [{ questaoId: 'q3', ordem: 1, alternativas: [] }] }, banco);
    expect(questao.alternativas).toEqual([]);
    expect(questao.corretaImpressa).toBeNull();
  });

  it('ignora questão do layout que não está mais na prova', () => {
    const impressas = questoesImpressas(
      { questoes: [{ questaoId: 'sumiu', ordem: 1, alternativas: ['A', 'B'] }] },
      banco,
    );
    expect(impressas).toEqual([]);
  });

  it('marcar a correta impressa de uma versão embaralhada dá nota cheia', () => {
    const letras: Letra[] = ['A', 'B', 'C', 'D', 'E'];
    const versao = (numero: number) =>
      questoesImpressas(
        montarLayout(
          [
            { questaoId: 'q1', ordem: 1, letras },
            { questaoId: 'q2', ordem: 2, letras },
            { questaoId: 'q3', ordem: 3, letras: [] },
          ],
          numero,
          { embaralharQuestoes: true, embaralharAlternativas: true },
          'semente-de-teste',
        ),
        banco,
      );
    // A primeira versão em que alguma correta foi impressa com outra letra: sem
    // isso o teste passaria mesmo sem converter nada.
    const mudouDeLetra = (numero: number) =>
      versao(numero).some(
        (questao) => questao.corretaImpressa && questao.corretaImpressa !== banco.find((b) => b.questaoId === questao.questaoId)?.letraCorreta,
      );
    const numero = [2, 3, 4, 5, 6, 7, 8].find(mudouDeLetra);
    expect(numero).toBeDefined();
    const impressas = versao(numero as number);

    // O que a tela faz ao gravar: letra impressa -> alternativas[posição].
    const respostas = impressas.map((questao) =>
      questao.tipo === 'discursiva'
        ? { questaoId: questao.questaoId, pontuacao: questao.pontuacao }
        : {
            questaoId: questao.questaoId,
            marcada: questao.alternativas[letras.indexOf(questao.corretaImpressa as Letra)],
          },
    );
    const resultado = calcularNota(banco, respostas);

    expect(resultado).toMatchObject({ ok: true, nota: 10 });
  });
});
