import { statusPelasCorrecoes } from './status-aplicacao.js';

const turmaDe30 = { totalAlunos: 30 };

describe('status da aplicação pelas correções', () => {
  it('fica em correção enquanto faltam alunos da turma', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 1, alunosCorrigidos: 1 })).toBe('em-correcao');
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 29, alunosCorrigidos: 29 })).toBe('em-correcao');
  });

  it('conclui quando todos os alunos da turma têm correção', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 30, alunosCorrigidos: 30 })).toBe('concluida');
  });

  it('não conclui só porque há correções demais: conta alunos distintos', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 30, alunosCorrigidos: 12 })).toBe('em-correcao');
  });

  it('não conta correção ainda sem aluno como aluno corrigido', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 30, alunosCorrigidos: 29 })).toBe('em-correcao');
  });

  it('volta para em correção quando uma correção da aplicação concluída é apagada', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 29, alunosCorrigidos: 29 })).toBe('em-correcao');
  });

  it('volta para PDF gerado quando não sobra nenhuma correção', () => {
    expect(statusPelasCorrecoes({ ...turmaDe30, correcoes: 0, alunosCorrigidos: 0 })).toBe('pdf-gerado');
  });

  it('não conclui turma sem alunos', () => {
    expect(statusPelasCorrecoes({ totalAlunos: 0, correcoes: 1, alunosCorrigidos: 0 })).toBe('em-correcao');
  });
});
