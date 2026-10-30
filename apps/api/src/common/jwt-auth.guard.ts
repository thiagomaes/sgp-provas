import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ROTA_PUBLICA } from './publica.decorator.js';

/** Conteúdo do access token. */
export interface PayloadAcesso {
  /** id do professor */
  sub: string;
  email: string;
}

/** Request depois do guard: o id do professor logado fica disponível. */
export interface RequestAutenticado extends Request {
  professorId: string;
}

/**
 * Exige um access token válido no cabeçalho Authorization: Bearer <token>.
 * Registrado como guard global em AppModule; rotas abertas usam @Publica().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;

    const request = contexto.switchToHttp().getRequest<RequestAutenticado>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Faça login para acessar o sistema.');
    }

    try {
      const payload = await this.jwt.verifyAsync<PayloadAcesso>(token);
      request.professorId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida. Faça login de novo.');
    }
  }
}
