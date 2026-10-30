import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestAutenticado } from './jwt-auth.guard.js';

/**
 * Id do professor logado, preenchido pelo JwtAuthGuard.
 * Uso: metodo(@CurrentProfessor() professorId: string)
 */
export const CurrentProfessor = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): string =>
    contexto.switchToHttp().getRequest<RequestAutenticado>().professorId,
);
