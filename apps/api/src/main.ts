import type { IncomingMessage, ServerResponse } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function criarApp() {
  const app = await NestFactory.create(AppModule);

  // CORS só para a web do professor. Em desenvolvimento, o Vite local
  // (localhost:5173) também é liberado.
  const origens = [process.env.WEB_ORIGIN].filter((origem): origem is string => !!origem);
  if (process.env.NODE_ENV !== 'production') {
    origens.push('http://localhost:5173');
  }
  app.enableCors({ origin: origens });

  // Valida todos os DTOs: campo a mais é recusado e os tipos são convertidos
  // (ex.: "?tag=" vira string, números do corpo viram number).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  return app;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// Na Vercel, o app é criado na primeira requisição e reaproveitado nas
// seguintes enquanto a função estiver quente.
let handlerVercel: Promise<Handler> | undefined;

/**
 * Entrada da função na Vercel. Lá não se chama app.listen(): o launcher
 * troca o listen por uma versão que nunca chama o callback, então o
 * "await app.listen()" travava o carregamento do módulo e toda rota dava
 * 500 (INTERNAL_FUNCTION_INVOCATION_FAILED). Aqui o Nest só é inicializado
 * e o Express dele atende a requisição.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  handlerVercel ??= criarApp().then(async (app) => {
    await app.init();
    return app.getHttpAdapter().getInstance() as Handler;
  });

  try {
    (await handlerVercel)(req, res);
  } catch (erro) {
    // Se a inicialização falhar (ex.: banco fora do ar), a próxima
    // requisição tenta de novo em vez de repetir o mesmo erro.
    handlerVercel = undefined;
    throw erro;
  }
}

// Fora da Vercel (npm run start:dev, start:prod) a API sobe como servidor.
if (!process.env.VERCEL) {
  const app = await criarApp();
  await app.listen(process.env.PORT ?? 3000);
}
