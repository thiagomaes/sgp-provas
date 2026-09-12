import type { Application } from './types'

/**
 * Aplicações de exemplo (mockups aprovados).
 *
 * As três primeiras são as "Últimas aplicações" do dashboard
 * (docs/telas/02-dashboard.png), na mesma ordem e com as mesmas datas.
 * A "aplicacao-1" é a Avaliação Bimestral 1 na turma Matemática — 1º Ano
 * (32 alunos), usada como exemplo principal em correções e relatórios.
 */
export const aplicacoes: Application[] = [
  {
    id: 'aplicacao-1',
    provaId: 'prova-1',
    turmaId: 'turma-1',
    data: '2026-08-28',
    versoes: 4,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    // 31 das 32 provas já foram lidas pelo app; falta lançar a nota de uma
    // aluna manualmente (é a linha "— lançar —" em 12-notas-detalhe.png).
    status: 'em-correcao',
    corrigidas: 31,
    totalProvas: 32,
    media: 7.5
  },
  {
    id: 'aplicacao-2',
    provaId: 'prova-4',
    turmaId: 'turma-3',
    data: '2026-08-25',
    versoes: 2,
    embaralharQuestoes: true,
    embaralharAlternativas: false,
    // Sem identificação: todas as notas entram por lançamento manual (RF09).
    identificarAluno: false,
    status: 'pdf-gerado',
    corrigidas: 0,
    totalProvas: 25,
  },
  {
    id: 'aplicacao-3',
    provaId: 'prova-5',
    turmaId: 'turma-4',
    data: '2026-08-18',
    versoes: 3,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    status: 'concluida',
    corrigidas: 30,
    totalProvas: 30,
  },
  {
    id: 'aplicacao-4',
    provaId: 'prova-3',
    turmaId: 'turma-2',
    data: '2026-09-04',
    versoes: 2,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    status: 'pdf-gerado',
    corrigidas: 0,
    totalProvas: 28,
  },
  {
    id: 'aplicacao-5',
    provaId: 'prova-2',
    turmaId: 'turma-1',
    data: '2026-09-15',
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
