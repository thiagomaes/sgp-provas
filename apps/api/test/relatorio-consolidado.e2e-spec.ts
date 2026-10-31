import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ReportsController } from '../src/reports/reports.controller.js';
import { ReportsRepository } from '../src/reports/reports.repository.js';
import { ReportsService } from '../src/reports/reports.service.js';

/**
 * Rota GET /reports/consolidated sem banco: o repositório é trocado por um
 * falso e o professor logado é definido direto no request (o guard JWT tem
 * os próprios testes).
 */
const aplicacao = {
  id: 'apl-1',
  provaId: 'p1',
  turmaId: 't1',
  professorId: 'prof-1',
  data: new Date('2026-10-20T00:00:00Z'),
  versoes: 2,
  embaralharQuestoes: true,
  embaralharAlternativas: true,
  identificarAluno: true,
  status: 'concluida',
  corrigidas: 1,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  turma: {
    id: 't1',
    nome: 'Matemática — 1º Ano',
    disciplina: 'Matemática',
    ano: '2026',
    _count: { alunos: 2 },
    alunos: [
      { id: 'a1', turmaId: 't1', nome: 'Ana Souza', matricula: '2026001', createdAt: new Date() },
      { id: 'a2', turmaId: 't1', nome: 'Bruno Lima', matricula: '2026002', createdAt: new Date() },
    ],
  },
  prova: { id: 'p1', titulo: 'Avaliação Bimestral 1', totalPontos: 10 },
  correcoes: [
    {
      id: 'c1',
      aplicacaoId: 'apl-1',
      alunoId: 'a1',
      versao: 1,
      nota: 8.5,
      respostas: [],
      origem: 'mobile',
      clientCorrectionId: 'cli-1',
      statusSync: 'sincronizada',
      corrigidaEm: new Date('2026-10-20T12:00:00Z'),
    },
  ],
};

describe('GET /reports/consolidated (e2e)', () => {
  let app: INestApplication;
  const repositorio = { relatoriosConsolidados: vi.fn().mockResolvedValue([aplicacao]) };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [ReportsService, { provide: ReportsRepository, useValue: repositorio }],
    }).compile();

    app = modulo.createNestApplication();
    app.use((req: Request & { professorId?: string }, _res: Response, next: NextFunction) => {
      req.professorId = 'prof-1';
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve o csv por padrão, só com as aplicações do professor logado', async () => {
    const resposta = await request(app.getHttpServer()).get('/reports/consolidated').expect(200);

    expect(repositorio.relatoriosConsolidados).toHaveBeenCalledWith('prof-1');
    expect(resposta.headers['content-type']).toContain('text/csv');
    expect(resposta.headers['content-disposition']).toMatch(/^attachment; filename="relatorio-consolidado-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect(resposta.text.split('\r\n').slice(1, 3)).toEqual([
      'Avaliação Bimestral 1;Matemática — 1º Ano;2026-10-20;Ana Souza;2026001;8,5;Automática',
      'Avaliação Bimestral 1;Matemática — 1º Ano;2026-10-20;Bruno Lima;2026002;;Pendente',
    ]);
  });

  it('recusa formato ainda não suportado com 400', async () => {
    const resposta = await request(app.getHttpServer()).get('/reports/consolidated?format=pdf').expect(400);
    expect(resposta.body.message).toBe("Por enquanto só o formato 'csv' está disponível.");
  });
});
