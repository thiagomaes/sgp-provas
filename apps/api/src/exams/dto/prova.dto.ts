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
  @IsString()
  @MinLength(1)
  questaoId: string;

  /** Posição na prova; se não vier, vale a ordem da lista. */
  @IsOptional()
  @IsInt()
  @Min(1)
  ordem?: number;

  @IsNumber({}, { message: 'A pontuação de cada questão deve ser um número.' })
  @IsPositive({ message: 'A pontuação de cada questão deve ser maior que zero.' })
  pontuacao: number;
}

export class CreateProvaDto {
  @IsString()
  @MinLength(1, { message: 'Informe o título da prova.' })
  @MaxLength(150)
  titulo: string;

  @IsString()
  @MinLength(1, { message: 'Informe a disciplina.' })
  @MaxLength(80)
  disciplina: string;

  /** De 1 a 20 questões do banco do professor (RF04). */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemProvaDto)
  questoes: ItemProvaDto[];
}

export class UpdateProvaDto extends PartialType(CreateProvaDto) {}
