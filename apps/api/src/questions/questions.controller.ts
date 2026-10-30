import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { CreateQuestaoDto, FiltroQuestoesDto, UpdateQuestaoDto } from './dto/questao.dto.js';
import { QuestionsService } from './questions.service.js';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questoes: QuestionsService) {}

  /** Filtros opcionais: ?busca=texto e ?tag=nome-da-tag */
  @Get()
  listar(@CurrentProfessor() professorId: string, @Query() filtro: FiltroQuestoesDto) {
    return this.questoes.listar(professorId, filtro);
  }

  @Post()
  criar(@CurrentProfessor() professorId: string, @Body() dto: CreateQuestaoDto) {
    return this.questoes.criar(professorId, dto);
  }

  @Get(':id')
  buscar(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.questoes.buscar(professorId, id);
  }

  @Patch(':id')
  atualizar(@CurrentProfessor() professorId: string, @Param('id') id: string, @Body() dto: UpdateQuestaoDto) {
    return this.questoes.atualizar(professorId, id, dto);
  }

  /** Soft-delete: a questão some do banco do professor, mas as provas continuam com ela. */
  @Delete(':id')
  @HttpCode(204)
  excluir(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.questoes.excluir(professorId, id);
  }
}
