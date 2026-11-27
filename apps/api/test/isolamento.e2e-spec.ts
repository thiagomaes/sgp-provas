import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ApplicationsController } from '../src/applications/applications.controller.js';
import { ApplicationsRepository } from '../src/applications/applications.repository.js';
import { ApplicationsService } from '../src/applications/applications.service.js';
import { ClassesController } from '../src/classes/classes.controller.js';
import { ClassesRepository } from '../src/classes/classes.repository.js';
import { ClassesService } from '../src/classes/classes.service.js';
import { CorrectionsController } from '../src/corrections/corrections.controller.js';
import { CorrectionsRepository } from '../src/corrections/corrections.repository.js';
import { CorrectionsService } from '../src/corrections/corrections.service.js';
import { ExamsController } from '../src/exams/exams.controller.js';
import { ExamsRepository } from '../src/exams/exams.repository.js';
import { ExamsService } from '../src/exams/exams.service.js';
import { QuestionsController } from '../src/questions/questions.controller.js';
import { QuestionsRepository } from '../src/questions/questions.repository.js';
import { QuestionsService } from '../src/questions/questions.service.js';
import { ReportsController } from '../src/reports/reports.controller.js';
import { ReportsRepository } from '../src/reports/reports.repository.js';
import { ReportsService } from '../src/reports/reports.service.js';

/**
 * Isolamento entre professores (T23), sem banco. Os repositórios falsos se
 * comportam como os reais: as consultas com professorId só acham o que é do
 * professor A ("prof-a"). O professor B ("prof-b") pede os ids de A em todas
 * as rotas e tem de receber 404 (ou lista vazia), sem que nenhuma escrita
 * chegue ao repositório.
 *
 * Como nos outros e2e, o professor logado é posto direto no request (o guard
 * JWT tem os próprios testes): aqui pelo cabeçalho x-professor.
 */
const A = 'prof-a';
/** Devolve `valor` só para o professor A; para os outros, `vazio`. */
const deA =
  <T>(valor: T, vazio: unknown = null) =>
  (professorId: string) =>
    professorId === A ? valor : vazio;
const doIdDeA =
  (id: string) =>
  (professorId: string, procurado: string) =>
    professorId === A && procurado === id ? { id, professorId: A } : null;

