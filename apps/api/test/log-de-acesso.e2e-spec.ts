import { Controller, Get, HttpCode, Logger, type MiddlewareConsumer, Module, type NestModule, Post, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LogDeAcessoMiddleware } from '../src/common/log-de-acesso.js';

/**
 * O middleware registrado como no AppModule (forRoutes('*')) pega todas as
 * rotas, inclusive as que respondem erro, e lê o professorId posto depois
 * dele (aqui por um controller falso, no lugar do JwtAuthGuard).
 */
@Controller()
class RotasFalsas {
  @Get('classes')
  listar(@Req() req: { professorId?: string }) {
    req.professorId = 'prof-a';
    return [];
  }

  @Post('auth/login')
  @HttpCode(401)
  entrar() {
    return { message: 'E-mail ou senha incorretos.' };
  }
}

@Module({ controllers: [RotasFalsas] })
class ModuloDeTeste implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogDeAcessoMiddleware).forRoutes('*');
  }
}

describe('log de acesso nas rotas (e2e)', () => {
  let app: INestApplication;
  const linhas: string[] = [];

  beforeAll(async () => {
    for (const nivel of ['log', 'warn', 'error'] as const) {
      vi.spyOn(Logger.prototype, nivel).mockImplementation((texto: unknown) => {
        linhas.push(String(texto));
      });
    }
    const modulo = await Test.createTestingModule({ imports: [ModuloDeTeste] }).compile();
    app = modulo.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it('registra a rota com o professor e o login recusado sem o e-mail', async () => {
    await request(app.getHttpServer()).get('/classes?busca=x').set('Authorization', 'Bearer abc.def').expect(200);
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'ana@escola.edu.br', senha: 'x' }).expect(401);
    await request(app.getHttpServer()).get('/nao-existe').expect(404);

    const acessos = linhas.filter((linha) => /^(GET|POST) /.test(linha));
    expect(acessos).toHaveLength(3);
    expect(acessos[0]).toMatch(/^GET \/classes 200 \d+ms professor=prof-a$/);
    expect(acessos[1]).toMatch(/^POST \/auth\/login 401 \d+ms professor=-$/);
    expect(acessos[2]).toMatch(/^GET \/nao-existe 404 \d+ms professor=-$/);
    expect(acessos.join('\n')).not.toMatch(/ana@|abc\.def|senha/);
  });
});
