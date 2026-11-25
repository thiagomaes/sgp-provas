import { statusPelasCorrecoes } from './status-aplicacao.js';

describe('status da aplicação pelas correções', () => {
  it('fica em correção enquanto faltam provas da turma', () => {
    expect(statusPelasCorrecoes(1, 30)).toBe('em-correcao');
    expect(statusPelasCorrecoes(29, 30)).toBe('em-correcao');
  });

  it('conclui quando todas as provas da turma foram corrigidas', () => {
    expect(statusPelasCorrecoes(30, 30)).toBe('concluida');
    expect(statusPelasCorrecoes(31, 30)).toBe('concluida');
  });

  it('volta para em correção quando uma correção da aplicação concluída é apagada', () => {
    expect(statusPelasCorrecoes(29, 30)).toBe('em-correcao');
  });

  it('volta para PDF gerado quando não sobra nenhuma correção', () => {
    expect(statusPelasCorrecoes(0, 30)).toBe('pdf-gerado');
  });

  it('não conclui turma sem alunos', () => {
    expect(statusPelasCorrecoes(1, 0)).toBe('em-correcao');
  });
});
