import type { Correction, CorrectionAnswer } from './types'
import { provaExemplo } from './provas'
import { turmaExemplo } from './turmas'
import { questoes } from './questoes'

/**
 * Correções de exemplo da aplicação "aplicacao-1"
 * (Avaliação Bimestral 1, turma Matemática — 1º Ano).
 *
 * São 18 provas corrigidas das 32 da turma, batendo com o campo
 * `corrigidas` em mocks/aplicacoes.ts. A primeira correção é a da aluna
 * Beatriz Almeida (matrícula 2026001), usada como exemplo nos mockups.
 */

const QUANTIDADE_CORRIGIDA = 18

/** Letra correta de cada questão objetiva da prova de exemplo. */
function letraCorreta(questaoId: string): CorrectionAnswer['marcada'] {
  const questao = questoes.find((item) => item.id === questaoId)
  const correta = questao?.alternativas?.find((alt) => alt.correta)
  return correta?.letra ?? null
}

/**
 * Gera as respostas de um aluno de forma determinística: o aluno erra a
 * questão cujo índice bate com o resto da divisão, para os mocks terem
 * variação de nota sem virar dado aleatório (que mudaria a cada reload).
 */
function respostasDeterministicas(indiceAluno: number): CorrectionAnswer[] {
  return provaExemplo.questoes.map((item, indice) => {
    const questao = questoes.find((q) => q.id === item.questaoId)
    const acertou = (indiceAluno + indice) % 4 !== 0

    if (questao?.tipo === 'discursiva') {
      // Discursiva: sem alternativa marcada; pontuação parcial na correção.
      return {
        questaoId: item.questaoId,
        marcada: null,
        correta: acertou,
        pontuacao: acertou ? item.pontuacao : item.pontuacao / 2,
      }
    }

    const certa = letraCorreta(item.questaoId)
    const alternativas = questao?.alternativas ?? []
    const erradas = alternativas.filter((alt) => !alt.correta)
    const marcadaErrada = erradas[indiceAluno % Math.max(erradas.length, 1)]

    return {
      questaoId: item.questaoId,
      marcada: acertou ? certa : (marcadaErrada?.letra ?? null),
      correta: acertou,
      pontuacao: acertou ? item.pontuacao : 0,
    }
  })
}

function somaNota(respostas: CorrectionAnswer[]): number {
  const total = respostas.reduce((acc, resposta) => acc + resposta.pontuacao, 0)
  return Number(total.toFixed(1))
}

export const correcoes: Correction[] = turmaExemplo.alunos
  .slice(0, QUANTIDADE_CORRIGIDA)
  .map((aluno, indice) => {
    const respostas = respostasDeterministicas(indice)
    const numero = String(indice + 1).padStart(3, '0')

    return {
      id: `correcao-${numero}`,
      aplicacaoId: 'aplicacao-1',
      alunoId: aluno.id,
      // A aplicação tem 4 versões embaralhadas.
      versao: (indice % 4) + 1,
      nota: somaNota(respostas),
      respostas,
      origem: 'mobile' as const,
      clientCorrectionId: `cli-${numero}`,
      // As três últimas ainda não subiram da fila offline do app (RF10).
      statusSync:
        indice >= QUANTIDADE_CORRIGIDA - 3
          ? ('pendente' as const)
          : ('sincronizada' as const),
      corrigidaEm: '2026-03-17',
    }
  })

/** Correção da Beatriz Almeida — exemplo usado nas telas de detalhe. */
export const correcaoExemplo = correcoes[0]

export function buscarCorrecoesPorAplicacao(aplicacaoId: string): Correction[] {
  return correcoes.filter((correcao) => correcao.aplicacaoId === aplicacaoId)
}
