import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Informe o nome do professor.' })
  @MinLength(2, { message: 'Informe o nome do professor.' })
  @MaxLength(120, { message: 'O nome pode ter no máximo 120 caracteres.' })
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(191, { message: 'O e-mail pode ter no máximo 191 caracteres.' })
  email: string;

  @IsString({ message: 'Informe a senha.' })
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  @MaxLength(72, { message: 'A senha pode ter no máximo 72 caracteres.' })
  senha: string;
}
