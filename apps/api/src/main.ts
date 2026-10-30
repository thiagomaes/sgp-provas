import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
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

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
