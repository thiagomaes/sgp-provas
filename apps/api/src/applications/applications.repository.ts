import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { incluirTotalDeAlunos, type AplicacaoComTotal } from './aplicacao.mapper.js';

/** Acesso ao banco de aplicações e versões. Toda consulta filtra pelo professor. */
@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(professorId: string): Promise<AplicacaoComTotal[]> {
    return this.prisma.aplicacao.findMany({
      where: { professorId },
      include: incluirTotalDeAlunos,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  buscar(professorId: string, id: string): Promise<AplicacaoComTotal | null> {
    return this.prisma.aplicacao.findFirst({ where: { id, professorId }, include: incluirTotalDeAlunos });
  }

  provaDoProfessor(professorId: string, provaId: string) {
    return this.prisma.prova.findFirst({
      where: { id: provaId, professorId, deletedAt: null },
      include: {
        questoes: {
          orderBy: { ordem: 'asc' },
          include: { questao: { select: { alternativas: { select: { letra: true }, orderBy: { letra: 'asc' } } } } },
        },
      },
    });
  }

  turmaDoProfessor(professorId: string, turmaId: string) {
    return this.prisma.turma.findFirst({ where: { id: turmaId, professorId }, select: { id: true } });
  }

  criar(dados: Prisma.AplicacaoUncheckedCreateInput): Promise<AplicacaoComTotal> {
    return this.prisma.aplicacao.create({ data: dados, include: incluirTotalDeAlunos });
  }

  contarCorrecoes(aplicacaoId: string) {
    return this.prisma.correcao.count({ where: { aplicacaoId } });
  }

  excluir(id: string) {
    return this.prisma.aplicacao.delete({ where: { id } });
  }

  /** Troca as versões da aplicação e grava a configuração usada, numa transação. */
  salvarVersoes(
    aplicacaoId: string,
    configuracao: Prisma.AplicacaoUpdateInput,
    versoes: { numeroVersao: number; layout: Prisma.InputJsonValue; qrCodePayload: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.versaoProva.deleteMany({ where: { aplicacaoId } });
      await tx.versaoProva.createMany({ data: versoes.map((versao) => ({ ...versao, aplicacaoId })) });
      return tx.aplicacao.update({
        where: { id: aplicacaoId },
        data: configuracao,
        include: incluirTotalDeAlunos,
      });
    });
  }
}
