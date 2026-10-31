import type { Application, ApplicationVersion } from '../types'
import { http } from './http'

/** Aplicações (RF05, RF06, RF07) — rotas /applications da API. */

export interface DadosAplicacao {
  provaId: string
  turmaId: string
  /** AAAA-MM-DD */
  data: string
  versoes?: number
  embaralharQuestoes?: boolean
  embaralharAlternativas?: boolean
  identificarAluno?: boolean
}

export interface ConfiguracaoVersoes {
  versoes: number
  embaralharQuestoes: boolean
  embaralharAlternativas: boolean
  identificarAluno: boolean
}

export const listarAplicacoes = () => http.get<Application[]>('/applications')

export const buscarAplicacao = (id: string) => http.get<Application>(`/applications/${id}`)

export const criarAplicacao = (dados: DadosAplicacao) =>
  http.post<Application>('/applications', dados)

/** 409 quando a aplicação já tem provas corrigidas. */
export const excluirAplicacao = (id: string) => http.delete(`/applications/${id}`)

/**
 * Gera as versões embaralhadas e marca a aplicação como "PDF gerado".
 * 409 quando a correção já começou.
 */
export const gerarVersoes = (id: string, configuracao: ConfiguracaoVersoes) =>
  http.post<{ aplicacao: Application; versoes: ApplicationVersion[] }>(
    `/applications/${id}/generate`,
    configuracao,
  )

/** Data de hoje no fuso do navegador, em AAAA-MM-DD. */
export function dataDeHoje(): string {
  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${hoje.getFullYear()}-${mes}-${dia}`
}
