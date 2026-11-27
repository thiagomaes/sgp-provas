import { QuestionsController } from './questions.controller.js';
import type { QuestionsService } from './questions.service.js';

describe('QuestionsController', () => {
  const servico = {
    listar: vi.fn(),
    criar: vi.fn(),
    buscar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  };
  const controller = new QuestionsController(servico as unknown as QuestionsService);

  beforeEach(() => vi.clearAllMocks());

  it('lista repassando o professor e o filtro', async () => {
    servico.listar.mockResolvedValue([]);
    await controller.listar('prof-1', { busca: 'a' } as never);
    expect(servico.listar).toHaveBeenCalledWith('prof-1', { busca: 'a' });
  });

  it('cria repassando o professor e o corpo', async () => {
    servico.criar.mockResolvedValue({ id: 'q-1' });
    const dto = { enunciado: 'x' } as never;
    expect(await controller.criar('prof-1', dto)).toEqual({ id: 'q-1' });
    expect(servico.criar).toHaveBeenCalledWith('prof-1', dto);
  });

  it('busca por id', async () => {
    servico.buscar.mockResolvedValue({ id: 'q-1' });
    expect(await controller.buscar('prof-1', 'q-1')).toEqual({ id: 'q-1' });
    expect(servico.buscar).toHaveBeenCalledWith('prof-1', 'q-1');
  });

  it('atualiza por id', async () => {
    servico.atualizar.mockResolvedValue({ id: 'q-1' });
    const dto = { enunciado: 'y' } as never;
    await controller.atualizar('prof-1', 'q-1', dto);
    expect(servico.atualizar).toHaveBeenCalledWith('prof-1', 'q-1', dto);
  });

  it('exclui por id', async () => {
    servico.excluir.mockResolvedValue(undefined);
    await controller.excluir('prof-1', 'q-1');
    expect(servico.excluir).toHaveBeenCalledWith('prof-1', 'q-1');
  });
});