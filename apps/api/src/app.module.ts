import { Module } from '@nestjs/common';
import { HealthController } from './common/health.controller.js';

/**
 * Módulo raiz da API do SGP.
 *
 * Os módulos de feature (auth, classes, exams, applications, corrections,
 * reports, sync) serão registrados aqui conforme forem implementados —
 * cada um na sua pasta em src/.
 */
@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
