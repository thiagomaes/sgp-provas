import { IsString, MaxLength, MinLength } from 'class-validator';

/** A senha confirma que é o próprio professor pedindo a anonimização. */
export class AnonimizarDto {
  @IsString({ message: 'Informe a sua senha para confirmar.' })
  @MinLength(1, { message: 'Informe a sua senha para confirmar.' })
  @MaxLength(72, { message: 'A senha pode ter no máximo 72 caracteres.' })
  senha: string;
}
