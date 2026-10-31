import type { Correction, OptionLetter } from '../types'
import { http } from './http'

/** Correções (RF08, RF09, RF10) — rotas /applications/:id/corrections da API. */

/** Resposta lida no cartão: letra ORIGINAL marcada, ou pontos na discursiva. */
export interface RespostaLida {
  questaoId: string
  marcada?: OptionLetter | null
  pontuacao?: number
}

/** Prova lida pela câmera: a API calcula a nota com o gabarito do banco. */
export interface CorrecaoLida {
  clientCorrectionId: string
  origem: 'mobile'
  versao: number
  alunoId: string | null
  respostas: RespostaLida[]
  /** Só quando o professor ajustou a nota na revisão. */
  nota?: number
}

/** Lançamento manual na tela de notas (RF09). */
export interface CorrecaoManual {
  clientCorrectionId: string
  origem: 'manual'
  alunoId: string
  nota: number
}

/** ?assigned=false traz só as provas lidas ainda sem aluno. */
export const listarCorrecoes = (aplicacaoId: string, somenteSemAluno = false) =>
  http.get<Correction[]>(
    `/applications/${aplicacaoId}/corrections${somenteSemAluno ? '?assigned=false' : ''}`,
  )

/** Reenviar o mesmo clientCorrectionId devolve a correção já gravada (RF10). */
export const registrarCorrecao = (aplicacaoId: string, dados: CorrecaoLida | CorrecaoManual) =>
  http.post<Correction>(`/applications/${aplicacaoId}/corrections`, dados)

/** Atribui o aluno e/ou ajusta a nota de uma correção já gravada. */
export const atualizarCorrecao = (
  aplicacaoId: string,
  correcaoId: string,
  dados: { alunoId?: string | null; nota?: number },
) => http.patch<Correction>(`/applications/${aplicacaoId}/corrections/${correcaoId}`, dados)

/**
 * Id único gerado na tela para cada correção. crypto.randomUUID só existe
 * em contexto seguro (HTTPS ou localhost); fora dele, um id aleatório basta.
 */
export function novoIdDeCorrecao(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
