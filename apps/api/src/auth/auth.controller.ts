import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { Publica } from '../common/publica.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publica()
  @Post('register')
  registrar(@Body() dto: RegisterDto) {
    return this.auth.registrar(dto);
  }

  @Publica()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Publica()
  @Post('refresh')
  @HttpCode(200)
  renovar(@Body() dto: RefreshDto) {
    return this.auth.renovar(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async sair(@CurrentProfessor() professorId: string, @Body() dto: RefreshDto) {
    await this.auth.sair(professorId, dto.refreshToken);
  }

  @Get('me')
  eu(@CurrentProfessor() professorId: string) {
    return this.auth.eu(professorId);
  }
}
