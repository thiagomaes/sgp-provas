import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const TURNOS = ['Manhã', 'Tarde', 'Noite'] as const;

export class CreateTurmaDto {
  @IsString()
  @MinLength(1, { message: 'Informe o nome da turma.' })
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80)
  disciplina: string;

  @IsString()
  @MinLength(1, { message: 'Informe o ano.' })
  @MaxLength(30)
  ano: string;

  @IsIn(TURNOS, { message: 'O turno deve ser Manhã, Tarde ou Noite.' })
  turno: (typeof TURNOS)[number];
}

export class UpdateTurmaDto extends PartialType(CreateTurmaDto) {}
