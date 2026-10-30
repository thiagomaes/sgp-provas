import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClassesModule } from './classes/classes.module.js';
import { CommonModule } from './common/common.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { HealthController } from './common/health.controller.js';
import { JwtAuthGuard } from './common/jwt-auth.guard.js';
import { QuestionsModule } from './questions/questions.module.js';

/**
 * Módulo raiz da API do SGP.
 *
 * Cada módulo de feature fica na sua pasta em src/, com controller (rotas),
 * service (regras de negócio), repository (Prisma) e DTOs.
 *
 * O JwtAuthGuard é global: toda rota exige login, exceto as marcadas com
 * @Publica() (/health, /auth/login, /auth/register e /auth/refresh).
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule, AuthModule, ClassesModule, QuestionsModule, ExamsModule, ApplicationsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
