import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

const comAlternativas = { alternativas: { orderBy: { letra: 'asc' } } } satisfies Prisma.QuestaoInclude;

export type QuestaoComAlternativas = Prisma.QuestaoGetPayload<{ include: typeof comAlternativas }>;

type DadosQuestao = Omit<Prisma.QuestaoUncheckedCreateInput, 'professorId' | 'alternativas'>;
type Alternativa = { letra: string; texto: string; correta: boolean };

/** Acesso ao banco de questões. Questão apagada (soft-delete) não aparece. */
@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(professorId: string): Promise<QuestaoComAlternativas[]> {
    return this.prisma.questao.findMany({
      where: { professorId, deletedAt: null },
      include: comAlternativas,
      orderBy: [{ criadaEm: 'asc' }, { id: 'asc' }],
    });
  }

  buscar(professorId: string, id: string): Promise<QuestaoComAlternativas | null> {
    return this.prisma.questao.findFirst({
      where: { id, professorId, deletedAt: null },
      include: comAlternativas,
    });
  }

  criar(professorId: string, dados: DadosQuestao, alternativas: Alternativa[]) {
    return this.prisma.questao.create({
      data: { ...dados, professorId, alternativas: { create: alternativas } },
      include: comAlternativas,
    });
  }

  /** Atualiza a questão e, se vierem alternativas, troca todas de uma vez. */
  atualizar(id: string, dados: Partial<DadosQuestao>, alternativas: Alternativa[] | undefined) {
    return this.prisma.$transaction(async (tx) => {
      if (alternativas) {
        await tx.alternativa.deleteMany({ where: { questaoId: id } });
        await tx.alternativa.createMany({
          data: alternativas.map((alternativa) => ({ ...alternativa, questaoId: id })),
        });
      }
      return tx.questao.update({ where: { id }, data: dados, include: comAlternativas });
    });
  }

  marcarComoExcluida(id: string) {
    return this.prisma.questao.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
