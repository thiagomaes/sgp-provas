import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome do professor.' })
  @MaxLength(120)
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  @MaxLength(72)
  senha: string;
}
