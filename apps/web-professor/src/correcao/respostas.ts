/**
 * Respostas do cartão-resposta na tela de revisão. O professor marca a letra
 * impressa; a API calcula a nota pelo gabarito original, então cada letra é
 * convertida com `alternativas[posição]` (docs/arquitetura/cartao-resposta.md,
 * seção 8). Funções puras: usadas pela tela e pelos testes.
 */
import type { OptionLetter, PrintedQuestion } from '../types'

export const LETRAS_IMPRESSAS: readonly OptionLetter[] = ['A', 'B', 'C', 'D', 'E']

/** Letra marcada em cada objetiva (impressa) e pontos dados em cada discursiva. */
export interface Marcacoes {
  letras: Record<string, OptionLetter | null>
  pontos: Record<string, number>
}

/** Letra original da alternativa marcada; null em branco ou letra que não existe. */
export function letraOriginal(questao: PrintedQuestion, impressa: OptionLetter | null): OptionLetter | null {
  if (!impressa) return null
  return questao.alternativas[LETRAS_IMPRESSAS.indexOf(impressa)] ?? null
}

/** Pontos da discursiva, entre 0 e a pontuação da questão. */
function pontosDaDiscursiva(questao: PrintedQuestion, marcacoes: Marcacoes): number {
  const pontos = marcacoes.pontos[questao.questaoId] ?? 0
  return Math.min(Math.max(Number.isFinite(pontos) ? pontos : 0, 0), questao.pontuacao)
}

/** Nota que a API vai calcular, para o professor conferir antes de confirmar. */
export function notaPrevista(questoes: PrintedQuestion[], marcacoes: Marcacoes): number {
  const total = questoes.reduce((soma, questao) => {
    if (questao.tipo === 'discursiva') return soma + pontosDaDiscursiva(questao, marcacoes)
    const marcada = marcacoes.letras[questao.questaoId] ?? null
    return soma + (marcada !== null && marcada === questao.corretaImpressa ? questao.pontuacao : 0)
  }, 0)
  return Math.round(total * 10) / 10
}

/** Respostas no formato do POST de correção, já com as letras originais. */
export function respostasParaApi(questoes: PrintedQuestion[], marcacoes: Marcacoes) {
  return questoes.map((questao) =>
    questao.tipo === 'discursiva'
      ? { questaoId: questao.questaoId, pontuacao: pontosDaDiscursiva(questao, marcacoes) }
      : {
          questaoId: questao.questaoId,
          marcada: letraOriginal(questao, marcacoes.letras[questao.questaoId] ?? null),
        },
  )
}
