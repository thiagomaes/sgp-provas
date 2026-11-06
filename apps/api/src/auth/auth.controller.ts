import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentProfessor } from '../common/current-professor.decorator.js';
import { Publica } from '../common/publica.decorator.js';
import { AuthService, LoginBloqueadoException } from './auth.service.js';
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
  async login(
    @Body() dto: LoginDto,
    @Req() requisicao: Request,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    // A coluna ip tem 45 caracteres, o tamanho de um IPv6 completo.
    const ip = (requisicao.ip ?? 'desconhecido').slice(0, 45);
    try {
      return await this.auth.login(dto, ip);
    } catch (erro) {
      if (erro instanceof LoginBloqueadoException) resposta.setHeader('Retry-After', String(erro.segundos));
      throw erro;
    }
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
