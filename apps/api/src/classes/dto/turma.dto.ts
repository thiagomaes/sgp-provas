import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const TURNOS = ['Manhã', 'Tarde', 'Noite'] as const;

export class CreateTurmaDto {
  @IsString({ message: 'Informe o nome da turma.' })
  @MinLength(1, { message: 'Informe o nome da turma.' })
  @MaxLength(120, { message: 'O nome da turma pode ter no máximo 120 caracteres.' })
  nome: string;

  @IsString({ message: 'Informe a disciplina.' })
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80, { message: 'A disciplina pode ter no máximo 80 caracteres.' })
  disciplina: string;

  @IsString({ message: 'Informe o ano.' })
  @MinLength(1, { message: 'Informe o ano.' })
  @MaxLength(30, { message: 'O ano pode ter no máximo 30 caracteres.' })
  ano: string;

  @IsIn(TURNOS, { message: 'O turno deve ser Manhã, Tarde ou Noite.' })
  turno: (typeof TURNOS)[number];
}

export class UpdateTurmaDto extends PartialType(CreateTurmaDto) {}
