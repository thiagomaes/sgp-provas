import type { Application } from './types'

/**
 * Aplicações de exemplo (mockups aprovados).
 * A aplicação "aplicacao-1" é a Avaliação Bimestral 1 na turma de
 * Matemática — 1º Ano (32 alunos), usada como exemplo principal.
 */
export const aplicacoes: Application[] = [
  {
    id: 'aplicacao-1',
    provaId: 'prova-1',
    turmaId: 'turma-1',
    data: '2026-03-16',
    versoes: 4,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    status: 'em-correcao',
    corrigidas: 18,
    totalProvas: 32,
  },
  {
    id: 'aplicacao-2',
    provaId: 'prova-3',
    turmaId: 'turma-2',
    data: '2026-03-18',
    versoes: 2,
    embaralharQuestoes: true,
    embaralharAlternativas: false,
    identificarAluno: false,
    status: 'pdf-gerado',
    corrigidas: 0,
    totalProvas: 28,
  },
  {
    id: 'aplicacao-3',
    provaId: 'prova-4',
    turmaId: 'turma-3',
    data: '2026-03-10',
    versoes: 3,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    status: 'concluida',
    corrigidas: 25,
    totalProvas: 25,
  },
  {
    id: 'aplicacao-4',
    provaId: 'prova-2',
    turmaId: 'turma-1',
    data: '2026-04-06',
    versoes: 1,
    embaralharQuestoes: false,
    embaralharAlternativas: false,
    identificarAluno: true,
    status: 'rascunho',
    corrigidas: 0,
    totalProvas: 32,
  },
]

/** Aplicação usada como exemplo principal nos mockups. */
export const aplicacaoExemplo = aplicacoes[0]

export function buscarAplicacaoPorId(id: string): Application | undefined {
  return aplicacoes.find((aplicacao) => aplicacao.id === id)
}
