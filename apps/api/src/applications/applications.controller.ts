import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
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
