import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Publica } from '../common/publica.decorator.js';
import { EsqueciSenhaDto, RedefinirSenhaDto } from './dto/recuperacao-senha.dto.js';
import { RecuperacaoSenhaService } from './recuperacao-senha.service.js';

/** Recuperação de senha (RF01). As duas rotas são abertas: quem esqueceu a senha não tem sessão. */
@Controller('auth')
export class RecuperacaoSenhaController {
  constructor(private readonly recuperacao: RecuperacaoSenhaService) {}

  @Publica()
  @Post('forgot-password')
  @HttpCode(204)
  async pedir(@Body() dto: EsqueciSenhaDto) {
    await this.recuperacao.pedir(dto.email);
  }

  @Publica()
  @Post('reset-password')
  @HttpCode(204)
  async redefinir(@Body() dto: RedefinirSenhaDto) {
    await this.recuperacao.redefinir(dto.token, dto.senha);
  }
}
