import type { ApplicationReport, DashboardSummary } from '../types'
import { baixarArquivo, http } from './http'

/** Relatórios de notas (RF12) e os números do dashboard. */

/** Totais do dashboard, últimas aplicações e a média de cada aplicação. */
export const buscarResumo = () => http.get<DashboardSummary>('/reports/summary')

/** Estatísticas e a nota de cada aluno de uma aplicação. */
export const buscarRelatorio = (aplicacaoId: string) =>
  http.get<ApplicationReport>(`/applications/${aplicacaoId}/report`)

/** Baixa a planilha CSV das notas (separador ";" e vírgula decimal). */
export const baixarCsv = (aplicacaoId: string) =>
  baixarArquivo(`/applications/${aplicacaoId}/report.csv`, `notas-${aplicacaoId}.csv`)
