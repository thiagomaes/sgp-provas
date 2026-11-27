import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ApplicationsController } from '../src/applications/applications.controller.js';
import { ApplicationsRepository } from '../src/applications/applications.repository.js';
import { ApplicationsService } from '../src/applications/applications.service.js';

/**
 * GET /applications/:id/versions sem banco: o repositório falso só devolve a
 * aplicação ao professor dono dela, como o repository real filtra por professorId.
 */
const aplicacao = {
  professorId: 'prof-a',
  prova: {
    questoes: [
      {
        questaoId: 'q1',
        pontuacao: 4,
        questao: {
          tipo: 'objetiva',
          alternativas: [
            { letra: 'A', correta: true },
            { letra: 'B', correta: false },
            { letra: 'C', correta: false },
          ],
        },
      },
      { questaoId: 'q2', pontuacao: 6, questao: { tipo: 'discursiva', alternativas: [] } },
    ],
  },
  versoesProva: [
    {
      numeroVersao: 1,
      qrCodePayload: 'sgp:apl-1:v1:0a1b2c3d:aaluno-1',
      aluno: { id: 'aluno-1', nome: 'Ana Souza', matricula: '2026001' },
      layout: {
        questoes: [
          { questaoId: 'q2', ordem: 1, alternativas: [] },
          { questaoId: 'q1', ordem: 2, alternativas: ['C', 'A', 'B'] },
        ],
      },
    },
  ],
};

describe('GET /applications/:id/versions (e2e)', () => {
  let app: INestApplication;
  let professorLogado = 'prof-a';
  const repositorio = {
    buscarVersoesComGabarito: vi.fn(async (professorId: string, id: string) =>
      id === 'apl-1' && professorId === aplicacao.professorId ? aplicacao : null,
    ),
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [ApplicationsService, { provide: ApplicationsRepository, useValue: repositorio }],
    }).compile();

    app = modulo.createNestApplication();
    app.use((req: Request & { professorId?: string }, _res: Response, next: NextFunction) => {
      req.professorId = professorLogado;
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve as versões na ordem impressa, com o aluno e a correta impressa', async () => {
    professorLogado = 'prof-a';
    const resposta = await request(app.getHttpServer()).get('/applications/apl-1/versions').expect(200);

    expect(resposta.body).toEqual([
      {
        numeroVersao: 1,
        qrCodePayload: 'sgp:apl-1:v1:0a1b2c3d:aaluno-1',
        aluno: { id: 'aluno-1', nome: 'Ana Souza', matricula: '2026001' },
        questoes: [
          { ordem: 1, questaoId: 'q2', tipo: 'discursiva', pontuacao: 6, alternativas: [], corretaImpressa: null },
          { ordem: 2, questaoId: 'q1', tipo: 'objetiva', pontuacao: 4, alternativas: ['C', 'A', 'B'], corretaImpressa: 'B' },
        ],
      },
    ]);
  });

  it('outro professor recebe 404', async () => {
    professorLogado = 'prof-b';
    const resposta = await request(app.getHttpServer()).get('/applications/apl-1/versions').expect(404);

    expect(resposta.body.message).toBe('Aplicação não encontrada.');
    expect(repositorio.buscarVersoesComGabarito).toHaveBeenLastCalledWith('prof-b', 'apl-1');
  });
});
