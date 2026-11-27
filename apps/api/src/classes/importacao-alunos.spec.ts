import { conferirImportacao } from './importacao-alunos.js';

describe('conferirImportacao', () => {
  it('lista sem repetição e sem aluno já cadastrado não tem problema', () => {
    const alunos = [
      { nome: 'Ana Souza', matricula: '2026001' },
      { nome: 'Bruno Lima', matricula: '2026002' },
    ];

    expect(conferirImportacao(alunos, ['2026009'])).toEqual([]);
  });

  it('aponta a matrícula repetida dentro da planilha uma vez só', () => {
    const alunos = [
      { nome: 'Ana Souza', matricula: '2026001' },
      { nome: 'Ana S.', matricula: '2026001' },
      { nome: 'Ana de novo', matricula: '2026001' },
    ];

    expect(conferirImportacao(alunos, [])).toEqual(['Matrícula repetida na planilha: 2026001.']);
  });

  it('aponta a matrícula que já está na turma', () => {
    const alunos = [
      { nome: 'Ana Souza', matricula: '2026001' },
      { nome: 'Bruno Lima', matricula: '2026002' },
    ];

    expect(conferirImportacao(alunos, ['2026002'])).toEqual([
      'Já existe aluno nesta turma com a matrícula: 2026002.',
    ]);
  });

  it('aponta os dois problemas juntos', () => {
    const alunos = [
      { nome: 'Ana Souza', matricula: '2026001' },
      { nome: 'Ana S.', matricula: '2026001' },
    ];

    expect(conferirImportacao(alunos, ['2026001'])).toHaveLength(2);
  });
});
