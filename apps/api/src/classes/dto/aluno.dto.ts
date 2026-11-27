import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { MAXIMO_ALUNOS_POR_IMPORTACAO } from '../importacao-alunos.js';

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

/** Importação da planilha: a web já leu o arquivo e manda só a lista. */
export class ImportarAlunosDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'A planilha não tem nenhum aluno para importar.' })
  @ArrayMaxSize(MAXIMO_ALUNOS_POR_IMPORTACAO, {
    message: `Importe no máximo ${MAXIMO_ALUNOS_POR_IMPORTACAO} alunos por vez.`,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAlunoDto)
  alunos: CreateAlunoDto[];
}
