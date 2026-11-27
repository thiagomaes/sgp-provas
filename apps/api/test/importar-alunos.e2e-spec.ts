import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ClassesController } from '../src/classes/classes.controller.js';
import { ClassesRepository } from '../src/classes/classes.repository.js';
import { ClassesService } from '../src/classes/classes.service.js';

/**
 * POST /classes/:id/students/import (RF03) sem banco: o repositório é trocado
 * por um falso que guarda os alunos em memória, e o professor logado é
 * definido direto no request (o guard JWT tem os próprios testes).
 */
describe('POST /classes/:id/students/import (e2e)', () => {
  let app: INestApplication;
  let alunos: { id: string; turmaId: string; nome: string; matricula: string; createdAt: Date }[];

  const turma = () => ({
    id: 't1',
    professorId: 'prof-1',
    nome: 'Matemática — 1º Ano',
    disciplina: 'Matemática',
    ano: '2026',
    turno: 'Manhã',
    createdAt: new Date(),
    alunos: [...alunos],
  });

  const repositorio = {
    buscar: vi.fn(async (professorId: string, id: string) =>
      professorId === 'prof-1' && id === 't1' ? turma() : null,
    ),
    criarAlunos: vi.fn(async (turmaId: string, novos: { nome: string; matricula: string }[]) => {
      novos.forEach((aluno, indice) =>
        alunos.push({ ...aluno, id: `novo-${indice}`, turmaId, createdAt: new Date() }),
      );
      return { count: novos.length };
    }),
  };

  const importar = (turmaId: string, corpo: object) =>
    request(app.getHttpServer()).post(`/classes/${turmaId}/students/import`).send(corpo);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [ClassesService, { provide: ClassesRepository, useValue: repositorio }],
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
    alunos = [{ id: 'a1', turmaId: 't1', nome: 'Ana Souza', matricula: '2026001', createdAt: new Date() }];
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('grava os alunos e devolve a turma com todos eles', async () => {
    const resposta = await importar('t1', {
      alunos: [
        { nome: '  Bruno Lima ', matricula: ' 2026002 ' },
        { nome: 'Carla Dias', matricula: '2026003' },
      ],
    }).expect(201);

    expect(repositorio.criarAlunos).toHaveBeenCalledWith('t1', [
      { nome: 'Bruno Lima', matricula: '2026002' },
      { nome: 'Carla Dias', matricula: '2026003' },
    ]);
    expect(resposta.body.alunos.map((aluno: { matricula: string }) => aluno.matricula)).toEqual([
      '2026001',
      '2026002',
      '2026003',
    ]);
  });

  it('matrícula repetida na planilha ou já na turma responde 409 e não grava nada', async () => {
    const resposta = await importar('t1', {
      alunos: [
        { nome: 'Ana de novo', matricula: '2026001' },
        { nome: 'Bruno Lima', matricula: '2026002' },
        { nome: 'Bruno L.', matricula: '2026002' },
      ],
    }).expect(409);

    expect(resposta.body.message).toBe(
      'Matrícula repetida na planilha: 2026002. Já existe aluno nesta turma com a matrícula: 2026001.',
    );
    expect(repositorio.criarAlunos).not.toHaveBeenCalled();
  });

  it('linha sem nome ou lista vazia responde 400', async () => {
    const semNome = await importar('t1', { alunos: [{ nome: '', matricula: '2026002' }] }).expect(400);
    // O class-validator prefixa a posição da linha: "alunos.0.Informe o nome do aluno."
    expect(semNome.body.message.join(' ')).toContain('Informe o nome do aluno.');

    const vazia = await importar('t1', { alunos: [] }).expect(400);
    expect(vazia.body.message).toContain('A planilha não tem nenhum aluno para importar.');

    expect(repositorio.criarAlunos).not.toHaveBeenCalled();
  });

  it('turma de outro professor responde 404', async () => {
    await importar('turma-de-outro', { alunos: [{ nome: 'Bruno Lima', matricula: '2026002' }] }).expect(404);
    expect(repositorio.criarAlunos).not.toHaveBeenCalled();
  });
});
