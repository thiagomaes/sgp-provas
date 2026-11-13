import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthRepository } from '../src/auth/auth.repository.js';
import { AuthService } from '../src/auth/auth.service.js';

/**
 * Limite de tentativas do POST /auth/login sem banco: o repositório é trocado
 * por um falso que guarda as tentativas em memória.
 */
interface TentativaFalsa {
  email: string;
  ip: string;
  sucesso: boolean;
  criadaEm: Date;
}

describe('POST /auth/login com limite de tentativas (e2e)', () => {
  let app: INestApplication;
  let tentativas: TentativaFalsa[];
  const senhaHash = bcrypt.hashSync('senha-certa', 4);
  const professores = ['ana@escola.edu.br', 'bia@escola.edu.br'].map((email, indice) => ({
    id: `prof-${indice}`,
    nome: email,
    email,
    passwordHash: senhaHash,
    anonymizedAt: null,
  }));

  const repositorio = {
    buscarPorEmail: vi.fn(async (email: string) => professores.find((p) => p.email === email) ?? null),
    tentativasDoEmail: vi.fn(async (email: string) => tentativas.filter((t) => t.email === email)),
    tentativasDoIp: vi.fn(async (ip: string) => tentativas.filter((t) => t.ip === ip && !t.sucesso)),
    registrarTentativa: vi.fn(async (email: string, ip: string, sucesso: boolean) => {
      tentativas.push({ email, ip, sucesso, criadaEm: new Date() });
    }),
    salvarRefreshToken: vi.fn(async () => undefined),
  };

  const entrar = (email: string, senha: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, senha });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repositorio },
        { provide: JwtService, useValue: { signAsync: async () => 'token' } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'segredo' } },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    tentativas = [];
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('5 senhas erradas bloqueiam a 6ª tentativa, mesmo com a senha certa', async () => {
    for (let vez = 0; vez < 5; vez++) {
      const errada = await entrar('ana@escola.edu.br', 'senha-errada').expect(401);
      expect(errada.body.message).toBe('E-mail ou senha incorretos.');
    }

    const resposta = await entrar('ana@escola.edu.br', 'senha-certa').expect(429);

    expect(resposta.body.message).toBe('Muitas tentativas de login. Tente de novo em 15 minutos.');
    expect(Number(resposta.headers['retry-after'])).toBeGreaterThan(14 * 60);
    expect(Number(resposta.headers['retry-after'])).toBeLessThanOrEqual(15 * 60);
  });

  it('outro e-mail continua entrando', async () => {
    for (let vez = 0; vez < 5; vez++) await entrar('ana@escola.edu.br', 'senha-errada');

    await entrar('ana@escola.edu.br', 'senha-certa').expect(429);
    const resposta = await entrar('bia@escola.edu.br', 'senha-certa').expect(200);

    expect(resposta.body.professor.email).toBe('bia@escola.edu.br');
  });

  it('não confere a senha nem grava a tentativa de quem está bloqueado', async () => {
    for (let vez = 0; vez < 5; vez++) await entrar('ana@escola.edu.br', 'senha-errada');
    const comparar = vi.spyOn(bcrypt, 'compare');

    await entrar('ana@escola.edu.br', 'senha-certa').expect(429);

    expect(comparar).not.toHaveBeenCalled();
    expect(tentativas).toHaveLength(5);
    comparar.mockRestore();
  });

  it('e-mail que não existe também é limitado, com a mesma resposta', async () => {
    for (let vez = 0; vez < 5; vez++) {
      const resposta = await entrar('ninguem@escola.edu.br', 'qualquer').expect(401);
      expect(resposta.body.message).toBe('E-mail ou senha incorretos.');
    }

    await entrar('ninguem@escola.edu.br', 'qualquer').expect(429);
  });

  it('login certo grava a tentativa e zera a contagem do e-mail', async () => {
    for (let vez = 0; vez < 4; vez++) await entrar('ana@escola.edu.br', 'senha-errada');
    await entrar('ana@escola.edu.br', 'senha-certa').expect(200);

    await entrar('ana@escola.edu.br', 'senha-errada').expect(401);
    await entrar('ana@escola.edu.br', 'senha-certa').expect(200);

    expect(tentativas.filter((t) => t.sucesso)).toHaveLength(2);
  });

  it('bloqueia o IP depois de 20 falhas, mesmo trocando de e-mail', async () => {
    for (let vez = 0; vez < 20; vez++) await entrar(`aluno${vez}@escola.edu.br`, 'errada').expect(401);

    await entrar('bia@escola.edu.br', 'senha-certa').expect(429);
  });

  it('dado inválido não conta como tentativa', async () => {
    await entrar('nao-e-email', 'senha').expect(400);

    expect(repositorio.registrarTentativa).not.toHaveBeenCalled();
  });
});
