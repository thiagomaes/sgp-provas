import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Libera o consumo pela web do professor (Vite) e pelo app mobile em dev.
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
