import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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

  /** Grava a correção, soma 1 em corrigidas e tira a aplicação de "PDF gerado". */
  criar(dados: Prisma.CorrecaoUncheckedCreateInput, statusAtual: string) {
    return this.prisma.$transaction(async (tx) => {
      const correcao = await tx.correcao.create({ data: dados });
      await tx.aplicacao.update({
        where: { id: dados.aplicacaoId },
        data: {
          corrigidas: { increment: 1 },
          ...(statusAtual === 'pdf-gerado' ? { status: 'em-correcao' } : {}),
        },
      });
      return correcao;
    });
  }

  atualizar(id: string, dados: Prisma.CorrecaoUncheckedUpdateInput) {
    return this.prisma.correcao.update({ where: { id }, data: dados });
  }
}
