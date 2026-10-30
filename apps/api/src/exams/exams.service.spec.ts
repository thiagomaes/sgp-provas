import { BadRequestException } from '@nestjs/common';
import type { ExamsRepository } from './exams.repository.js';
import { ExamsService } from './exams.service.js';
import { calcularTotalPontos, normalizarOrdem, validarItensDaProva } from './regras-prova.js';

const itens = (quantidade: number) =>
  Array.from({ length: quantidade }, (_, i) => ({ questaoId: `questao-${i + 1}`, pontuacao: 0.5 }));

describe('regras da prova', () => {
  it('aceita até 20 questões e recusa a 21ª', () => {
    expect(validarItensDaProva(itens(20))).toBeNull();
    expect(validarItensDaProva(itens(21))).toMatch(/no máximo 20/);
  });

  it('recusa prova vazia e questão repetida', () => {
    expect(validarItensDaProva([])).toMatch(/pelo menos uma/);
    expect(validarItensDaProva([...itens(2), itens(1)[0]])).toMatch(/mais de uma vez/);
  });

  it('soma as pontuações com 2 casas', () => {
    expect(calcularTotalPontos([{ questaoId: 'a', pontuacao: 1.5 }, { questaoId: 'b', pontuacao: 2.25 }])).toBe(3.75);
    expect(calcularTotalPontos(itens(20))).toBe(10);
  });

  it('renumera a ordem de 1 a N respeitando a ordem pedida', () => {
    const ordenados = normalizarOrdem([
      { questaoId: 'c', ordem: 9, pontuacao: 1 },
      { questaoId: 'a', ordem: 2, pontuacao: 1 },
      { questaoId: 'b', pontuacao: 1 },
    ]);
    expect(ordenados.map((item) => [item.questaoId, item.ordem])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });
});

describe('ExamsService', () => {
  const repositorioFalso = (idsDoProfessor: string[]) => {
    const criar = vi.fn(async (_professorId, dados, questoes) => ({
      id: 'prova-nova',
      ...dados,
      criadaEm: new Date('2026-10-30T12:00:00Z'),
      questoes,
    }));
    const repositorio = {
      idsDeQuestoesDoProfessor: vi.fn(async (_p: string, ids: string[]) =>
        ids.filter((id) => idsDoProfessor.includes(id)).map((id) => ({ id })),
      ),
      criar,
    } as unknown as ExamsRepository;
    return { repositorio, criar };
  };

  it('recusa mais de 20 questões sem consultar o banco', async () => {
    const { repositorio, criar } = repositorioFalso([]);
    await expect(
      new ExamsService(repositorio).criar('prof-1', { titulo: 'P', disciplina: 'M', questoes: itens(21) }),
    ).rejects.toThrow(/no máximo 20/);
    expect(repositorio.idsDeQuestoesDoProfessor).not.toHaveBeenCalled();
    expect(criar).not.toHaveBeenCalled();
  });

  it('recusa questão que não é do professor', async () => {
    const { repositorio, criar } = repositorioFalso(['questao-1']);
    await expect(
      new ExamsService(repositorio).criar('prof-1', { titulo: 'P', disciplina: 'M', questoes: itens(2) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(criar).not.toHaveBeenCalled();
  });

  it('calcula o totalPontos ao criar', async () => {
    const { repositorio } = repositorioFalso(['questao-1', 'questao-2']);
    const prova = await new ExamsService(repositorio).criar('prof-1', {
      titulo: 'P',
      disciplina: 'M',
      questoes: [
        { questaoId: 'questao-1', pontuacao: 6 },
        { questaoId: 'questao-2', pontuacao: 4 },
      ],
    });
    expect(prova.totalPontos).toBe(10);
    expect(prova.questoes.map((q) => q.ordem)).toEqual([1, 2]);
  });
});
