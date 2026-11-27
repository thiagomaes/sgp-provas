import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { RecuperacaoSenhaController } from './recuperacao-senha.controller.js';
import { RecuperacaoSenhaRepository } from './recuperacao-senha.repository.js';
import { RecuperacaoSenhaService } from './recuperacao-senha.service.js';

@Module({
  controllers: [AuthController, RecuperacaoSenhaController],
  providers: [AuthService, AuthRepository, RecuperacaoSenhaService, RecuperacaoSenhaRepository],
})
export class AuthModule {}
