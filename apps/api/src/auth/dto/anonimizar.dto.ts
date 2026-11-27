import { IsString, MinLength } from 'class-validator';

/** A senha confirma que é o próprio professor pedindo a anonimização. */
export class AnonimizarDto {
  @IsString()
  @MinLength(1, { message: 'Informe a sua senha para confirmar.' })
  senha: string;
}
