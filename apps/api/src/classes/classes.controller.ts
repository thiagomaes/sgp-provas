import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { ClassesService } from './classes.service.js';
import { CreateAlunoDto, UpdateAlunoDto } from './dto/aluno.dto.js';
import { CreateTurmaDto, UpdateTurmaDto } from './dto/turma.dto.js';

@Controller('classes')
export class ClassesController {
  constructor(private readonly turmas: ClassesService) {}

  @Get()
  listar(@CurrentProfessor() professorId: string) {
    return this.turmas.listar(professorId);
  }

  @Post()
  criar(@CurrentProfessor() professorId: string, @Body() dto: CreateTurmaDto) {
    return this.turmas.criar(professorId, dto);
  }

  @Get(':id')
  buscar(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.turmas.buscar(professorId, id);
  }

  @Patch(':id')
  atualizar(@CurrentProfessor() professorId: string, @Param('id') id: string, @Body() dto: UpdateTurmaDto) {
    return this.turmas.atualizar(professorId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  excluir(@CurrentProfessor() professorId: string, @Param('id') id: string) {
    return this.turmas.excluir(professorId, id);
  }

  @Post(':id/students')
  adicionarAluno(@CurrentProfessor() professorId: string, @Param('id') id: string, @Body() dto: CreateAlunoDto) {
    return this.turmas.adicionarAluno(professorId, id, dto);
  }

  @Patch(':id/students/:studentId')
  atualizarAluno(
    @CurrentProfessor() professorId: string,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateAlunoDto,
  ) {
    return this.turmas.atualizarAluno(professorId, id, studentId, dto);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(204)
  excluirAluno(
    @CurrentProfessor() professorId: string,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.turmas.excluirAluno(professorId, id, studentId);
  }
}
