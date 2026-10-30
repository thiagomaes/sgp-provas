import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service.js';

/**
 * Base compartilhada por todos os módulos: o PrismaService (usado pelos
 * repositories) e o JwtService já configurado com o segredo do access token.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CommonModule {}
