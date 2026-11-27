import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateQuestaoDto, FiltroQuestoesDto, UpdateQuestaoDto } from './questao.dto.js';

function mensagens(erros: ValidationError[]): string[] {
  return erros.flatMap((erro) => [
    ...Object.values(erro.constraints ?? {}),
    ...mensagens(erro.children ?? []),
  ]);
}

async function validar<T extends object>(classe: new () => T, dados: object) {
  return mensagens(await validate(plainToInstance(classe, dados)));
}

const objetiva = {
  enunciado: 'Quanto é 2 + 2?',
  tipo: 'objetiva',
  disciplina: 'Matemática',
  alternativas: [
    { letra: 'A', texto: '4', correta: true },
    { letra: 'B', texto: '5', correta: false },
  ],
};

describe('CreateQuestaoDto', () => {
  it('aceita objetiva e discursiva válidas', async () => {
    expect(await validar(CreateQuestaoDto, objetiva)).toEqual([]);
    expect(
      await validar(CreateQuestaoDto, {
        enunciado: 'Explique',
        tipo: 'discursiva',
        disciplina: 'Matemática',
        respostaEsperada: 'texto',
        pontuacaoMaxima: 2,
        tags: ['a'],
      }),
    ).toEqual([]);
  });

  it('exige enunciado e disciplina', async () => {
    const erros = await validar(CreateQuestaoDto, { ...objetiva, enunciado: '', disciplina: '' });
    expect(erros).toContain('Informe o enunciado.');
    expect(erros).toContain('Informe a disciplina.');
  });

  it('recusa tipo inválido', async () => {
    expect(await validar(CreateQuestaoDto, { ...objetiva, tipo: 'outra' })).toContain(
      'O tipo deve ser objetiva ou discursiva.',
    );
  });

  it('recusa disciplina com mais de 80 caracteres', async () => {
    expect((await validar(CreateQuestaoDto, { ...objetiva, disciplina: 'a'.repeat(81) })).length).toBeGreaterThan(0);
  });

  it('recusa alternativa com letra fora de A a E ou texto vazio', async () => {
    const erros = await validar(CreateQuestaoDto, {
      ...objetiva,
      alternativas: [{ letra: 'F', texto: '', correta: true }],
    });
    expect(erros).toContain('A letra da alternativa deve ser de A a E.');
    expect(erros).toContain('O texto da alternativa não pode ficar vazio.');
  });

  it('recusa tags que não são texto e pontuação inválida', async () => {
    expect((await validar(CreateQuestaoDto, { ...objetiva, tags: [1] })).length).toBeGreaterThan(0);
    expect(await validar(CreateQuestaoDto, { ...objetiva, pontuacaoMaxima: -1 })).toContain(
      'A pontuação máxima deve ser maior que zero.',
    );
    expect(await validar(CreateQuestaoDto, { ...objetiva, pontuacaoMaxima: 'x' })).toContain(
      'A pontuação máxima deve ser um número.',
    );
  });
});

describe('UpdateQuestaoDto e FiltroQuestoesDto', () => {
  it('aceita atualização parcial, inclusive vazia', async () => {
    expect(await validar(UpdateQuestaoDto, {})).toEqual([]);
    expect(await validar(UpdateQuestaoDto, { enunciado: 'novo' })).toEqual([]);
  });

  it('valida os campos enviados na atualização', async () => {
    expect(await validar(UpdateQuestaoDto, { tipo: 'outra' })).toContain('O tipo deve ser objetiva ou discursiva.');
  });

  it('aceita filtros opcionais de busca e tag', async () => {
    expect(await validar(FiltroQuestoesDto, {})).toEqual([]);
    expect(await validar(FiltroQuestoesDto, { busca: 'a', tag: 'b' })).toEqual([]);
    expect((await validar(FiltroQuestoesDto, { busca: 1 })).length).toBeGreaterThan(0);
  });
});