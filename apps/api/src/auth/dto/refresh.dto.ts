import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @IsString()
  @MinLength(1, { message: 'Informe o refresh token.' })
  refreshToken: string;
}
