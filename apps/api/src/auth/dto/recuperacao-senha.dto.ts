import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}

/** Mesmas regras de senha do cadastro (RegisterDto). */
export class RedefinirSenhaDto {
  @IsString()
  @MinLength(1, { message: 'O link de redefinição está incompleto.' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  @MaxLength(72)
  senha: string;
}