// Escritas e leituras sem professorId: o service só pode chegar nelas depois
// de conferir que o recurso é do professor logado.
const escritas = {
  turmas: { criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn(), criarAluno: vi.fn(), criarAlunos: vi.fn(), atualizarAluno: vi.fn(), excluirAluno: vi.fn(), buscarAluno: vi.fn(), contarCorrecoesDaTurma: vi.fn(), contarCorrecoesDoAluno: vi.fn() },
  questoes: { criar: vi.fn(), atualizar: vi.fn(), marcarComoExcluida: vi.fn() },
  provas: { criar: vi.fn(), atualizar: vi.fn(), marcarComoExcluida: vi.fn(), contarAplicacoesComPdf: vi.fn() },
  aplicacoes: { criarVarias: vi.fn(), excluir: vi.fn(), salvarVersoes: vi.fn(), contarCorrecoes: vi.fn(), alunosDaTurma: vi.fn() },
  correcoes: { listar: vi.fn(), buscar: vi.fn(), buscarPorClientId: vi.fn(), correcaoDoAluno: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
};

const repositorios = {
  turmas: { listar: vi.fn(deA([{ id: 't-a' }], [])), buscar: vi.fn(doIdDeA('t-a')), ...escritas.turmas },
  questoes: { listar: vi.fn(deA([{ id: 'q-a' }], [])), buscar: vi.fn(doIdDeA('q-a')), ...escritas.questoes },
  provas: {
    listar: vi.fn(deA([{ id: 'p-a' }], [])),
    buscar: vi.fn(doIdDeA('p-a')),
    idsDeQuestoesDoProfessor: vi.fn((professorId: string, ids: string[]) => (professorId === A ? ids : [])),
    ...escritas.provas,
  },
  aplicacoes: {
    listar: vi.fn(deA([{ id: 'ap-a' }], [])),
    buscar: vi.fn(doIdDeA('ap-a')),
    buscarParaPdf: vi.fn(doIdDeA('ap-a')),
    buscarParaGabarito: vi.fn(doIdDeA('ap-a')),
    buscarVersoesComGabarito: vi.fn(doIdDeA('ap-a')),
    provaDoProfessor: vi.fn(doIdDeA('p-a')),
    turmasDoProfessor: vi.fn((professorId: string, ids: string[]) => (professorId === A ? ids.map((id) => ({ id })) : [])),
    ...escritas.aplicacoes,
  },
  correcoes: { aplicacaoComGabarito: vi.fn(doIdDeA('ap-a')), ...escritas.correcoes },
  relatorios: {
    contarTurmas: vi.fn(deA(1, 0)),
    contarProvas: vi.fn(deA(1, 0)),
    aplicacoesComNotas: vi.fn(deA([{ id: 'ap-a' }], [])),
    relatoriosConsolidados: vi.fn(deA([{ id: 'ap-a' }], [])),
    relatorio: vi.fn(doIdDeA('ap-a')),
  },
};

describe('isolamento entre professores (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [
        ClassesController,
        QuestionsController,
        ExamsController,
        ApplicationsController,
        CorrectionsController,
        ReportsController,
      ],
      providers: [
        ClassesService,
        QuestionsService,
        ExamsService,
        ApplicationsService,
        CorrectionsService,
        ReportsService,
        { provide: ClassesRepository, useValue: repositorios.turmas },
        { provide: QuestionsRepository, useValue: repositorios.questoes },
        { provide: ExamsRepository, useValue: repositorios.provas },
        { provide: ApplicationsRepository, useValue: repositorios.aplicacoes },
        { provide: CorrectionsRepository, useValue: repositorios.correcoes },
        { provide: ReportsRepository, useValue: repositorios.relatorios },
      ],
    }).compile();

    app = modulo.createNestApplication({ logger: false });
    app.use((req: Request & { professorId?: string }, _res: Response, next: NextFunction) => {
      req.professorId = req.header('x-professor');
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const comoB = (metodo: 'get' | 'post' | 'patch' | 'delete', caminho: string, corpo?: object) => {
    const chamada = request(app.getHttpServer())[metodo](caminho).set('x-professor', 'prof-b');
    return corpo ? chamada.send(corpo) : chamada;
  };

  const versoes = { versoes: 1, embaralharQuestoes: false, embaralharAlternativas: false, identificarAluno: false };
  const rotasDeA: [string, 'get' | 'post' | 'patch' | 'delete', string, object?][] = [
    ['ler a turma', 'get', '/classes/t-a'],
    ['editar a turma', 'patch', '/classes/t-a', { nome: 'Invadida' }],
    ['excluir a turma', 'delete', '/classes/t-a'],
    ['adicionar aluno na turma', 'post', '/classes/t-a/students', { nome: 'Intruso', matricula: '999' }],
    ['importar alunos na turma', 'post', '/classes/t-a/students/import', { alunos: [{ nome: 'Intruso', matricula: '999' }] }],
    ['editar aluno da turma', 'patch', '/classes/t-a/students/al-a', { nome: 'Outro' }],
    ['remover aluno da turma', 'delete', '/classes/t-a/students/al-a'],
    ['ler a questão', 'get', '/questions/q-a'],
    ['editar a questão', 'patch', '/questions/q-a', { enunciado: 'Trocado' }],
    ['excluir a questão', 'delete', '/questions/q-a'],
    ['ler a prova', 'get', '/exams/p-a'],
    ['editar a prova', 'patch', '/exams/p-a', { titulo: 'Trocada' }],
    ['excluir a prova', 'delete', '/exams/p-a'],
    ['ler a aplicação', 'get', '/applications/ap-a'],
    ['ler as versões e o gabarito impresso', 'get', '/applications/ap-a/versions'],
    ['baixar o PDF', 'get', '/applications/ap-a/pdf'],
    ['ler o gabarito', 'get', '/applications/ap-a/answer-key'],
    ['gerar versões', 'post', '/applications/ap-a/generate', versoes],
    ['excluir a aplicação', 'delete', '/applications/ap-a'],
    ['listar as correções', 'get', '/applications/ap-a/corrections'],
    ['lançar correção', 'post', '/applications/ap-a/corrections', { clientCorrectionId: 'c-b', origem: 'manual', alunoId: 'al-a', nota: 5 }],
    ['editar a correção', 'patch', '/applications/ap-a/corrections/c-a', { nota: 0 }],
    ['excluir a correção', 'delete', '/applications/ap-a/corrections/c-a'],
    ['ler o relatório', 'get', '/applications/ap-a/report'],
    ['baixar o CSV das notas', 'get', '/applications/ap-a/report.csv'],
    ['baixar o Excel das notas', 'get', '/applications/ap-a/report.xlsx'],
  ];

  for (const [acao, metodo, caminho, corpo] of rotasDeA) {
    it(`B não consegue ${acao} de A: 404`, async () => {
      await comoB(metodo, caminho, corpo).expect(404);
    });
  }

  it('B não usa a prova nem a turma de A para criar aplicação', async () => {
    const resposta = await comoB('post', '/applications', { provaId: 'p-a', turmaIds: ['t-a'], data: '2026-11-27' }).expect(400);
    expect(resposta.body.message).toBe('Prova não encontrada.');
  });

  it('B não usa questões de A para montar prova', async () => {
    const resposta = await comoB('post', '/exams', {
      titulo: 'Prova de B',
      disciplina: 'Matemática',
      questoes: [{ questaoId: 'q-a', pontuacao: 10 }],
    }).expect(400);
    expect(resposta.body.message).toContain('Questões não encontradas no seu banco');
  });

  it('as listagens de B não trazem nada de A', async () => {
    for (const caminho of ['/classes', '/questions', '/exams', '/applications']) {
      const resposta = await comoB('get', caminho).expect(200);
      expect(resposta.body).toEqual([]);
    }
    const resumo = await comoB('get', '/reports/summary').expect(200);
    expect(resumo.body).toEqual({ totais: { turmas: 0, provas: 0, aplicacoesRecentes: 0 }, ultimasAplicacoes: [], medias: {} });
    const consolidado = await comoB('get', '/reports/consolidated').expect(200);
    expect(consolidado.text.trim().split('\r\n')).toHaveLength(1);
  });

  it('toda consulta usou o professor do token, e nenhuma escrita chegou ao repositório', () => {
    const consultas = Object.values(repositorios).flatMap((repositorio) =>
      Object.entries(repositorio).filter(([nome]) => !Object.values(escritas).some((grupo) => nome in grupo)),
    );
    for (const [nome, consulta] of consultas) {
      for (const argumentos of (consulta as ReturnType<typeof vi.fn>).mock.calls) {
        expect(argumentos[0], nome).toBe('prof-b');
      }
    }
    for (const grupo of Object.values(escritas)) {
      for (const [nome, metodo] of Object.entries(grupo)) {
        expect(metodo, nome).not.toHaveBeenCalled();
      }
    }
  });
});
