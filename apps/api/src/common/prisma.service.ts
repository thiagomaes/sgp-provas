import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Referência ao certificado do Aiven. O Prisma lê o arquivo pelo sslcert da
 * DATABASE_URL, e o código não abre esse caminho: ele existe para o empacotador
 * da Vercel rastrear o arquivo e levar a pasta prisma/ para a função.
 */
export const CERTIFICADO_DO_AIVEN = new URL('../../prisma/aiven-ca.pem', import.meta.url);

/**
 * Cliente do Prisma compartilhado. Só os repositories usam este serviço:
 * controllers e services nunca falam com o banco direto.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
