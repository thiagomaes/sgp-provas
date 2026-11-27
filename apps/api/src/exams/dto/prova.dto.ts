import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ItemProvaDto {
  @IsString({ message: 'Informe a questão.' })
  @MinLength(1, { message: 'Informe a questão.' })
  questaoId: string;

  /** Posição na prova; se não vier, vale a ordem da lista. */
  @IsOptional()
  @IsInt({ message: 'A ordem da questão deve ser um número inteiro.' })
  @Min(1, { message: 'A ordem da questão começa em 1.' })
  ordem?: number;

  @IsNumber({}, { message: 'A pontuação de cada questão deve ser um número.' })
  @IsPositive({ message: 'A pontuação de cada questão deve ser maior que zero.' })
  pontuacao: number;
}

export class CreateProvaDto {
  @IsString({ message: 'Informe o título da prova.' })
  @MinLength(1, { message: 'Informe o título da prova.' })
  @MaxLength(150, { message: 'O título da prova pode ter no máximo 150 caracteres.' })
  titulo: string;

  @IsString({ message: 'Informe a disciplina.' })
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80, { message: 'A disciplina pode ter no máximo 80 caracteres.' })
  disciplina: string;

  /** De 1 a 20 questões do banco do professor (RF04). */
  @IsArray({ message: 'Escolha as questões da prova.' })
  @ValidateNested({ each: true })
  @Type(() => ItemProvaDto)
  questoes: ItemProvaDto[];
}

export class UpdateProvaDto extends PartialType(CreateProvaDto) {}
