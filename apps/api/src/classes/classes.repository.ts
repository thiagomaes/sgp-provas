import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

const comAlunos = { alunos: { orderBy: { matricula: 'asc' } } } satisfies Prisma.TurmaInclude;

export type TurmaComAlunos = Prisma.TurmaGetPayload<{ include: typeof comAlunos }>;

/** Acesso ao banco de turmas e alunos. Toda consulta filtra pelo professor. */
@Injectable()
export class ClassesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(professorId: string): Promise<TurmaComAlunos[]> {
    return this.prisma.turma.findMany({
      where: { professorId },
      include: comAlunos,
      orderBy: { createdAt: 'asc' },
    });
  }

  buscar(professorId: string, id: string): Promise<TurmaComAlunos | null> {
    return this.prisma.turma.findFirst({ where: { id, professorId }, include: comAlunos });
  }

  criar(professorId: string, dados: Omit<Prisma.TurmaUncheckedCreateInput, 'professorId'>) {
    return this.prisma.turma.create({ data: { ...dados, professorId }, include: comAlunos });
  }

  atualizar(id: string, dados: Prisma.TurmaUpdateInput) {
    return this.prisma.turma.update({ where: { id }, data: dados, include: comAlunos });
  }

  excluir(id: string) {
    return this.prisma.turma.delete({ where: { id } });
  }

  contarCorrecoesDaTurma(turmaId: string) {
    return this.prisma.correcao.count({ where: { aplicacao: { turmaId } } });
  }

  buscarAluno(turmaId: string, alunoId: string) {
    return this.prisma.aluno.findFirst({ where: { id: alunoId, turmaId } });
  }

  criarAluno(turmaId: string, dados: { nome: string; matricula: string }) {
    return this.prisma.aluno.create({ data: { ...dados, turmaId } });
  }

  atualizarAluno(alunoId: string, dados: Prisma.AlunoUpdateInput) {
    return this.prisma.aluno.update({ where: { id: alunoId }, data: dados });
  }

  excluirAluno(alunoId: string) {
    return this.prisma.aluno.delete({ where: { id: alunoId } });
  }

  contarCorrecoesDoAluno(alunoId: string) {
    return this.prisma.correcao.count({ where: { alunoId } });
  }
}
