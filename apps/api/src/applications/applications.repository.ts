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

  buscarParaPdf(professorId: string, id: string) {
    return this.prisma.aplicacao.findFirst({
      where: { id, professorId },
      include: {
        turma: { select: { nome: true } },
        prova: {
          select: {
            titulo: true,
            questoes: {
              select: {
                questaoId: true,
                pontuacao: true,
                questao: { select: { enunciado: true, alternativas: { select: { letra: true, texto: true } } } },
              },
            },
          },
        },
        versoesProva: { orderBy: { numeroVersao: 'asc' }, include: { aluno: { select: { nome: true, matricula: true } } } },
      },
    });
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

  turmasDoProfessor(professorId: string, turmaIds: string[]) {
    return this.prisma.turma.findMany({
      where: { id: { in: turmaIds }, professorId },
      select: { id: true, _count: { select: { alunos: true } } },
    });
  }

  criarVarias(aplicacoes: Prisma.AplicacaoUncheckedCreateInput[]): Promise<AplicacaoComTotal[]> {
    return this.prisma.$transaction(
      aplicacoes.map((dados) => this.prisma.aplicacao.create({ data: dados, include: incluirTotalDeAlunos })),
    );
  }

  alunosDaTurma(turmaId: string) {
    return this.prisma.aluno.findMany({
      where: { turmaId },
      select: { id: true, nome: true, matricula: true },
      orderBy: [{ nome: 'asc' }, { matricula: 'asc' }],
    });
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
    versoes: { numeroVersao: number; alunoId?: string; layout: Prisma.InputJsonValue; qrCodePayload: string }[],
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
