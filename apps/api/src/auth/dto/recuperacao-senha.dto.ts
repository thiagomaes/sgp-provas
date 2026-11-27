import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(191, { message: 'O e-mail pode ter no máximo 191 caracteres.' })
  email: string;
}

/** Mesmas regras de senha do cadastro (RegisterDto). */
export class RedefinirSenhaDto {
  @IsString({ message: 'O link de redefinição está incompleto.' })
  @MinLength(1, { message: 'O link de redefinição está incompleto.' })
  token: string;

  @IsString({ message: 'Informe a nova senha.' })
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  @MaxLength(72, { message: 'A senha pode ter no máximo 72 caracteres.' })
  senha: string;
}
