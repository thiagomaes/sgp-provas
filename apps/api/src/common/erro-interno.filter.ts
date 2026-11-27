import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

export const MENSAGEM_ERRO_INTERNO = 'O servidor teve um problema. Tente de novo em instantes.';
export const MENSAGEM_BANCO_FORA = 'O banco de dados não respondeu. Tente de novo em instantes.';

/**
 * Erros do Prisma de conexão ou de tempo esgotado: P1xxx (banco fora do ar,
 * conexão fechada) e P2024/P2028 (fila de conexões e transação vencidas).
 */
export function falhaDeConexaoComBanco(erro: unknown): boolean {
  const codigo = (erro as { code?: unknown } | null)?.code;
  return typeof codigo === 'string' && (/^P1\d{3}$/.test(codigo) || codigo === 'P2024' || codigo === 'P2028');
}

/**
 * Erros que nenhuma regra tratou (bug, banco fora do ar) viravam o
 * "Internal server error" padrão do Nest, em inglês, na tela do professor.
 * Aqui eles respondem uma mensagem em português, sem stack; o detalhe vai só
 * para o log da API. Os HttpException (400, 404, 409...) seguem como antes.
 */
@Catch()
export class ErroInternoFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('ErroInterno');

  catch(excecao: unknown, host: ArgumentsHost): void {
    if (excecao instanceof HttpException) {
      super.catch(excecao, host);
      return;
    }

    this.logger.error(excecao instanceof Error ? (excecao.stack ?? excecao.message) : String(excecao));
    const bancoFora = falhaDeConexaoComBanco(excecao);
    const status = bancoFora ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message: bancoFora ? MENSAGEM_BANCO_FORA : MENSAGEM_ERRO_INTERNO });
  }
}
