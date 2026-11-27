import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { QuestionsRepository } from './questions.repository.js';
import { QuestionsService } from './questions.service.js';

const alt = (letra: string, correta = false) => ({ letra, texto: `opção ${letra}`, correta });

function questaoBanco(sobrescrever: Record<string, unknown> = {}) {
  return {
    id: 'q-1',
    enunciado: 'Quanto é 2 + 2?',
    tipo: 'objetiva',
    disciplina: 'Matemática',
    tags: ['soma', 'Basico'],
    respostaEsperada: null,
    pontuacaoMaxima: null,
    criadaEm: new Date('2026-01-10T12:00:00Z'),
    alternativas: [alt('A', true), alt('B')],
    ...sobrescrever,
  };
}

function criarServico() {
  const repo = {
    listar: vi.fn(),
    buscar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    marcarComoExcluida: vi.fn(),
  };
  const servico = new QuestionsService(repo as unknown as QuestionsRepository);
  return { repo, servico };
}

beforeAll(() => {
  Logger.overrideLogger(false); // deixa a saída dos testes limpa
});

describe('QuestionsService.listar', () => {
  const banco = [
    questaoBanco(),
    questaoBanco({ id: 'q-2', enunciado: 'Capital do Brasil?', tags: ['geografia'] }),
  ];

  it('devolve todas as questões do professor sem filtro', async () => {
    const { repo, servico } = criarServico();
    repo.listar.mockResolvedValue(banco);

    const resultado = await servico.listar('prof-1', {});

    expect(repo.listar).toHaveBeenCalledWith('prof-1');
    expect(resultado.map((q) => q.id)).toEqual(['q-1', 'q-2']);
  });

  it('filtra por tag ignorando maiúsculas', async () => {
    const { repo, servico } = criarServico();
    repo.listar.mockResolvedValue(banco);

    const resultado = await servico.listar('prof-1', { tag: ' GEOGRAFIA ' });

    expect(resultado.map((q) => q.id)).toEqual(['q-2']);
  });

  it('busca pelo enunciado e também pelas tags', async () => {
    const { repo, servico } = criarServico();
    repo.listar.mockResolvedValue(banco);

    expect((await servico.listar('prof-1', { busca: 'capital' })).map((q) => q.id)).toEqual(['q-2']);
    expect((await servico.listar('prof-1', { busca: 'soma' })).map((q) => q.id)).toEqual(['q-1']);
    expect(await servico.listar('prof-1', { busca: 'inexistente' })).toEqual([]);
  });

  it('trata tags nulas como lista vazia', async () => {
    const { repo, servico } = criarServico();
    repo.listar.mockResolvedValue([questaoBanco({ tags: null })]);

    const [questao] = await servico.listar('prof-1', {});

    expect(questao.tags).toEqual([]);
  });
});

