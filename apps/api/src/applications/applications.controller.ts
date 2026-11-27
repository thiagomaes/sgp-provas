import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { ApplicationsService } from './applications.service.js';
import { CreateAplicacaoDto, GerarVersoesDto } from './dto/aplicacao.dto.js';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly aplicacoes: ApplicationsService) {}

  @Get()
  listar(@CurrentProfessor() professorId: string) {
    return this.aplicacoes.listar(professorId);
  }

  @Post()
  criar(@CurrentProfessor() professorId: string, @Body() dto: CreateAplicacaoDto) {
    return this.aplicacoes.criar(professorId, dto);
  }

  @Get(':id')
  buscar(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.aplicacoes.buscar(professorId, id);
  }

  /** Versões na ordem impressa, com o aluno e a letra correta impressa (tela de correção). */
  @Get(':id/versions')
  listarVersoes(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.aplicacoes.listarVersoes(professorId, id);
  }

  @Get(':id/pdf')
  async baixarPdf(
    @CurrentProfessor() professorId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const { arquivo, nome } = await this.aplicacoes.gerarPdf(professorId, id);
    resposta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nome}"`,
    });
    return new StreamableFile(arquivo);
  }

  @Get(':id/answer-key')
  gabarito(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.aplicacoes.gabarito(professorId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  excluir(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.aplicacoes.excluir(professorId, id);
  }

  @Post(':id/generate')
  @HttpCode(200)
  gerar(@CurrentProfessor() professorId: string, @Param('id') id: string, @Body() dto: GerarVersoesDto) {
    return this.aplicacoes.gerarVersoes(professorId, id, dto);
  }
}
