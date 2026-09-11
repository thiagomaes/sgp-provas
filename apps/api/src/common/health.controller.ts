import { Controller, Get } from '@nestjs/common';

/**
 * Health check da API.
 * Usado pelo web e pelo app mobile para verificar se a API está de pé
 * (no mobile, também para decidir quando tentar sincronizar a fila offline).
 */
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
