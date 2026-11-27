import { ArgumentsHost, ConflictException } from '@nestjs/common';
import {
  ErroInternoFilter,
  falhaDeConexaoComBanco,
  MENSAGEM_BANCO_FORA,
  MENSAGEM_ERRO_INTERNO,
} from './erro-interno.filter.js';

function contexto() {
  const resposta = { status: vi.fn(), json: vi.fn() };
  resposta.status.mockReturnValue(resposta);
  const host = {
    switchToHttp: () => ({ getResponse: () => resposta, getRequest: () => ({}) }),
    getArgByIndex: (i: number) => [{}, resposta][i],
    getArgs: () => [{}, resposta],
    getType: () => 'http',
  } as unknown as ArgumentsHost;
  return { resposta, host };
}

describe('ErroInternoFilter', () => {
  const adaptador = { reply: vi.fn(), isHeadersSent: vi.fn().mockReturnValue(false), end: vi.fn() };
  const filtro = new ErroInternoFilter(adaptador as never);
  vi.spyOn((filtro as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => {});

  it('erro inesperado responde 500 em português, sem a mensagem nem a stack', () => {
    const { resposta, host } = contexto();
    filtro.catch(new TypeError('questoes is not iterable'), host);
    expect(resposta.status).toHaveBeenCalledWith(500);
    expect(resposta.json).toHaveBeenCalledWith({ statusCode: 500, message: MENSAGEM_ERRO_INTERNO });
  });

  it('banco fora do ar responde 503 pedindo para tentar de novo', () => {
    const { resposta, host } = contexto();
    filtro.catch(Object.assign(new Error('Server has closed the connection.'), { code: 'P1017' }), host);
    expect(resposta.status).toHaveBeenCalledWith(503);
    expect(resposta.json).toHaveBeenCalledWith({ statusCode: 503, message: MENSAGEM_BANCO_FORA });
  });

  it('HttpException segue com o status e a mensagem dela', () => {
    const { resposta, host } = contexto();
    filtro.catch(new ConflictException('Já existe um aluno com esta matrícula nesta turma.'), host);
    expect(resposta.status).not.toHaveBeenCalled();
    expect(adaptador.reply).toHaveBeenCalledWith(
      resposta,
      expect.objectContaining({ statusCode: 409, message: 'Já existe um aluno com esta matrícula nesta turma.' }),
      409,
    );
  });

  it('reconhece só os códigos de conexão do Prisma', () => {
    expect(falhaDeConexaoComBanco({ code: 'P1001' })).toBe(true);
    expect(falhaDeConexaoComBanco({ code: 'P2028' })).toBe(true);
    expect(falhaDeConexaoComBanco({ code: 'P2002' })).toBe(false);
    expect(falhaDeConexaoComBanco(new Error('x'))).toBe(false);
  });
});