describe('QuestionsService.buscar', () => {
  it('devolve a questão com as alternativas', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());

    const questao = await servico.buscar('prof-1', 'q-1');

    expect(repo.buscar).toHaveBeenCalledWith('prof-1', 'q-1');
    expect(questao.alternativas).toHaveLength(2);
    expect(typeof questao.criadaEm).toBe('string');
  });

  it('lança NotFoundException quando não existe', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(null);

    await expect(servico.buscar('prof-1', 'x')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('QuestionsService.criar', () => {
  it('limpa espaços e tags repetidas ao gravar objetiva', async () => {
    const { repo, servico } = criarServico();
    repo.criar.mockResolvedValue(questaoBanco());

    await servico.criar('prof-1', {
      enunciado: '  Quanto é 2 + 2? ',
      tipo: 'objetiva',
      disciplina: ' Matemática ',
      tags: [' soma ', 'soma', '', 'x'],
      alternativas: [alt('A', true), alt('B')],
    } as never);

    expect(repo.criar).toHaveBeenCalledWith(
      'prof-1',
      {
        enunciado: 'Quanto é 2 + 2?',
        tipo: 'objetiva',
        disciplina: 'Matemática',
        tags: ['soma', 'x'],
        respostaEsperada: null,
        pontuacaoMaxima: null,
      },
      [alt('A', true), alt('B')],
    );
  });

  it('grava discursiva sem alternativas e com pontuação', async () => {
    const { repo, servico } = criarServico();
    repo.criar.mockResolvedValue(
      questaoBanco({ tipo: 'discursiva', alternativas: [], respostaEsperada: '4', pontuacaoMaxima: 2 }),
    );

    const resposta = await servico.criar('prof-1', {
      enunciado: 'Explique',
      tipo: 'discursiva',
      disciplina: 'Matemática',
      respostaEsperada: '4',
      pontuacaoMaxima: 2,
    } as never);

    expect(repo.criar).toHaveBeenCalledWith(
      'prof-1',
      expect.objectContaining({ respostaEsperada: '4', pontuacaoMaxima: 2, tags: [] }),
      [],
    );
    expect(resposta.alternativas).toBeUndefined();
    expect(resposta.pontuacaoMaxima).toBe(2);
    expect(resposta.respostaEsperada).toBe('4');
  });

  it('recusa discursiva sem pontuação máxima', async () => {
    const { repo, servico } = criarServico();

    await expect(
      servico.criar('prof-1', { enunciado: 'Explique', tipo: 'discursiva', disciplina: 'Mat' } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.criar).not.toHaveBeenCalled();
  });
});

describe('QuestionsService.atualizar', () => {
  it('lança NotFoundException e não grava quando a questão não existe', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(null);

    await expect(servico.atualizar('prof-1', 'x', { enunciado: 'a' } as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it('altera só o enunciado sem mexer nas alternativas', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());
    repo.atualizar.mockResolvedValue(questaoBanco({ enunciado: 'Novo' }));

    const resposta = await servico.atualizar('prof-1', 'q-1', { enunciado: ' Novo ' } as never);

    expect(repo.atualizar).toHaveBeenCalledWith(
      'q-1',
      expect.objectContaining({ enunciado: 'Novo', tipo: 'objetiva', respostaEsperada: null, pontuacaoMaxima: null }),
      undefined,
    );
    expect(resposta.enunciado).toBe('Novo');
  });

  it('recusa alternativas que deixariam a questão inválida', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());

    await expect(
      servico.atualizar('prof-1', 'q-1', { alternativas: [alt('A', true), alt('B', true)] } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.atualizar).not.toHaveBeenCalled();
  });

  it('troca de objetiva para discursiva exigindo pontuação', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());

    await expect(servico.atualizar('prof-1', 'q-1', { tipo: 'discursiva' } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    repo.atualizar.mockResolvedValue(
      questaoBanco({ tipo: 'discursiva', alternativas: [], pontuacaoMaxima: 3, respostaEsperada: 'resp' }),
    );
    await servico.atualizar('prof-1', 'q-1', { tipo: 'discursiva', pontuacaoMaxima: 3, respostaEsperada: 'resp' } as never);

    expect(repo.atualizar).toHaveBeenCalledWith(
      'q-1',
      expect.objectContaining({ tipo: 'discursiva', pontuacaoMaxima: 3, respostaEsperada: 'resp' }),
      [],
    );
  });

  it('troca de discursiva para objetiva com novas alternativas', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(
      questaoBanco({ tipo: 'discursiva', alternativas: [], pontuacaoMaxima: 2, respostaEsperada: 'x' }),
    );
    repo.atualizar.mockResolvedValue(questaoBanco());

    await servico.atualizar('prof-1', 'q-1', { tipo: 'objetiva', alternativas: [alt('A', true), alt('B')] } as never);

    expect(repo.atualizar).toHaveBeenCalledWith(
      'q-1',
      expect.objectContaining({ tipo: 'objetiva', respostaEsperada: null, pontuacaoMaxima: null }),
      [alt('A', true), alt('B')],
    );
  });

  it('limpa as tags enviadas no PATCH', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());
    repo.atualizar.mockResolvedValue(questaoBanco());

    await servico.atualizar('prof-1', 'q-1', { tags: [' a ', 'a'] } as never);

    expect(repo.atualizar).toHaveBeenCalledWith('q-1', expect.objectContaining({ tags: ['a'] }), undefined);
  });
});

describe('QuestionsService.excluir', () => {
  it('marca como excluída (soft-delete)', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(questaoBanco());

    await servico.excluir('prof-1', 'q-1');

    expect(repo.marcarComoExcluida).toHaveBeenCalledWith('q-1');
  });

  it('não exclui questão de outro professor ou inexistente', async () => {
    const { repo, servico } = criarServico();
    repo.buscar.mockResolvedValue(null);

    await expect(servico.excluir('prof-1', 'q-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.marcarComoExcluida).not.toHaveBeenCalled();
  });
});