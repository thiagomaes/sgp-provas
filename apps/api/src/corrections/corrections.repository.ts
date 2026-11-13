import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { statusPelasCorrecoes } from '../applications/status-aplicacao.js';
import { PrismaService } from '../common/prisma.service.js';

/** Acesso ao banco de correções. A aplicação sempre é buscada pelo professor. */
@Injectable()
export class CorrectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Aplicação com o gabarito, os alunos da turma e as versões geradas. */
  aplicacaoComGabarito(professorId: string, aplicacaoId: string) {
    return this.prisma.aplicacao.findFirst({
      where: { id: aplicacaoId, professorId },
      include: {
        prova: {
          include: {
            questoes: {
              orderBy: { ordem: 'asc' },
              include: { questao: { select: { tipo: true, alternativas: { select: { letra: true, correta: true } } } } },
            },
          },
        },
        turma: { select: { alunos: { select: { id: true } } } },
        versoesProva: { select: { numeroVersao: true } },
      },
    });
  }

  listar(aplicacaoId: string, somenteSemAluno: boolean) {
    return this.prisma.correcao.findMany({
      where: { aplicacaoId, ...(somenteSemAluno ? { alunoId: null } : {}) },
      orderBy: [{ corrigidaEm: 'asc' }, { id: 'asc' }],
    });
  }

  buscar(aplicacaoId: string, id: string) {
    return this.prisma.correcao.findFirst({ where: { id, aplicacaoId } });
  }

  buscarPorClientId(clientCorrectionId: string) {
    return this.prisma.correcao.findUnique({ where: { clientCorrectionId } });
  }

  /** Correção que o aluno já tem nesta aplicação (fora a que está sendo editada). */
  correcaoDoAluno(aplicacaoId: string, alunoId: string, exceto?: string) {
    return this.prisma.correcao.findFirst({
      where: { aplicacaoId, alunoId, ...(exceto ? { id: { not: exceto } } : {}) },
      select: { id: true },
    });
  }

  criar(dados: Prisma.CorrecaoUncheckedCreateInput, totalAlunos: number) {
    return this.prisma.$transaction(async (tx) => {
      const correcao = await tx.correcao.create({ data: dados });
      await atualizarContagem(tx, dados.aplicacaoId, { increment: 1 }, totalAlunos);
      return correcao;
    });
  }

  atualizar(id: string, dados: Prisma.CorrecaoUncheckedUpdateInput) {
    return this.prisma.correcao.update({ where: { id }, data: dados });
  }

  excluir(aplicacaoId: string, id: string, totalAlunos: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.correcao.delete({ where: { id } });
      await atualizarContagem(tx, aplicacaoId, { decrement: 1 }, totalAlunos);
    });
  }
}

async function atualizarContagem(
  tx: Prisma.TransactionClient,
  aplicacaoId: string,
  variacao: Prisma.IntFieldUpdateOperationsInput,
  totalAlunos: number,
) {
  const aplicacao = await tx.aplicacao.update({ where: { id: aplicacaoId }, data: { corrigidas: variacao } });
  const status = statusPelasCorrecoes(aplicacao.corrigidas, totalAlunos);
  if (status !== aplicacao.status) {
    await tx.aplicacao.update({ where: { id: aplicacaoId }, data: { status } });
  }
}
