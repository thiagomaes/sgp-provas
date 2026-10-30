import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { CreateProvaDto, UpdateProvaDto } from './dto/prova.dto.js';
import { ExamsService } from './exams.service.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly provas: ExamsService) {}

  @Get()
  listar(@CurrentProfessor() professorId: string) {
    return this.provas.listar(professorId);
  }

  @Post()
  criar(@CurrentProfessor() professorId: string, @Body() dto: CreateProvaDto) {
    return this.provas.criar(professorId, dto);
  }

  @Get(':id')
  buscar(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.provas.buscar(professorId, id);
  }

  @Patch(':id')
  atualizar(@CurrentProfessor() professorId: string, @Param('id') id: string, @Body() dto: UpdateProvaDto) {
    return this.provas.atualizar(professorId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  excluir(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.provas.excluir(professorId, id);
  }
}
