import { BadRequestException, Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
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

  /** Notas de todas as aplicações num CSV só. Por enquanto só ?format=csv (o padrão). */
  @Get('reports/consolidated')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async consolidado(
    @CurrentProfessor() professorId: string,
    @Query('format') formato = 'csv',
    @Res() resposta: Response,
  ) {
    if (formato !== 'csv') throw new BadRequestException("Por enquanto só o formato 'csv' está disponível.");
    const { nomeArquivo, conteudo } = await this.relatorios.consolidadoCsv(professorId);
    resposta.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    resposta.send(conteudo);
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
