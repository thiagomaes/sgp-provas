import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClassesRepository, type TurmaComAlunos } from './classes.repository.js';
import type { CreateAlunoDto, UpdateAlunoDto } from './dto/aluno.dto.js';
import type { CreateTurmaDto, UpdateTurmaDto } from './dto/turma.dto.js';

/** Mesmo formato do tipo Student da web. */
export interface AlunoResposta {
  id: string;
  nome: string;
  matricula: string;
}

/** Mesmo formato do tipo Class da web. */
export interface TurmaResposta {
  id: string;
  nome: string;
  disciplina: string;
  ano: string;
  turno: string;
  alunos: AlunoResposta[];
}

/**
 * Turmas e alunos (RF03). Turma de outro professor responde 404, igual a uma
 * turma que não existe: a API não revela o que é de outra pessoa.
 */
@Injectable()
export class ClassesService {
  constructor(private readonly repositorio: ClassesRepository) {}

  async listar(professorId: string): Promise<TurmaResposta[]> {
    return (await this.repositorio.listar(professorId)).map(paraResposta);
  }

  async buscar(professorId: string, id: string): Promise<TurmaResposta> {
    return paraResposta(await this.turmaDoProfessor(professorId, id));
  }

  async criar(professorId: string, dto: CreateTurmaDto): Promise<TurmaResposta> {
    return paraResposta(await this.repositorio.criar(professorId, dto));
  }

  async atualizar(professorId: string, id: string, dto: UpdateTurmaDto): Promise<TurmaResposta> {
    await this.turmaDoProfessor(professorId, id);
    return paraResposta(await this.repositorio.atualizar(id, dto));
  }

  async excluir(professorId: string, id: string): Promise<void> {
    await this.turmaDoProfessor(professorId, id);
    if ((await this.repositorio.contarCorrecoesDaTurma(id)) > 0) {
      throw new ConflictException(
        'Esta turma tem provas corrigidas e não pode ser excluída, para não perder o histórico de notas.',
      );
    }
    await this.repositorio.excluir(id);
  }

  async adicionarAluno(professorId: string, turmaId: string, dto: CreateAlunoDto): Promise<AlunoResposta> {
    await this.turmaDoProfessor(professorId, turmaId);
    return alunoParaResposta(
      await comMatriculaUnica(() =>
        this.repositorio.criarAluno(turmaId, { nome: dto.nome.trim(), matricula: dto.matricula.trim() }),
      ),
    );
  }

  async atualizarAluno(
    professorId: string,
    turmaId: string,
    alunoId: string,
    dto: UpdateAlunoDto,
  ): Promise<AlunoResposta> {
    await this.alunoDaTurma(professorId, turmaId, alunoId);
    return alunoParaResposta(
      await comMatriculaUnica(() =>
        this.repositorio.atualizarAluno(alunoId, {
          nome: dto.nome?.trim(),
          matricula: dto.matricula?.trim(),
        }),
      ),
    );
  }

  async excluirAluno(professorId: string, turmaId: string, alunoId: string): Promise<void> {
    await this.alunoDaTurma(professorId, turmaId, alunoId);
    if ((await this.repositorio.contarCorrecoesDoAluno(alunoId)) > 0) {
      throw new ConflictException(
        'Este aluno tem provas corrigidas e não pode ser removido, para não perder o histórico de notas.',
      );
    }
    await this.repositorio.excluirAluno(alunoId);
  }

  private async turmaDoProfessor(professorId: string, id: string): Promise<TurmaComAlunos> {
    const turma = await this.repositorio.buscar(professorId, id);
    if (!turma) throw new NotFoundException('Turma não encontrada.');
    return turma;
  }

  private async alunoDaTurma(professorId: string, turmaId: string, alunoId: string) {
    await this.turmaDoProfessor(professorId, turmaId);
    const aluno = await this.repositorio.buscarAluno(turmaId, alunoId);
    if (!aluno) throw new NotFoundException('Aluno não encontrado nesta turma.');
    return aluno;
  }
}

/** Matrícula repetida na mesma turma vira 409 (regra @@unique do schema). */
async function comMatriculaUnica<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
      throw new ConflictException('Já existe um aluno com esta matrícula nesta turma.');
    }
    throw erro;
  }
}

function alunoParaResposta(aluno: AlunoResposta): AlunoResposta {
  return { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula };
}

function paraResposta(turma: TurmaComAlunos): TurmaResposta {
  return {
    id: turma.id,
    nome: turma.nome,
    disciplina: turma.disciplina,
    ano: turma.ano,
    turno: turma.turno,
    alunos: turma.alunos.map(alunoParaResposta),
  };
}
