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

describe('ApplicationsService.gerarVersoes', () => {
  const alunosDaTurma = [
    { id: 'aluno-ana', nome: 'Ana', matricula: '001' },
    { id: 'aluno-bia', nome: 'Bia', matricula: '002' },
    { id: 'aluno-caio', nome: 'Caio', matricula: '003' },
  ];

  function servicoParaGerar(alunos = alunosDaTurma) {
    const salvarVersoes = vi.fn(async () => ({
      id: 'aplicacao-1',
      provaId: 'prova-1',
      turmaId: 'turma-1',
      data: new Date('2026-11-20T00:00:00Z'),
      versoes: 0,
      embaralharQuestoes: true,
      embaralharAlternativas: true,
      identificarAluno: true,
      status: 'pdf-gerado',
      corrigidas: 0,
      turma: { _count: { alunos: alunos.length } },
    }));
    const repositorio = {
      buscar: vi.fn(async () => ({ id: 'aplicacao-1', provaId: 'prova-1', turmaId: 'turma-1', status: 'rascunho' })),
      provaDoProfessor: vi.fn(async () => ({
        questoes: [{ questaoId: 'q1', ordem: 1, questao: { alternativas: [{ letra: 'A' }, { letra: 'B' }] } }],
      })),
      alunosDaTurma: vi.fn(async () => alunos),
      salvarVersoes,
    } as unknown as ApplicationsRepository;
    return { servico: new ApplicationsService(repositorio), salvarVersoes };
  }

  const configuracao = { versoes: 2, embaralharQuestoes: true, embaralharAlternativas: true };

  it('gera uma versão por aluno na prova identificada, ignorando a quantidade pedida', async () => {
    const { servico, salvarVersoes } = servicoParaGerar();
    const resposta = await servico.gerarVersoes('prof-1', 'aplicacao-1', { ...configuracao, identificarAluno: true });

    expect(resposta.versoes.map((versao) => versao.aluno?.nome)).toEqual(['Ana', 'Bia', 'Caio']);
    const gravadas = salvarVersoes.mock.calls[0][2] as { alunoId?: string; qrCodePayload: string }[];
    expect(gravadas.map((versao) => versao.alunoId)).toEqual(['aluno-ana', 'aluno-bia', 'aluno-caio']);
    expect(gravadas[1].qrCodePayload).toMatch(/^sgp:aplicacao-1:v2:[0-9a-f]{8}:aaluno-bia$/);
    expect(salvarVersoes.mock.calls[0][1]).toMatchObject({ versoes: 3, identificarAluno: true });
  });

  it('mantém as versões sem aluno quando a prova não é identificada', async () => {
    const { servico, salvarVersoes } = servicoParaGerar();
    const resposta = await servico.gerarVersoes('prof-1', 'aplicacao-1', { ...configuracao, identificarAluno: false });

    expect(resposta.versoes).toHaveLength(2);
    expect(resposta.versoes.every((versao) => versao.aluno === null)).toBe(true);
    const gravadas = salvarVersoes.mock.calls[0][2] as { alunoId?: string; qrCodePayload: string }[];
    expect(gravadas.every((versao) => versao.alunoId === undefined)).toBe(true);
    expect(gravadas[0].qrCodePayload).toMatch(/^sgp:aplicacao-1:v1:[0-9a-f]{8}$/);
  });

  it('recusa a prova identificada quando a turma não tem alunos', async () => {
    const { servico, salvarVersoes } = servicoParaGerar([]);
    await expect(
      servico.gerarVersoes('prof-1', 'aplicacao-1', { ...configuracao, identificarAluno: true }),
    ).rejects.toThrow('A turma não tem alunos');
    expect(salvarVersoes).not.toHaveBeenCalled();
  });

  it('recusa a prova identificada quando a turma passa do limite de versões', async () => {
    const turmaGrande = Array.from({ length: 201 }, (_, indice) => ({
      id: `aluno-${indice}`,
      nome: `Aluno ${indice}`,
      matricula: String(indice),
    }));
    const { servico } = servicoParaGerar(turmaGrande);
    await expect(
      servico.gerarVersoes('prof-1', 'aplicacao-1', { ...configuracao, identificarAluno: true }),
    ).rejects.toThrow('até 200 alunos');
  });
});
