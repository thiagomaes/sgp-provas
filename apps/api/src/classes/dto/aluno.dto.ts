import { PartialType } from '@nestjs/mapped-types';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Aluno é só nome e matrícula (RF03): sem e-mail, senha ou login. */
export class CreateAlunoDto {
  @IsString()
  @MinLength(1, { message: 'Informe o nome do aluno.' })
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(1, { message: 'Informe a matrícula.' })
  @MaxLength(30)
  matricula: string;
}

export class UpdateAlunoDto extends PartialType(CreateAlunoDto) {}
