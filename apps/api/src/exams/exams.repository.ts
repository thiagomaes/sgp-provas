import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

const comQuestoes = { questoes: { orderBy: { ordem: 'asc' } } } satisfies Prisma.ProvaInclude;

export type ProvaComQuestoes = Prisma.ProvaGetPayload<{ include: typeof comQuestoes }>;

type Item = { questaoId: string; ordem: number; pontuacao: number };

/** Acesso ao banco de provas. Prova excluída (soft-delete) não aparece. */
@Injectable()
export class ExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(professorId: string): Promise<ProvaComQuestoes[]> {
    return this.prisma.prova.findMany({
      where: { professorId, deletedAt: null },
      include: comQuestoes,
      orderBy: [{ criadaEm: 'asc' }, { id: 'asc' }],
    });
  }

  buscar(professorId: string, id: string): Promise<ProvaComQuestoes | null> {
    return this.prisma.prova.findFirst({ where: { id, professorId, deletedAt: null }, include: comQuestoes });
  }

  /** Quantas das questões pedidas existem no banco do professor (e não foram excluídas). */
  idsDeQuestoesDoProfessor(professorId: string, ids: string[]) {
    return this.prisma.questao.findMany({
      where: { id: { in: ids }, professorId, deletedAt: null },
      select: { id: true },
    });
  }

  contarAplicacoesComPdf(provaId: string) {
    return this.prisma.aplicacao.count({ where: { provaId, status: { not: 'rascunho' } } });
  }

  criar(professorId: string, dados: { titulo: string; disciplina: string; totalPontos: number }, itens: Item[]) {
    return this.prisma.prova.create({
      data: { ...dados, professorId, questoes: { create: itens } },
      include: comQuestoes,
    });
  }

  atualizar(
    id: string,
    dados: { titulo?: string; disciplina?: string; totalPontos?: number },
    itens: Item[] | undefined,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (itens) {
        await tx.provaQuestao.deleteMany({ where: { provaId: id } });
        await tx.provaQuestao.createMany({ data: itens.map((item) => ({ ...item, provaId: id })) });
      }
      return tx.prova.update({ where: { id }, data: dados, include: comQuestoes });
    });
  }

  marcarComoExcluida(id: string) {
    return this.prisma.prova.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
