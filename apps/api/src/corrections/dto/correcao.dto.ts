import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;
export const ORIGENS = ['mobile', 'manual'] as const;

export class RespostaDto {
  @IsString()
  @MinLength(1)
  questaoId: string;

  /**
   * Letra ORIGINAL da alternativa marcada (a tela converte a letra impressa
   * pelo layout da versão). null = em branco. Ignorado nas discursivas.
   */
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsIn(LETRAS, { message: 'A alternativa marcada deve ser de A a E, ou null.' })
  marcada?: (typeof LETRAS)[number] | null;

  /** Só nas discursivas: pontos dados pelo professor (limitado à pontuação da questão). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  pontuacao?: number;
}

/**
 * origem 'mobile' (padrão): prova lida pela câmera na tela de correção.
 *   Exige versao e respostas; a nota é calculada aqui com o gabarito.
 * origem 'manual': lançamento manual na tela de Notas (RF09), para aluno
 *   sem prova lida. Exige alunoId e nota; não tem respostas.
 */
export class CreateCorrecaoDto {
  /** Id gerado pela tela; reenviar o mesmo id não duplica a correção (RF10). */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  clientCorrectionId: string;

  @IsOptional()
  @IsIn(ORIGENS, { message: "A origem deve ser 'mobile' ou 'manual'." })
  origem?: (typeof ORIGENS)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  versao?: number;

  /** null ou ausente quando a prova não é identificada. */
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsString()
  alunoId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaDto)
  respostas?: RespostaDto[];

  /** Nota final quando o professor ajustou (mobile) ou lançou (manual). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  nota?: number;
}

/** Lançamento manual: atribui o aluno e/ou ajusta a nota (RF09). */
export class UpdateCorrecaoDto {
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsString()
  alunoId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nota?: number;
}

export class FiltroCorrecoesDto {
  /** ?assigned=false traz só as correções ainda sem aluno. */
  @IsOptional()
  @IsIn(['true', 'false'])
  assigned?: 'true' | 'false';
}
