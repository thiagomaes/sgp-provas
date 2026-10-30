import { Controller, Get } from '@nestjs/common';
import { Publica } from './publica.decorator.js';

/**
 * Health check da API.
 * Usado pela web para verificar se a API está de pé (na tela de correção,
 * também para decidir quando sincronizar as correções guardadas offline).
 */
@Publica()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'sgp-api',
      timestamp: new Date().toISOString(),
    };
  }
}
