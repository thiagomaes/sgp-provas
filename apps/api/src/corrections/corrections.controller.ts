import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { CorrectionsService } from './corrections.service.js';
import { CreateCorrecaoDto, FiltroCorrecoesDto, UpdateCorrecaoDto } from './dto/correcao.dto.js';

@Controller('applications/:id/corrections')
export class CorrectionsController {
  constructor(private readonly correcoes: CorrectionsService) {}

  @Get()
  listar(
    @CurrentProfessor() professorId: string,
    @Param('id') aplicacaoId: string,
    @Query() filtro: FiltroCorrecoesDto,
  ) {
    return this.correcoes.listar(professorId, aplicacaoId, filtro.assigned === 'false');
  }

  @Post()
  criar(@CurrentProfessor() professorId: string, @Param('id') aplicacaoId: string, @Body() dto: CreateCorrecaoDto) {
    return this.correcoes.criar(professorId, aplicacaoId, dto);
  }

  @Patch(':correctionId')
  atualizar(
    @CurrentProfessor() professorId: string,
    @Param('id') aplicacaoId: string,
    @Param('correctionId') correcaoId: string,
    @Body() dto: UpdateCorrecaoDto,
  ) {
    return this.correcoes.atualizar(professorId, aplicacaoId, correcaoId, dto);
  }
}
