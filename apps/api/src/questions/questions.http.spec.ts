import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { QuestionsController } from './questions.controller.js';
import { QuestionsRepository } from './questions.repository.js';
import { QuestionsService } from './questions.service.js';

const repo = {
  listar: vi.fn(),
  buscar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  marcarComoExcluida: vi.fn(),
};

const alt = (letra: string, correta = false) => ({ letra, texto: `opção ${letra}`, correta });

const questaoBanco = (extra: Record<string, unknown> = {}) => ({
  id: 'q-1',
  enunciado: 'Quanto é 2 + 2?',
  tipo: 'objetiva',
  disciplina: 'Matemática',
  tags: ['soma'],
  respostaEsperada: null,
  pontuacaoMaxima: null,
  criadaEm: new Date('2026-01-10T12:00:00Z'),
  alternativas: [alt('A', true), alt('B')],
  ...extra,
});

let app: INestApplication;

beforeAll(async () => {
  Logger.overrideLogger(false);
  const modulo = await Test.createTestingModule({
    controllers: [QuestionsController],
    providers: [QuestionsService, { provide: QuestionsRepository, useValue: repo }],
  }).compile();

  app = modulo.createNestApplication();
  // Faz o papel do JwtAuthGuard: define o professor logado.
  app.use((req: { professorId?: string }, _res: unknown, next: () => void) => {
    req.professorId = 'prof-1';
    next();
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => vi.clearAllMocks());

describe('Rotas de /questions (ponta a ponta HTTP)', () => {
  it('POST cria a questão e responde 201', async () => {
    repo.criar.mockResolvedValue(questaoBanco());

    const resposta = await request(app.getHttpServer())
      .post('/questions')
      .send({ enunciado: 'Quanto é 2 + 2?', tipo: 'objetiva', disciplina: 'Matemática', alternativas: [alt('A', true), alt('B')] })
      .expect(201);

    expect(resposta.body.id).toBe('q-1');
    expect(repo.criar).toHaveBeenCalledWith('prof-1', expect.anything(), expect.any(Array));
  });

  it('POST sem enunciado responde 400 e não grava', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/questions')
      .send({ tipo: 'discursiva', disciplina: 'Mat', pontuacaoMaxima: 2 })
      .expect(400);

    expect(JSON.stringify(resposta.body)).toContain('Informe o enunciado.');
    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('POST objetiva com duas corretas responde 400 pela regra do serviço', async () => {
    await request(app.getHttpServer())
      .post('/questions')
      .send({ enunciado: 'x', tipo: 'objetiva', disciplina: 'Mat', alternativas: [alt('A', true), alt('B', true)] })
      .expect(400);

    expect(repo.criar).not.toHaveBeenCalled();
  });

  it('GET lista usando o professor logado e aceita filtro', async () => {
    repo.listar.mockResolvedValue([questaoBanco()]);

    const resposta = await request(app.getHttpServer()).get('/questions?tag=soma').expect(200);

    expect(resposta.body).toHaveLength(1);
    expect(repo.listar).toHaveBeenCalledWith('prof-1');
  });

  it('GET por id inexistente responde 404', async () => {
    repo.buscar.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/questions/nao-existe').expect(404);
  });

  it('PATCH atualiza e responde 200', async () => {
    repo.buscar.mockResolvedValue(questaoBanco());
    repo.atualizar.mockResolvedValue(questaoBanco({ enunciado: 'Novo' }));

    const resposta = await request(app.getHttpServer()).patch('/questions/q-1').send({ enunciado: 'Novo' }).expect(200);

    expect(resposta.body.enunciado).toBe('Novo');
  });

  it('DELETE responde 204 e faz soft-delete', async () => {
    repo.buscar.mockResolvedValue(questaoBanco());

    await request(app.getHttpServer()).delete('/questions/q-1').expect(204);

    expect(repo.marcarComoExcluida).toHaveBeenCalledWith('q-1');
  });
});

describe('Desempenho da listagem (sem banco)', () => {
  it('300 requisições de 50 questões com p95 abaixo de 100 ms', async () => {
    repo.listar.mockResolvedValue(Array.from({ length: 50 }, (_, i) => questaoBanco({ id: `q-${i}` })));
    const tempos: number[] = [];

    for (let i = 0; i < 300; i++) {
      const inicio = performance.now();
      await request(app.getHttpServer()).get('/questions').expect(200);
      tempos.push(performance.now() - inicio);
    }

    tempos.sort((a, b) => a - b);
    const media = tempos.reduce((soma, t) => soma + t, 0) / tempos.length;
    const p95 = tempos[Math.floor(tempos.length * 0.95)];
    console.log(`Desempenho GET /questions: média ${media.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`);

    expect(p95).toBeLessThan(100);
  });
});