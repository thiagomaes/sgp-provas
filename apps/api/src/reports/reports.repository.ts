import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { incluirTotalDeAlunos } from '../applications/aplicacao.mapper.js';

/** Consultas de leitura dos relatórios. Toda consulta filtra pelo professor. */
@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  contarTurmas(professorId: string) {
    return this.prisma.turma.count({ where: { professorId } });
  }

  contarProvas(professorId: string) {
    return this.prisma.prova.count({ where: { professorId, deletedAt: null } });
  }

  /** Todas as aplicações, com turma, prova e as notas (para as médias). */
  aplicacoesComNotas(professorId: string) {
    return this.prisma.aplicacao.findMany({
      where: { professorId },
      include: {
        ...incluirTotalDeAlunos,
        turma: { select: { id: true, nome: true, disciplina: true, ano: true, _count: { select: { alunos: true } } } },
        prova: { select: { id: true, titulo: true } },
        correcoes: { select: { nota: true } },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /** Todas as aplicações já aplicadas (sem rascunho), para o relatório consolidado. */
  relatoriosConsolidados(professorId: string) {
    return this.prisma.aplicacao.findMany({
      where: { professorId, status: { not: 'rascunho' } },
      include: incluirRelatorio,
      orderBy: [{ data: 'asc' }, { id: 'asc' }],
    });
  }

  /** Uma aplicação com tudo o que o relatório de notas precisa. */
  relatorio(professorId: string, aplicacaoId: string) {
    return this.prisma.aplicacao.findFirst({
      where: { id: aplicacaoId, professorId },
      include: incluirRelatorio,
    });
  }
}

const incluirRelatorio = {
  turma: {
    select: {
      id: true,
      nome: true,
      disciplina: true,
      ano: true,
      _count: { select: { alunos: true } },
      alunos: { orderBy: { matricula: 'asc' } },
    },
  },
  prova: { select: { id: true, titulo: true, totalPontos: true } },
  correcoes: { orderBy: [{ corrigidaEm: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.AplicacaoInclude;
