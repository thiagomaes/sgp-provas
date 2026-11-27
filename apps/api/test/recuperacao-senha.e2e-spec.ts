import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { RecuperacaoSenhaController } from '../src/auth/recuperacao-senha.controller.js';
import { RecuperacaoSenhaRepository } from '../src/auth/recuperacao-senha.repository.js';
import { RecuperacaoSenhaService } from '../src/auth/recuperacao-senha.service.js';

/**
 * "Esqueci minha senha" sem banco: o repositório é trocado por um falso que
 * guarda os pedidos em memória, e o link é lido do log, como no servidor.
 */
interface PedidoFalso {
  id: string;
  professorId: string;
  tokenHash: string;
  expiresAt: Date;
  usadoEm: Date | null;
}

describe('POST /auth/forgot-password e /auth/reset-password (e2e)', () => {
  let app: INestApplication;
  let pedidos: PedidoFalso[];
  let senhaHash: string;
  let anonymizedAt: Date | null;
  const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

  const repositorio = {
    buscarProfessorPorEmail: vi.fn(async (email: string) =>
      email === 'ana@escola.edu.br' ? { id: 'prof-1', email, anonymizedAt } : null,
    ),
    criar: vi.fn(async (professorId: string, tokenHash: string, expiresAt: Date) => {
      pedidos.forEach((pedido) => (pedido.usadoEm ??= new Date()));
      pedidos.push({ id: `rec-${pedidos.length}`, professorId, tokenHash, expiresAt, usadoEm: null });
    }),
    buscar: vi.fn(async (tokenHash: string) => {
      const pedido = pedidos.find((p) => p.tokenHash === tokenHash);
      return pedido ? { ...pedido, professor: { anonymizedAt } } : null;
    }),
    trocarSenha: vi.fn(async (id: string, _professorId: string, novoHash: string) => {
      const pedido = pedidos.find((p) => p.id === id);
      if (!pedido || pedido.usadoEm) return false;
      pedido.usadoEm = new Date();
      senhaHash = novoHash;
      return true;
    }),
  };

  const pedir = (email: string) => request(app.getHttpServer()).post('/auth/forgot-password').send({ email });
  const redefinir = (token: string, senha: string) =>
    request(app.getHttpServer()).post('/auth/reset-password').send({ token, senha });

  /** Token do último link escrito no log. */
  const tokenDoLog = () => {
    const mensagem = String(log.mock.calls.at(-1)?.[0] ?? '');
    return /token=([0-9a-f]+)/.exec(mensagem)?.[1] ?? '';
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [RecuperacaoSenhaController],
      providers: [
        RecuperacaoSenhaService,
        { provide: RecuperacaoSenhaRepository, useValue: repositorio },
        { provide: ConfigService, useValue: { get: () => 'https://sgp.exemplo' } },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    pedidos = [];
    senhaHash = 'hash-antigo';
    anonymizedAt = null;
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('gera um link de uso único que troca a senha', async () => {
    await pedir('Ana@Escola.edu.br').expect(204);

    const token = tokenDoLog();
    expect(token).toHaveLength(64);
    expect(String(log.mock.calls.at(-1)?.[0])).toContain('https://sgp.exemplo/redefinir-senha?token=');
    // O banco guarda só o hash do token.
    expect(pedidos[0].tokenHash).toBe(createHash('sha256').update(token).digest('hex'));

    await redefinir(token, 'senha-nova').expect(204);
    expect(await bcrypt.compare('senha-nova', senhaHash)).toBe(true);

    const deNovo = await redefinir(token, 'outra-senha').expect(400);
    expect(deNovo.body.message).toContain('inválido ou expirou');
  });

  it('e-mail que não existe responde igual e não gera link', async () => {
    await pedir('ninguem@escola.edu.br').expect(204);

    expect(repositorio.criar).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('conta anonimizada não gera link', async () => {
    anonymizedAt = new Date();

    await pedir('ana@escola.edu.br').expect(204);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('link expirado ou substituído por um pedido novo não vale', async () => {
    await pedir('ana@escola.edu.br').expect(204);
    const primeiro = tokenDoLog();
    await pedir('ana@escola.edu.br').expect(204);

    await redefinir(primeiro, 'senha-nova').expect(400);

    pedidos.at(-1)!.expiresAt = new Date(Date.now() - 1000);
    await redefinir(tokenDoLog(), 'senha-nova').expect(400);
    expect(senhaHash).toBe('hash-antigo');
  });

  it('token desconhecido ou senha curta responde 400', async () => {
    await redefinir('token-que-nao-existe', 'senha-nova').expect(400);

    const curta = await redefinir('qualquer', '123').expect(400);
    expect(curta.body.message).toContain('A senha precisa ter pelo menos 6 caracteres.');
  });
});
