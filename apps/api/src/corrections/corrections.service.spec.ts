import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CorrectionsRepository } from './corrections.repository.js';
import { CorrectionsService } from './corrections.service.js';

/** Aplicação com 2 objetivas (A e C certas, 3 pontos cada) e 1 discursiva de 4. */
function aplicacao(status = 'em-correcao') {
  return {
    id: 'apl-1',
    status,
    prova: {
      totalPontos: 10,
      questoes: [
        { questaoId: 'q1', pontuacao: 3, questao: { tipo: 'objetiva', alternativas: [{ letra: 'A', correta: true }, { letra: 'B', correta: false }] } },
        { questaoId: 'q2', pontuacao: 3, questao: { tipo: 'objetiva', alternativas: [{ letra: 'B', correta: false }, { letra: 'C', correta: true }] } },
        { questaoId: 'q3', pontuacao: 4, questao: { tipo: 'discursiva', alternativas: [] } },
      ],
    },
    turma: { alunos: [{ id: 'aluno-1' }, { id: 'aluno-2' }] },
    versoesProva: [{ numeroVersao: 1 }, { numeroVersao: 2 }],
  };
}

function correcao(dados: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'c1',
    aplicacaoId: 'apl-1',
    alunoId: null,
    versao: 1,
    nota: 6,
    respostas: [],
    origem: 'mobile',
    clientCorrectionId: 'cli-1',
    statusSync: 'sincronizada',
    corrigidaEm: new Date('2026-11-27T12:00:00Z'),
    ...dados,
  };
}

function montar(app: ReturnType<typeof aplicacao> | null = aplicacao()) {
  const repositorio = {
    aplicacaoComGabarito: vi.fn().mockResolvedValue(app),
    listar: vi.fn().mockResolvedValue([correcao()]),
    buscar: vi.fn().mockResolvedValue(correcao()),
    buscarPorClientId: vi.fn().mockResolvedValue(null),
    correcaoDoAluno: vi.fn().mockResolvedValue(null),
    criar: vi.fn(async (dados: Record<string, unknown>) => correcao({ ...dados, id: 'nova' })),
    atualizar: vi.fn(async (_a: string, _id: string, dados: Record<string, unknown>) =>
      correcao(Object.fromEntries(Object.entries(dados).filter(([, valor]) => valor !== undefined))),
    ),
    excluir: vi.fn().mockResolvedValue(undefined),
  };
  return { servico: new CorrectionsService(repositorio as unknown as CorrectionsRepository), repositorio };
}

