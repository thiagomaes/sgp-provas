import { calcularNota, type QuestaoDoGabarito } from './calculo-nota.js';

// Mesma estrutura da "Avaliação Bimestral 1" do seed: 2 + 2 + 1,5 + 1,5 + 1 + 2 = 10.
const gabarito: QuestaoDoGabarito[] = [
  { questaoId: 'q1', pontuacao: 2, tipo: 'objetiva', letraCorreta: 'B' },
  { questaoId: 'q2', pontuacao: 2, tipo: 'objetiva', letraCorreta: 'A' },
  { questaoId: 'q3', pontuacao: 1.5, tipo: 'objetiva', letraCorreta: 'C' },
  { questaoId: 'q4', pontuacao: 1.5, tipo: 'objetiva', letraCorreta: 'D' },
  { questaoId: 'q6', pontuacao: 1, tipo: 'objetiva', letraCorreta: 'A' },
  { questaoId: 'q5', pontuacao: 2, tipo: 'discursiva', letraCorreta: null },
];

const todasCertas = [
  { questaoId: 'q1', marcada: 'B' as const },
  { questaoId: 'q2', marcada: 'A' as const },
  { questaoId: 'q3', marcada: 'C' as const },
  { questaoId: 'q4', marcada: 'D' as const },
  { questaoId: 'q6', marcada: 'A' as const },
  { questaoId: 'q5', pontuacao: 2 },
];

describe('calcularNota', () => {
  it('dá a nota máxima quando acerta tudo', () => {
    const resultado = calcularNota(gabarito, todasCertas);
    expect(resultado.ok && resultado.nota).toBe(10);
  });

  it('tira só a pontuação da questão errada (8,5 da Beatriz no mockup)', () => {
    const lidas = todasCertas.map((r) => (r.questaoId === 'q3' ? { questaoId: 'q3', marcada: 'A' as const } : r));
    const resultado = calcularNota(gabarito, lidas);
    expect(resultado.ok && resultado.nota).toBe(8.5);
    expect(resultado.ok && resultado.respostas.find((r) => r.questaoId === 'q3')).toEqual({
      questaoId: 'q3',
      marcada: 'A',
      correta: false,
      pontuacao: 0,
    });
  });

  it('conta questão em branco ou sem resposta como 0', () => {
    const resultado = calcularNota(gabarito, [{ questaoId: 'q1', marcada: null }]);
    expect(resultado.ok && resultado.nota).toBe(0);
    expect(resultado.ok && resultado.respostas).toHaveLength(6);
  });

  it('limita a pontuação da discursiva entre 0 e o valor da questão', () => {
    const acima = calcularNota(gabarito, [{ questaoId: 'q5', pontuacao: 9 }]);
    expect(acima.ok && acima.nota).toBe(2);
    const parcial = calcularNota(gabarito, [{ questaoId: 'q5', pontuacao: 1 }]);
    expect(parcial.ok && parcial.respostas.find((r) => r.questaoId === 'q5')).toMatchObject({
      correta: false,
      pontuacao: 1,
    });
  });

  it('recusa resposta de questão que não é da prova', () => {
    const resultado = calcularNota(gabarito, [{ questaoId: 'outra', marcada: 'A' }]);
    expect(resultado).toEqual({ ok: false, erro: 'A questão outra não faz parte desta prova.' });
  });
});
