import type { Exam, ExamQuestion } from '../types'
import { http } from './http'

/** Provas (RF04) — rotas /exams da API. O totalPontos é calculado por ela. */

export interface DadosProva {
  titulo: string
  disciplina: string
  /** De 1 a 20 questões; a ordem da lista vira a ordem na prova. */
  questoes: Omit<ExamQuestion, 'ordem'>[]
}

/** Limite de questões por prova (RF04), o mesmo que a API confere. */
export const LIMITE_QUESTOES = 20

export const listarProvas = () => http.get<Exam[]>('/exams')

export const buscarProva = (id: string) => http.get<Exam>(`/exams/${id}`)

export const criarProva = (dados: DadosProva) => http.post<Exam>('/exams', dados)

/** 409 ao trocar as questões de uma prova que já tem PDF gerado. */
export const editarProva = (id: string, dados: Partial<DadosProva>) =>
  http.patch<Exam>(`/exams/${id}`, dados)

/** Soft-delete: aplicações antigas continuam apontando para a prova. */
export const excluirProva = (id: string) => http.delete(`/exams/${id}`)
