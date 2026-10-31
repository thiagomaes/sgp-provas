import type { Question } from '../mocks/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type DadosQuestao = Omit<Question, 'id' | 'criadaEm'>

async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status}`)
  }

  return resposta.status === 204 ? (undefined as T) : resposta.json()
}

export const listarQuestoes = () => chamar<Question[]>('/questions')

export const buscarQuestao = (id: string) => chamar<Question>(`/questions/${id}`)

export const criarQuestao = (dados: DadosQuestao) =>
  chamar<Question>('/questions', { method: 'POST', body: JSON.stringify(dados) })

export const editarQuestao = (id: string, dados: DadosQuestao) =>
  chamar<Question>(`/questions/${id}`, { method: 'PATCH', body: JSON.stringify(dados) })

export const excluirQuestao = (id: string) =>
  chamar<void>(`/questions/${id}`, { method: 'DELETE' })
