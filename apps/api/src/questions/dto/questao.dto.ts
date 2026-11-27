import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const TIPOS_QUESTAO = ['objetiva', 'discursiva'] as const;
export const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

export class AlternativaDto {
  @IsIn(LETRAS, { message: 'A letra da alternativa deve ser de A a E.' })
  letra: (typeof LETRAS)[number];

  @IsString({ message: 'O texto da alternativa não pode ficar vazio.' })
  @MinLength(1, { message: 'O texto da alternativa não pode ficar vazio.' })
  @MaxLength(2000, { message: 'O texto de cada alternativa pode ter no máximo 2000 caracteres.' })
  texto: string;

  @IsBoolean({ message: 'Diga se a alternativa é a correta.' })
  correta: boolean;
}

export class CreateQuestaoDto {
  @IsString({ message: 'Informe o enunciado.' })
  @MinLength(1, { message: 'Informe o enunciado.' })
  @MaxLength(10000, { message: 'O enunciado pode ter no máximo 10000 caracteres.' })
  enunciado: string;

  @IsIn(TIPOS_QUESTAO, { message: 'O tipo deve ser objetiva ou discursiva.' })
  tipo: (typeof TIPOS_QUESTAO)[number];

  @IsString({ message: 'Informe a disciplina.' })
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80, { message: 'A disciplina pode ter no máximo 80 caracteres.' })
  disciplina: string;

  @IsOptional()
  @IsArray({ message: 'As tags devem ser uma lista de textos.' })
  @IsString({ each: true, message: 'Cada tag deve ser um texto.' })
  tags?: string[];

  /** Só nas objetivas: de 2 a 5, com exatamente uma correta. */
  @IsOptional()
  @IsArray({ message: 'As alternativas devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => AlternativaDto)
  alternativas?: AlternativaDto[];

  /** Só nas discursivas. */
  @IsOptional()
  @IsString({ message: 'A resposta esperada deve ser um texto.' })
  @MaxLength(10000, { message: 'A resposta esperada pode ter no máximo 10000 caracteres.' })
  respostaEsperada?: string;

  /** Obrigatória nas discursivas. */
  @IsOptional()
  @IsNumber({}, { message: 'A pontuação máxima deve ser um número.' })
  @IsPositive({ message: 'A pontuação máxima deve ser maior que zero.' })
  pontuacaoMaxima?: number;
}

export class UpdateQuestaoDto extends PartialType(CreateQuestaoDto) {}

export class FiltroQuestoesDto {
  /** Procura no enunciado e nas tags. */
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
