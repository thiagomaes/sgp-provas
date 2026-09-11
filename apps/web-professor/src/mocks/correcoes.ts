import type { Correction, CorrectionAnswer } from './types'
import { provaExemplo } from './provas'
import { turmaExemplo } from './turmas'
import { questoes } from './questoes'

/**
 * Correções de exemplo da aplicação "aplicacao-1"
 * (Avaliação Bimestral 1, turma Matemática — 1º Ano, 32 alunos).
 *
 * São 31 provas lidas pelo app; a aluna Daniela Ferreira (2026003) não tem
 * correção — é a linha "— lançar —" / "Manual pendente" do mockup
 * docs/telas/12-notas-detalhe.png. Para saber quem está pendente, compare
 * os alunos da turma com os alunoId presentes aqui.
 *
 * As notas de Beatriz (8,5), Carlos (6,0) e Eduardo (7,5) são as do mockup.
 */

/** Aluno sem correção lida: a nota dele será lançada manualmente (RF09). */
const ALUNOS_PENDENTES = new Set(['aluno-3'])

/**
 * Questões que cada aluno errou, quando o mockup fixa a nota.
 * As pontuações da prova de exemplo são 2 + 2 + 1,5 + 1,5 + 1 + 2 = 10.
 */
const ERROS_DO_MOCKUP: Record<string, string[]> = {
  'aluno-1': ['questao-3'], // 10 − 1,5 = 8,5
  'aluno-2': ['questao-1', 'questao-2'], // 10 − 4 = 6,0
  'aluno-4': ['questao-4', 'questao-6'], // 10 − 2,5 = 7,5
}

function letraCorreta(questaoId: string): CorrectionAnswer['marcada'] {
  const questao = questoes.find((item) => item.id === questaoId)
  return questao?.alternativas?.find((alt) => alt.correta)?.letra ?? null
}

/**
 * Monta as respostas de um aluno. Quem está em ERROS_DO_MOCKUP recebe
 * exatamente os erros listados; os demais seguem uma regra determinística,
 * para variar a nota sem usar valor aleatório (que mudaria a cada reload).
 */
function respostasDoAluno(alunoId: string, indice: number): CorrectionAnswer[] {
  const errosFixos = ERROS_DO_MOCKUP[alunoId]

  return provaExemplo.questoes.map((item, posicao) => {
    const questao = questoes.find((q) => q.id === item.questaoId)
    const acertou = errosFixos
      ? !errosFixos.includes(item.questaoId)
      : (indice + posicao) % 4 !== 0

    if (questao?.tipo === 'discursiva') {
      // Discursiva: sem alternativa marcada; pontuação parcial quando erra.
      return {
        questaoId: item.questaoId,
        marcada: null,
        correta: acertou,
        pontuacao: acertou ? item.pontuacao : item.pontuacao / 2,
      }
    }

    const alternativas = questao?.alternativas ?? []
    const erradas = alternativas.filter((alt) => !alt.correta)
    const marcadaErrada = erradas[indice % Math.max(erradas.length, 1)]

    return {
      questaoId: item.questaoId,
      marcada: acertou ? letraCorreta(item.questaoId) : (marcadaErrada?.letra ?? null),
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
  .filter((aluno) => !ALUNOS_PENDENTES.has(aluno.id))
  .map((aluno, indice) => {
    const respostas = respostasDoAluno(aluno.id, indice)
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
      statusSync: indice >= 28 ? ('pendente' as const) : ('sincronizada' as const),
      corrigidaEm: '2026-08-29',
    }
  })

/** Correção da Beatriz Almeida (8,5) — exemplo usado nas telas de detalhe. */
export const correcaoExemplo = correcoes[0]

export function buscarCorrecoesPorAplicacao(aplicacaoId: string): Correction[] {
  return correcoes.filter((correcao) => correcao.aplicacaoId === aplicacaoId)
}

/** Alunos da aplicação que ainda precisam de lançamento manual de nota. */
export function alunosComNotaPendente(aplicacaoId: string): string[] {
  if (aplicacaoId !== 'aplicacao-1') return []
  return [...ALUNOS_PENDENTES]
}
