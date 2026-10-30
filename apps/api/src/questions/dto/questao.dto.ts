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

  @IsString()
  @MinLength(1, { message: 'O texto da alternativa não pode ficar vazio.' })
  texto: string;

  @IsBoolean()
  correta: boolean;
}

export class CreateQuestaoDto {
  @IsString()
  @MinLength(1, { message: 'Informe o enunciado.' })
  enunciado: string;

  @IsIn(TIPOS_QUESTAO, { message: 'O tipo deve ser objetiva ou discursiva.' })
  tipo: (typeof TIPOS_QUESTAO)[number];

  @IsString()
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80)
  disciplina: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  /** Só nas objetivas: de 2 a 5, com exatamente uma correta. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlternativaDto)
  alternativas?: AlternativaDto[];

  /** Só nas discursivas. */
  @IsOptional()
  @IsString()
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
