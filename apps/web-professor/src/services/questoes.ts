import type { Question } from '../types'
import { http } from './http'

/** Banco de questões (RF02) — rotas /questions da API. */

type DadosQuestao = Omit<Question, 'id' | 'criadaEm'>

export const listarQuestoes = () => http.get<Question[]>('/questions')

export const buscarQuestao = (id: string) => http.get<Question>(`/questions/${id}`)

export const criarQuestao = (dados: DadosQuestao) => http.post<Question>('/questions', dados)

export const editarQuestao = (id: string, dados: DadosQuestao) =>
  http.patch<Question>(`/questions/${id}`, dados)

export const excluirQuestao = (id: string) => http.delete(`/questions/${id}`)
