import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthRepository } from '../src/auth/auth.repository.js';
import { AuthService } from '../src/auth/auth.service.js';

/**
 * POST /auth/anonymize (RF13) sem banco: o repositório é trocado por um falso
 * e o professor logado é definido direto no request (o guard JWT tem os
 * próprios testes).
 */
describe('POST /auth/anonymize (e2e)', () => {
  let app: INestApplication;
  let professor: { id: string; nome: string; email: string; passwordHash: string; anonymizedAt: Date | null };

  const repositorio = {
    buscarPorId: vi.fn(async (id: string) => (id === professor.id ? professor : null)),
    anonimizar: vi.fn(async () => undefined),
  };

  const anonimizar = (corpo: object) => request(app.getHttpServer()).post('/auth/anonymize').send(corpo);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repositorio },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.use((req: Request & { professorId?: string }, _res: Response, next: NextFunction) => {
      req.professorId = 'prof-1';
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    professor = {
      id: 'prof-1',
      nome: 'Ana Costa',
      email: 'ana@escola.edu.br',
      passwordHash: bcrypt.hashSync('senha-certa', 4),
      anonymizedAt: null,
    };
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('com a senha certa, troca os dados pessoais e responde 204', async () => {
    await anonimizar({ senha: 'senha-certa' }).expect(204);

    expect(repositorio.anonimizar).toHaveBeenCalledTimes(1);
    const [id, emailAntigo, dados, nomeAluno] = repositorio.anonimizar.mock.calls[0] as unknown as [
      string,
      string,
      { nome: string; email: string; passwordHash: string },
      string,
    ];
    expect(id).toBe('prof-1');
    expect(emailAntigo).toBe('ana@escola.edu.br');
    expect(dados.nome).toBe('Professor anonimizado');
    expect(dados.email).toBe('anonimizado-prof-1@sgp.invalid');
    // A senha antiga deixa de valer.
    expect(await bcrypt.compare('senha-certa', dados.passwordHash)).toBe(false);
    expect(nomeAluno).toBe('Aluno anonimizado');
  });

  it('com a senha errada responde 403 e não anonimiza', async () => {
    const resposta = await anonimizar({ senha: 'senha-errada' }).expect(403);

    expect(resposta.body.message).toBe('Senha incorreta.');
    expect(repositorio.anonimizar).not.toHaveBeenCalled();
  });

  it('sem a senha responde 400', async () => {
    const resposta = await anonimizar({}).expect(400);

    expect(resposta.body.message).toContain('Informe a sua senha para confirmar.');
    expect(repositorio.anonimizar).not.toHaveBeenCalled();
  });

  it('conta já anonimizada responde 401', async () => {
    professor.anonymizedAt = new Date();

    await anonimizar({ senha: 'senha-certa' }).expect(401);
    expect(repositorio.anonimizar).not.toHaveBeenCalled();
  });
});
