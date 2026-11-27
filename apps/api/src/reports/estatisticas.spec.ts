import { calcularEstatisticas, estatisticasPorQuestao, media } from './estatisticas.js';

describe('calcularEstatisticas', () => {
  it('calcula média, mediana e desvio padrão populacional', () => {
    expect(calcularEstatisticas([2, 4, 4, 4, 5, 5, 7, 9])).toEqual({
      quantidade: 8,
      media: 5,
      mediana: 4.5,
      desvioPadrao: 2,
      maior: 9,
      menor: 2,
    });
  });

  it('usa o valor do meio quando a quantidade é ímpar', () => {
    expect(calcularEstatisticas([8.5, 6, 7.5])?.mediana).toBe(7.5);
  });

  it('não depende da ordem das notas', () => {
    expect(calcularEstatisticas([9, 2, 5, 4, 7, 4, 5, 4])).toEqual(calcularEstatisticas([2, 4, 4, 4, 5, 5, 7, 9]));
  });

  it('devolve null sem notas (a tela mostra "—")', () => {
    expect(calcularEstatisticas([])).toBeNull();
    expect(media([])).toBeNull();
  });

  it('arredonda para 2 casas', () => {
    expect(media([7, 8, 8])).toBe(7.67);
  });
});

describe('estatisticasPorQuestao', () => {
  const questoes = [
    { questaoId: 'q2', ordem: 2 },
    { questaoId: 'q1', ordem: 1 },
  ];

  it('calcula o percentual de acerto e a alternativa mais marcada de cada questão', () => {
    const respostas = [
      [{ questaoId: 'q1', marcada: 'B', correta: true }, { questaoId: 'q2', marcada: 'A', correta: false }],
      [{ questaoId: 'q1', marcada: 'C', correta: false }, { questaoId: 'q2', marcada: 'A', correta: false }],
      [{ questaoId: 'q1', marcada: 'B', correta: true }, { questaoId: 'q2', marcada: null, correta: false }],
      [{ questaoId: 'q1', marcada: 'B', correta: true }, { questaoId: 'q2', marcada: 'D', correta: true }],
    ];

    expect(estatisticasPorQuestao(questoes, respostas)).toEqual([
      { questaoId: 'q1', numero: 1, respondidas: 4, percentualAcerto: 75, maisMarcada: 'B' },
      { questaoId: 'q2', numero: 2, respondidas: 4, percentualAcerto: 25, maisMarcada: 'A' },
    ]);
  });

  it('ignora lançamentos manuais, que não têm respostas', () => {
    expect(estatisticasPorQuestao(questoes, [[]])).toEqual([
      { questaoId: 'q1', numero: 1, respondidas: 0, percentualAcerto: null, maisMarcada: null },
      { questaoId: 'q2', numero: 2, respondidas: 0, percentualAcerto: null, maisMarcada: null },
    ]);
  });
});
