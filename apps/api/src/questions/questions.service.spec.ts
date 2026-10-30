import { BadRequestException } from '@nestjs/common';
import type { QuestionsRepository } from './questions.repository.js';
import { QuestionsService } from './questions.service.js';
import { validarQuestao } from './validacao-questao.js';

const alternativa = (letra: string, correta = false) => ({ letra, texto: `opção ${letra}`, correta });

describe('validarQuestao', () => {
  it('aceita objetiva com 2 a 5 alternativas e uma correta', () => {
    expect(validarQuestao({ tipo: 'objetiva', alternativas: [alternativa('A', true), alternativa('B')] })).toBeNull();
    expect(
      validarQuestao({ tipo: 'objetiva', alternativas: ['A', 'B', 'C', 'D', 'E'].map((l) => alternativa(l, l === 'C')) }),
    ).toBeNull();
  });

  it('recusa objetiva com menos de 2 ou mais de 5 alternativas', () => {
    expect(validarQuestao({ tipo: 'objetiva', alternativas: [alternativa('A', true)] })).toMatch(/2 a 5/);
    const seis = ['A', 'B', 'C', 'D', 'E', 'F'].map((l) => alternativa(l, l === 'A'));
    expect(validarQuestao({ tipo: 'objetiva', alternativas: seis })).toMatch(/2 a 5/);
  });

  it('recusa objetiva sem correta ou com mais de uma correta', () => {
    expect(validarQuestao({ tipo: 'objetiva', alternativas: [alternativa('A'), alternativa('B')] })).toMatch(
      /exatamente uma/,
    );
    expect(
      validarQuestao({ tipo: 'objetiva', alternativas: [alternativa('A', true), alternativa('B', true)] }),
    ).toMatch(/exatamente uma/);
  });

  it('recusa letras repetidas', () => {
    expect(validarQuestao({ tipo: 'objetiva', alternativas: [alternativa('A', true), alternativa('A')] })).toMatch(
      /letra diferente/,
    );
  });

  it('exige pontuação máxima na discursiva e não aceita alternativas', () => {
    expect(validarQuestao({ tipo: 'discursiva', pontuacaoMaxima: 2 })).toBeNull();
    expect(validarQuestao({ tipo: 'discursiva' })).toMatch(/pontuação máxima/);
    expect(validarQuestao({ tipo: 'discursiva', pontuacaoMaxima: 2, alternativas: [alternativa('A', true)] })).toMatch(
      /não tem alternativas/,
    );
  });
});

describe('QuestionsService', () => {
  it('não grava questão objetiva inválida', async () => {
    const criar = vi.fn();
    const servico = new QuestionsService({ criar } as unknown as QuestionsRepository);

    await expect(
      servico.criar('prof-1', {
        enunciado: '2 + 2?',
        tipo: 'objetiva',
        disciplina: 'Matemática',
        alternativas: [alternativa('A', true), alternativa('B', true)] as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(criar).not.toHaveBeenCalled();
  });
});
