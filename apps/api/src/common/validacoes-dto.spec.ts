import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateAplicacaoDto } from '../applications/dto/aplicacao.dto.js';
import { AnonimizarDto } from '../auth/dto/anonimizar.dto.js';
import { LoginDto } from '../auth/dto/login.dto.js';
import { EsqueciSenhaDto, RedefinirSenhaDto } from '../auth/dto/recuperacao-senha.dto.js';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { CreateAlunoDto } from '../classes/dto/aluno.dto.js';
import { CreateTurmaDto } from '../classes/dto/turma.dto.js';
import { CreateCorrecaoDto, UpdateCorrecaoDto } from '../corrections/dto/correcao.dto.js';
import { CreateProvaDto } from '../exams/dto/prova.dto.js';
import { CreateQuestaoDto } from '../questions/dto/questao.dto.js';

/**
 * Casos de borda dos formulários (T22): cada DTO recusa vazio, tamanho a mais e
 * tipo errado com mensagem em português, a mesma que a tela mostra.
 */
function mensagens(erros: ValidationError[]): string[] {
  return erros.flatMap((erro) => [...Object.values(erro.constraints ?? {}), ...mensagens(erro.children ?? [])]);
}

async function validar<T extends object>(classe: new () => T, dados: object) {
  return mensagens(await validate(plainToInstance(classe, dados)));
}

const texto = (tamanho: number) => 'a'.repeat(tamanho);
/** Mensagens padrão do class-validator, em inglês. */
const EM_INGLES = /must|should|shorter|longer|longer than|equal to/i;

describe('validações dos DTOs (T22)', () => {
  const casos: [string, new () => object, object, string][] = [
    ['login com e-mail gigante', LoginDto, { email: `${texto(190)}@x.com`, senha: 'x' }, 'O e-mail pode ter no máximo 191 caracteres.'],
    ['login sem senha', LoginDto, { email: 'a@b.com', senha: '' }, 'Informe a senha.'],
    ['cadastro com nome de 1 letra', RegisterDto, { nome: 'A', email: 'a@b.com', senha: '123456' }, 'Informe o nome do professor.'],
    ['cadastro com nome de 121 letras', RegisterDto, { nome: texto(121), email: 'a@b.com', senha: '123456' }, 'O nome pode ter no máximo 120 caracteres.'],
    ['cadastro com senha de 73 caracteres', RegisterDto, { nome: 'Ana', email: 'a@b.com', senha: texto(73) }, 'A senha pode ter no máximo 72 caracteres.'],
    ['cadastro com e-mail inválido', RegisterDto, { nome: 'Ana', email: 'ana', senha: '123456' }, 'Informe um e-mail válido.'],
    ['esqueci a senha com e-mail gigante', EsqueciSenhaDto, { email: `${texto(190)}@x.com` }, 'O e-mail pode ter no máximo 191 caracteres.'],
    ['redefinir com senha curta', RedefinirSenhaDto, { token: 't', senha: '123' }, 'A senha precisa ter pelo menos 6 caracteres.'],
    ['anonimizar sem senha', AnonimizarDto, { senha: '' }, 'Informe a sua senha para confirmar.'],
    ['turma com nome de 121 letras', CreateTurmaDto, { nome: texto(121), disciplina: 'M', ano: '1', turno: 'Manhã' }, 'O nome da turma pode ter no máximo 120 caracteres.'],
    ['turma com turno inválido', CreateTurmaDto, { nome: 'T', disciplina: 'M', ano: '1', turno: 'Madrugada' }, 'O turno deve ser Manhã, Tarde ou Noite.'],
    ['aluno com matrícula de 31 caracteres', CreateAlunoDto, { nome: 'Ana', matricula: texto(31) }, 'A matrícula pode ter no máximo 30 caracteres.'],
    ['aluno sem nome', CreateAlunoDto, { nome: '', matricula: '1' }, 'Informe o nome do aluno.'],
    ['questão com enunciado de 10001 caracteres', CreateQuestaoDto, { enunciado: texto(10001), tipo: 'discursiva', disciplina: 'M', pontuacaoMaxima: 1 }, 'O enunciado pode ter no máximo 10000 caracteres.'],
    ['questão com pontuação negativa', CreateQuestaoDto, { enunciado: 'E', tipo: 'discursiva', disciplina: 'M', pontuacaoMaxima: -1 }, 'A pontuação máxima deve ser maior que zero.'],
    ['alternativa vazia', CreateQuestaoDto, { enunciado: 'E', tipo: 'objetiva', disciplina: 'M', alternativas: [{ letra: 'A', texto: '', correta: true }] }, 'O texto da alternativa não pode ficar vazio.'],
    ['prova com título de 151 caracteres', CreateProvaDto, { titulo: texto(151), disciplina: 'M', questoes: [] }, 'O título da prova pode ter no máximo 150 caracteres.'],
    ['prova com pontuação zero', CreateProvaDto, { titulo: 'P', disciplina: 'M', questoes: [{ questaoId: 'q1', pontuacao: 0 }] }, 'A pontuação de cada questão deve ser maior que zero.'],
    ['aplicação sem turma', CreateAplicacaoDto, { provaId: 'p1', turmaIds: [], data: '2026-11-27' }, 'Escolha pelo menos uma turma.'],
    ['aplicação com 201 versões', CreateAplicacaoDto, { provaId: 'p1', turmaIds: ['t1'], data: '2026-11-27', versoes: 201 }, 'O máximo é 200 versões.'],
    ['correção com nota negativa', CreateCorrecaoDto, { clientCorrectionId: 'c1', nota: -1 }, 'A nota não pode ser negativa.'],
    ['edição de nota com texto', UpdateCorrecaoDto, { nota: 'dez' }, 'A nota deve ser um número.'],
  ];

  for (const [nome, classe, dados, esperada] of casos) {
    it(`${nome}: "${esperada}"`, async () => {
      const recebidas = await validar(classe, dados);
      expect(recebidas).toContain(esperada);
      expect(recebidas.filter((mensagem) => EM_INGLES.test(mensagem))).toEqual([]);
    });
  }
});
