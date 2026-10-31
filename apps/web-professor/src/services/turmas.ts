import type { Class, Student } from '../types'
import { http } from './http'

/** Turmas e alunos (RF03) — rotas /classes da API. */

export type DadosTurma = Omit<Class, 'id' | 'alunos'>
export type DadosAluno = Omit<Student, 'id'>

export const listarTurmas = () => http.get<Class[]>('/classes')

export const buscarTurma = (id: string) => http.get<Class>(`/classes/${id}`)

export const criarTurma = (dados: DadosTurma) => http.post<Class>('/classes', dados)

export const editarTurma = (id: string, dados: Partial<DadosTurma>) =>
  http.patch<Class>(`/classes/${id}`, dados)

/** 409 quando a turma já tem provas corrigidas. */
export const excluirTurma = (id: string) => http.delete(`/classes/${id}`)

export const adicionarAluno = (turmaId: string, dados: DadosAluno) =>
  http.post<Student>(`/classes/${turmaId}/students`, dados)

export const editarAluno = (turmaId: string, alunoId: string, dados: Partial<DadosAluno>) =>
  http.patch<Student>(`/classes/${turmaId}/students/${alunoId}`, dados)

/** 409 quando o aluno já tem prova corrigida. */
export const removerAluno = (turmaId: string, alunoId: string) =>
  http.delete(`/classes/${turmaId}/students/${alunoId}`)
