import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { ReportsService } from './reports.service.js';

@Controller()
export class ReportsController {
  constructor(private readonly relatorios: ReportsService) {}

  /** Números do dashboard, últimas aplicações e médias da lista de relatórios. */
  @Get('reports/summary')
  resumo(@CurrentProfessor() professorId: string) {
    return this.relatorios.resumo(professorId);
  }

  /** Média, mediana, desvio padrão e a nota de cada aluno. */
  @Get('applications/:id/report')
  relatorio(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.relatorios.relatorio(professorId, id);
  }

  /** Planilha CSV para lançar no sistema acadêmico. */
  @Get('applications/:id/report.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async csv(@CurrentProfessor() professorId: string, @Param('id') id: string, @Res() resposta: Response) {
    const { nomeArquivo, conteudo } = await this.relatorios.csv(professorId, id);
    resposta.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    resposta.send(conteudo);
  }
}
