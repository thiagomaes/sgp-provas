import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { caminhoSemConsulta, linhaDeAcesso, LogDeAcessoMiddleware } from './log-de-acesso.js';

/** Requisição e resposta falsas do Express: a resposta avisa "finish" quando termina. */
function requisicao(metodo: string, url: string, extra: Record<string, unknown> = {}) {
  return { method: metodo, originalUrl: url, url, ...extra } as never;
}
function resposta(status: number) {
  const res = new EventEmitter() as EventEmitter & { statusCode: number };
  res.statusCode = status;
  return res;
}

describe('log de acesso', () => {
  let linhas: { nivel: string; texto: string }[];
  beforeEach(() => {
    linhas = [];
    for (const nivel of ['log', 'warn', 'error'] as const) {
      vi.spyOn(Logger.prototype, nivel).mockImplementation((texto: unknown) => {
        linhas.push({ nivel, texto: String(texto) });
      });
    }
  });
  afterEach(() => vi.restoreAllMocks());

  function atender(req: never, status: number) {
    const res = resposta(status);
    const next = vi.fn();
    new LogDeAcessoMiddleware().use(req, res as never, next);
    expect(next).toHaveBeenCalled();
    res.emit('finish');
    return linhas.at(-1)!;
  }

  it('registra método, rota, status, tempo e o professor logado', () => {
    const linha = atender(requisicao('GET', '/classes/t1', { professorId: 'prof-a' }), 200);
    expect(linha.nivel).toBe('log');
    expect(linha.texto).toMatch(/^GET \/classes\/t1 200 \d+ms professor=prof-a$/);
  });

  it('login com falha sai como aviso, sem e-mail, senha nem token', () => {
    const req = requisicao('POST', '/auth/login', {
      body: { email: 'ana.costa@escola.edu.br', senha: 'segredo123' },
      headers: { authorization: 'Bearer eyJ.token.secreto' },
    });
    const linha = atender(req, 401);
    expect(linha.nivel).toBe('warn');
    expect(linha.texto).toMatch(/^POST \/auth\/login 401 \d+ms professor=-$/);
    expect(linha.texto).not.toMatch(/ana\.costa|escola|segredo|eyJ|Bearer/);
  });

  it('429 do limite de login aparece no log', () => {
    expect(atender(requisicao('POST', '/auth/login'), 429).texto).toContain('POST /auth/login 429');
  });

  it('5xx sai como erro', () => {
    expect(atender(requisicao('GET', '/reports/summary', { professorId: 'p' }), 500).nivel).toBe('error');
  });

  it('não registra a query string', () => {
    expect(caminhoSemConsulta('/questions?busca=ana.costa@escola.edu.br')).toBe('/questions');
    expect(atender(requisicao('GET', '/questions?busca=segredo'), 200).texto).not.toContain('segredo');
  });

  it('monta a linha num formato fixo', () => {
    expect(linhaDeAcesso({ metodo: 'DELETE', caminho: '/exams/p1', status: 204, ms: 12, professorId: 'x' })).toBe(
      'DELETE /exams/p1 204 12ms professor=x',
    );
  });
});
