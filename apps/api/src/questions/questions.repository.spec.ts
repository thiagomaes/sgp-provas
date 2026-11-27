import type { PrismaService } from '../common/prisma.service.js';
import { QuestionsRepository } from './questions.repository.js';

function criarRepositorio() {
  const tx = {
    alternativa: { deleteMany: vi.fn(), createMany: vi.fn() },
    questao: { update: vi.fn() },
  };
  const prisma = {
    questao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (cliente: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const repositorio = new QuestionsRepository(
    prisma as unknown as PrismaService,
  );
  return { prisma, tx, repositorio };
}

const alternativas = [
  { letra: 'A', texto: 'um', correta: true },
  { letra: 'B', texto: 'dois', correta: false },
];

describe('QuestionsRepository', () => {
  it('lista só as questões do professor que não foram excluídas', async () => {
    const { prisma, repositorio } = criarRepositorio();
    prisma.questao.findMany.mockResolvedValue([]);

    await repositorio.listar('prof-1');

    expect(prisma.questao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { professorId: 'prof-1', deletedAt: null },
      }),
    );
  });

  it('busca por id restringindo ao professor e ignorando excluídas', async () => {
    const { prisma, repositorio } = criarRepositorio();
    prisma.questao.findFirst.mockResolvedValue(null);

    expect(await repositorio.buscar('prof-1', 'q-1')).toBeNull();

    expect(prisma.questao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1', professorId: 'prof-1', deletedAt: null },
      }),
    );
  });

  it('cria a questão ligada ao professor, com as alternativas', async () => {
    const { prisma, repositorio } = criarRepositorio();
    prisma.questao.create.mockResolvedValue({ id: 'q-1' });
    const dados = {
      enunciado: 'x',
      tipo: 'objetiva',
      disciplina: 'Mat',
      tags: [],
    };

    await repositorio.criar('prof-1', dados as never, alternativas);

    expect(prisma.questao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          ...dados,
          professorId: 'prof-1',
          alternativas: { create: alternativas },
        },
      }),
    );
  });

  it('atualiza trocando as alternativas dentro de uma transação', async () => {
    const { prisma, tx, repositorio } = criarRepositorio();
    tx.questao.update.mockResolvedValue({ id: 'q-1' });

    await repositorio.atualizar('q-1', { enunciado: 'novo' }, alternativas);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.alternativa.deleteMany).toHaveBeenCalledWith({
      where: { questaoId: 'q-1' },
    });
    expect(tx.alternativa.createMany).toHaveBeenCalledWith({
      data: alternativas.map((alternativa) => ({
        ...alternativa,
        questaoId: 'q-1',
      })),
    });
    expect(tx.questao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1' },
        data: { enunciado: 'novo' },
      }),
    );
  });

  it('atualiza sem mexer nas alternativas quando elas não vêm', async () => {
    const { tx, repositorio } = criarRepositorio();
    tx.questao.update.mockResolvedValue({ id: 'q-1' });

    await repositorio.atualizar('q-1', { enunciado: 'novo' }, undefined);

    expect(tx.alternativa.deleteMany).not.toHaveBeenCalled();
    expect(tx.alternativa.createMany).not.toHaveBeenCalled();
  });

  it('exclui marcando deletedAt, sem apagar o registro', async () => {
    const { prisma, repositorio } = criarRepositorio();
    prisma.questao.update.mockResolvedValue({ id: 'q-1' });

    await repositorio.marcarComoExcluida('q-1');

    expect(prisma.questao.update).toHaveBeenCalledWith({
      where: { id: 'q-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
