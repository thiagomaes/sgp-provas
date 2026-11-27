import type { ApplicationReport, DashboardSummary } from '../types'
import { baixarArquivo, http } from './http'

/** Relatórios de notas (RF12) e os números do dashboard. */

/** Totais do dashboard, últimas aplicações e a média de cada aplicação. */
export const buscarResumo = () => http.get<DashboardSummary>('/reports/summary')

/** Estatísticas e a nota de cada aluno de uma aplicação. */
export const buscarRelatorio = (aplicacaoId: string) =>
  http.get<ApplicationReport>(`/applications/${aplicacaoId}/report`)

/**
 * Nome do CSV no mesmo formato da API (notas-prova-turma.csv). No site
 * publicado a web e a API têm origens diferentes e o navegador não deixa
 * ler o Content-Disposition da resposta, então a tela monta o nome.
 */
export function nomeDoCsv(tituloProva: string, nomeTurma: string, extensao = 'csv'): string {
  const nome = `${tituloProva} ${nomeTurma}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `notas-${nome}.${extensao}`
}

/** Baixa a planilha CSV das notas (separador ";" e vírgula decimal). */
export const baixarCsv = (aplicacaoId: string, nomeArquivo: string) =>
  baixarArquivo(`/applications/${aplicacaoId}/report.csv`, nomeArquivo)

/** Baixa a planilha Excel com a nota e a alternativa marcada em cada questão. */
export const baixarXlsx = (aplicacaoId: string, nomeArquivo: string) =>
  baixarArquivo(`/applications/${aplicacaoId}/report.xlsx`, nomeArquivo)

/** Baixa o CSV com as notas de todas as aplicações (GET /reports/consolidated). */
export const baixarConsolidado = () =>
  baixarArquivo(
    '/reports/consolidated',
    `relatorio-consolidado-${new Date().toISOString().slice(0, 10)}.csv`,
  )
