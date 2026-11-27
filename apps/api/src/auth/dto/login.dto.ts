import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(191, { message: 'O e-mail pode ter no máximo 191 caracteres.' })
  email: string;

  @IsString({ message: 'Informe a senha.' })
  @MinLength(1, { message: 'Informe a senha.' })
  @MaxLength(72, { message: 'A senha pode ter no máximo 72 caracteres.' })
  senha: string;
}
