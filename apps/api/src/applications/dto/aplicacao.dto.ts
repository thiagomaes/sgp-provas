import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAplicacaoDto {
  @IsString()
  @MinLength(1)
  provaId: string;

  @IsArray({ message: 'Escolha pelo menos uma turma.' })
  @ArrayMinSize(1, { message: 'Escolha pelo menos uma turma.' })
  @ArrayUnique({ message: 'A mesma turma foi escolhida mais de uma vez.' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  turmaIds: string[];

  /** Data da aplicação, no formato AAAA-MM-DD. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD.' })
  data: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  versoes?: number;

  @IsOptional()
  @IsBoolean()
  embaralharQuestoes?: boolean;

  @IsOptional()
  @IsBoolean()
  embaralharAlternativas?: boolean;

  @IsOptional()
  @IsBoolean()
  identificarAluno?: boolean;
}

/** Configuração da tela de exportação do PDF (RF06). */
export class GerarVersoesDto {
  @IsInt({ message: 'A quantidade de versões deve ser um número inteiro.' })
  @Min(1, { message: 'Gere pelo menos 1 versão.' })
  @Max(200, { message: 'O máximo é 200 versões.' })
  versoes: number;

  @IsBoolean()
  embaralharQuestoes: boolean;

  @IsBoolean()
  embaralharAlternativas: boolean;

  @IsBoolean()
  identificarAluno: boolean;
}
