import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ApplicationsRepository } from './applications.repository.js';
import { ApplicationsService, versoesPadraoDaTurma } from './applications.service.js';

const turmasDoBanco = [
  { id: 'turma-1', _count: { alunos: 30 } },
  { id: 'turma-2', _count: { alunos: 0 } },
];

function repositorioFalso() {
  const criarVarias = vi.fn(async (aplicacoes: Prisma.AplicacaoUncheckedCreateInput[]) =>
    aplicacoes.map((dados, indice) => ({
      ...dados,
      id: `aplicacao-${indice + 1}`,
      corrigidas: 0,
      createdAt: new Date('2026-11-13T12:00:00Z'),
      turma: { _count: { alunos: turmasDoBanco.find((turma) => turma.id === dados.turmaId)?._count.alunos ?? 0 } },
    })),
  );
  const repositorio = {
    provaDoProfessor: vi.fn(async () => ({ id: 'prova-1', questoes: [] })),
    turmasDoProfessor: vi.fn(async (_professorId: string, ids: string[]) =>
      turmasDoBanco.filter((turma) => ids.includes(turma.id)),
    ),
    criarVarias,
  } as unknown as ApplicationsRepository;
  return { repositorio, criarVarias };
}

describe('ApplicationsService.criar', () => {
  it('cria uma aplicação por turma escolhida', async () => {
    const { repositorio } = repositorioFalso();
    const criadas = await new ApplicationsService(repositorio).criar('prof-1', {
      provaId: 'prova-1',
      turmaIds: ['turma-1', 'turma-2'],
      data: '2026-11-20',
    });
    expect(criadas.map((aplicacao) => [aplicacao.turmaId, aplicacao.versoes, aplicacao.status])).toEqual([
      ['turma-1', 30, 'rascunho'],
      ['turma-2', 1, 'rascunho'],
    ]);
  });

  it('usa a quantidade de versões pedida em todas as turmas', async () => {
    const { repositorio } = repositorioFalso();
    const criadas = await new ApplicationsService(repositorio).criar('prof-1', {
      provaId: 'prova-1',
      turmaIds: ['turma-1', 'turma-2'],
      data: '2026-11-20',
      versoes: 4,
    });
    expect(criadas.map((aplicacao) => aplicacao.versoes)).toEqual([4, 4]);
  });

  it('não cria nenhuma se uma das turmas não é do professor', async () => {
    const { repositorio, criarVarias } = repositorioFalso();
    await expect(
      new ApplicationsService(repositorio).criar('prof-1', {
        provaId: 'prova-1',
        turmaIds: ['turma-1', 'turma-de-outro'],
        data: '2026-11-20',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(criarVarias).not.toHaveBeenCalled();
  });
});

describe('versões padrão da turma', () => {
  it('gera uma versão por aluno, entre 1 e 200', () => {
    expect(versoesPadraoDaTurma(0)).toBe(1);
    expect(versoesPadraoDaTurma(30)).toBe(30);
    expect(versoesPadraoDaTurma(250)).toBe(200);
  });
});
