import { montarGabarito, type AplicacaoParaGabarito } from './gabarito.js';

function aplicacaoDeExemplo(): AplicacaoParaGabarito {
  return {
    data: new Date('2026-11-27T00:00:00Z'),
    turma: { nome: '3º A' },
    prova: {
      titulo: 'Prova de Matemática',
      questoes: [
        {
          questaoId: 'q1',
          pontuacao: 2,
          questao: {
            tipo: 'objetiva',
            respostaEsperada: null,
            alternativas: [
              { letra: 'A', correta: false },
              { letra: 'B', correta: true },
              { letra: 'C', correta: false },
            ],
          },
        },
        {
          questaoId: 'q2',
          pontuacao: 3,
          questao: { tipo: 'discursiva', respostaEsperada: 'Explicar o teorema.', alternativas: [] },
        },
      ],
    },
    versoesProva: [
      {
        numeroVersao: 1,
        aluno: null,
        layout: {
          questoes: [
            { questaoId: 'q1', ordem: 1, alternativas: ['A', 'B', 'C'] },
            { questaoId: 'q2', ordem: 2, alternativas: [] },
          ],
        },
      },
      {
        numeroVersao: 2,
        aluno: { nome: 'Ana Souza', matricula: '2026001' },
        layout: {
          questoes: [
            { questaoId: 'q2', ordem: 1, alternativas: [] },
            { questaoId: 'q1', ordem: 2, alternativas: ['C', 'A', 'B'] },
          ],
        },
      },
    ],
  };
}

describe('montarGabarito', () => {
  it('copia o título, a turma e a data da aplicação', () => {
    const gabarito = montarGabarito(aplicacaoDeExemplo());
    expect(gabarito).toMatchObject({
      tituloDaProva: 'Prova de Matemática',
      nomeDaTurma: '3º A',
      data: '2026-11-27',
    });
  });

  it('mostra a letra impressa da alternativa correta na versão sem embaralhar', () => {
    const [versao1] = montarGabarito(aplicacaoDeExemplo()).versoes;
    expect(versao1.questoes[0]).toMatchObject({ ordem: 1, tipo: 'objetiva', letraCorreta: 'B', pontuacao: 2 });
  });

  it('acompanha o embaralhamento: a correta muda de letra e de posição na versão 2', () => {
    const [, versao2] = montarGabarito(aplicacaoDeExemplo()).versoes;
    expect(versao2.questoes.map((item) => [item.ordem, item.letraCorreta])).toEqual([
      [1, null],
      [2, 'C'],
    ]);
  });

  it('leva a resposta esperada da discursiva e nenhuma letra', () => {
    const [versao1] = montarGabarito(aplicacaoDeExemplo()).versoes;
    expect(versao1.questoes[1]).toEqual({
      ordem: 2,
      tipo: 'discursiva',
      letraCorreta: null,
      respostaEsperada: 'Explicar o teorema.',
      pontuacao: 3,
    });
  });

  it('identifica o aluno da versão quando a prova é identificada', () => {
    const [versao1, versao2] = montarGabarito(aplicacaoDeExemplo()).versoes;
    expect(versao1.aluno).toBeNull();
    expect(versao2.aluno).toEqual({ nome: 'Ana Souza', matricula: '2026001' });
  });
});
