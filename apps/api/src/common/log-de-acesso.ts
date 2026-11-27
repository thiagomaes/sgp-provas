import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** O que vai para o log de cada requisição: nada de corpo, cabeçalho, token ou e-mail. */
export interface Acesso {
  metodo: string;
  /** Caminho sem a query string. */
  caminho: string;
  status: number;
  ms: number;
  /** Preenchido pelo JwtAuthGuard nas rotas com login; ausente nas abertas. */
  professorId?: string | null;
}

export function caminhoSemConsulta(url: string): string {
  return url.split('?')[0] || '/';
}

/** Ex.: "GET /classes 200 42ms professor=cmw123". */
export function linhaDeAcesso(acesso: Acesso): string {
  return `${acesso.metodo} ${acesso.caminho} ${acesso.status} ${acesso.ms}ms professor=${acesso.professorId ?? '-'}`;
}

/**
 * Log de acesso da API (RNF de segurança, T23): uma linha por requisição,
 * escrita quando a resposta termina, para pegar também os 401 do guard e os
 * 429 do limite de login. Na Vercel, aparece em Logs do projeto sgp-provas-api.
 * 4xx sai como aviso e 5xx como erro.
 */
@Injectable()
export class LogDeAcessoMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Acesso');

  use(req: Request & { professorId?: string }, res: Response, next: NextFunction): void {
    const inicio = performance.now();
    res.on('finish', () => {
      const linha = linhaDeAcesso({
        metodo: req.method,
        caminho: caminhoSemConsulta(req.originalUrl ?? req.url),
        status: res.statusCode,
        ms: Math.round(performance.now() - inicio),
        professorId: req.professorId,
      });
      if (res.statusCode >= 500) this.logger.error(linha);
      else if (res.statusCode >= 400) this.logger.warn(linha);
      else this.logger.log(linha);
    });
    next();
  }
}