describe('CorrectionsService', () => {
  describe('criar pela câmera', () => {
    it('calcula a nota com o gabarito do banco e grava as respostas corrigidas', async () => {
      const { servico, repositorio } = montar();
      const criada = await servico.criar('prof', 'apl-1', {
        clientCorrectionId: 'cli-9',
        versao: 2,
        respostas: [
          { questaoId: 'q1', marcada: 'A' },
          { questaoId: 'q2', marcada: 'B' },
          { questaoId: 'q3', pontuacao: 2.5 },
        ],
      });
      expect(criada.nota).toBe(5.5);
      expect(repositorio.criar).toHaveBeenCalledWith(
        expect.objectContaining({ versao: 2, nota: 5.5, origem: 'mobile', alunoId: null, aplicacaoId: 'apl-1' }),
        2,
      );
    });

    it('"Ajustar nota" na revisão vale no lugar da calculada', async () => {
      const { servico } = montar();
      const criada = await servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [], nota: 7 });
      expect(criada.nota).toBe(7);
    });

    it('exige a versão, que ela exista e as respostas', async () => {
      const { servico } = montar();
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', respostas: [] })).rejects.toThrow(
        'Informe a versão da prova lida no QR Code.',
      );
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 3, respostas: [] })).rejects.toThrow(
        'A versão 3 não existe nesta aplicação.',
      );
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1 })).rejects.toThrow(
        'Informe as respostas lidas no cartão-resposta.',
      );
    });

    it('recusa questão que não é da prova', async () => {
      const { servico } = montar();
      await expect(
        servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [{ questaoId: 'q9', marcada: 'A' }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('recusa nota ajustada acima do total', async () => {
      const { servico } = montar();
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [], nota: 11 })).rejects.toThrow(
        'A nota deve ficar entre 0 e 10.',
      );
    });

    it('não corrige aplicação ainda em rascunho', async () => {
      const { servico } = montar(aplicacao('rascunho'));
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [] })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('lançamento manual', () => {
    it('grava a nota no aluno', async () => {
      const { servico, repositorio } = montar();
      await servico.criar('prof', 'apl-1', { clientCorrectionId: 'm1', origem: 'manual', alunoId: 'aluno-1', nota: 8.25 });
      expect(repositorio.criar).toHaveBeenCalledWith(expect.objectContaining({ origem: 'manual', alunoId: 'aluno-1', nota: 8.3, versao: 1 }), 2);
    });

    it('exige o aluno e a nota', async () => {
      const { servico } = montar();
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'm', origem: 'manual', nota: 5 })).rejects.toThrow(
        'No lançamento manual, informe o aluno.',
      );
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'm', origem: 'manual', alunoId: 'aluno-1' })).rejects.toThrow(
        'No lançamento manual, informe a nota.',
      );
    });

    it('recusa aluno de outra turma e aluno já corrigido', async () => {
      const { servico, repositorio } = montar();
      await expect(
        servico.criar('prof', 'apl-1', { clientCorrectionId: 'm', origem: 'manual', alunoId: 'de-fora', nota: 5 }),
      ).rejects.toThrow('O aluno informado não é desta turma.');
      repositorio.correcaoDoAluno.mockResolvedValueOnce(correcao({ alunoId: 'aluno-1' }));
      await expect(
        servico.criar('prof', 'apl-1', { clientCorrectionId: 'm', origem: 'manual', alunoId: 'aluno-1', nota: 5 }),
      ).rejects.toThrow('Este aluno já tem uma correção nesta aplicação.');
    });
  });

  describe('reenvio da mesma correção (RF10)', () => {
    it('devolve a que já existe, sem criar outra', async () => {
      const { servico, repositorio } = montar();
      repositorio.buscarPorClientId.mockResolvedValueOnce(correcao({ id: 'antiga' }));
      const devolvida = await servico.criar('prof', 'apl-1', { clientCorrectionId: 'cli-1', versao: 1, respostas: [] });
      expect(devolvida.id).toBe('antiga');
      expect(repositorio.criar).not.toHaveBeenCalled();
    });

    it('recusa o mesmo id usado em outra aplicação', async () => {
      const { servico, repositorio } = montar();
      repositorio.buscarPorClientId.mockResolvedValueOnce(correcao({ aplicacaoId: 'outra' }));
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'cli-1', versao: 1, respostas: [] })).rejects.toThrow(
        'Este clientCorrectionId já foi usado em outra aplicação.',
      );
    });

    it('dois envios ao mesmo tempo: o segundo bate no @unique e devolve o primeiro', async () => {
      const { servico, repositorio } = montar();
      repositorio.criar.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: 'teste' }),
      );
      repositorio.buscarPorClientId.mockResolvedValueOnce(null).mockResolvedValueOnce(correcao({ id: 'primeira' }));
      const devolvida = await servico.criar('prof', 'apl-1', { clientCorrectionId: 'cli-1', versao: 1, respostas: [] });
      expect(devolvida.id).toBe('primeira');
    });

    it('outro erro do banco não é engolido', async () => {
      const { servico, repositorio } = montar();
      repositorio.criar.mockRejectedValueOnce(new Error('banco fora do ar'));
      await expect(servico.criar('prof', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [] })).rejects.toThrow('banco fora do ar');
    });
  });

  describe('listar, editar e excluir', () => {
    it('lista as correções da aplicação do professor', async () => {
      const { servico, repositorio } = montar();
      expect(await servico.listar('prof', 'apl-1', true)).toHaveLength(1);
      expect(repositorio.listar).toHaveBeenCalledWith('apl-1', true);
    });

    it('aplicação de outro professor é 404 em todas as operações', async () => {
      const { servico } = montar(null);
      await expect(servico.listar('prof-b', 'apl-1', false)).rejects.toThrow(NotFoundException);
      await expect(servico.criar('prof-b', 'apl-1', { clientCorrectionId: 'x', versao: 1, respostas: [] })).rejects.toThrow(NotFoundException);
      await expect(servico.atualizar('prof-b', 'apl-1', 'c1', { nota: 1 })).rejects.toThrow(NotFoundException);
      await expect(servico.excluir('prof-b', 'apl-1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('editar a nota muda a origem para manual; a mesma nota não muda', async () => {
      const { servico, repositorio } = montar();
      await servico.atualizar('prof', 'apl-1', 'c1', { nota: 9 });
      expect(repositorio.atualizar).toHaveBeenLastCalledWith('apl-1', 'c1', expect.objectContaining({ nota: 9, origem: 'manual' }), 2);
      await servico.atualizar('prof', 'apl-1', 'c1', { nota: 6 });
      expect(repositorio.atualizar).toHaveBeenLastCalledWith('apl-1', 'c1', expect.objectContaining({ origem: undefined }), 2);
    });

    it('atribui a prova sem identificação a um aluno da turma', async () => {
      const { servico, repositorio } = montar();
      await servico.atualizar('prof', 'apl-1', 'c1', { alunoId: 'aluno-2' });
      expect(repositorio.correcaoDoAluno).toHaveBeenCalledWith('apl-1', 'aluno-2', 'c1');
    });

    it('editar exige aluno ou nota, a correção existente e nota válida', async () => {
      const { servico, repositorio } = montar();
      await expect(servico.atualizar('prof', 'apl-1', 'c1', {})).rejects.toThrow('Informe o aluno e/ou a nota.');
      await expect(servico.atualizar('prof', 'apl-1', 'c1', { nota: -1 })).rejects.toThrow('A nota deve ficar entre 0 e 10.');
      repositorio.buscar.mockResolvedValueOnce(null);
      await expect(servico.atualizar('prof', 'apl-1', 'c9', { nota: 1 })).rejects.toThrow('Correção não encontrada nesta aplicação.');
    });

    it('exclui só correção existente, passando o total de alunos para o status', async () => {
      const { servico, repositorio } = montar();
      await servico.excluir('prof', 'apl-1', 'c1');
      expect(repositorio.excluir).toHaveBeenCalledWith('apl-1', 'c1', 2);
      repositorio.buscar.mockResolvedValueOnce(null);
      await expect(servico.excluir('prof', 'apl-1', 'c9')).rejects.toThrow(NotFoundException);
    });
  });
});
