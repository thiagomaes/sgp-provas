/**
 * Seed do SGP: popula o banco com os MESMOS dados dos mocks da web
 * (apps/web-professor/src/mocks), para as telas mostrarem o mesmo conteúdo
 * depois de trocarem o mock pela API. Os mocks são só lidos daqui; nada é
 * copiado, então não há duas versões dos dados para manter.
 *
 * Pode rodar quantas vezes quiser: os registros principais usam upsert pelo
 * id dos mocks e os filhos usam createMany com skipDuplicates.
 *
 * Login da professora do seed: ana.costa@escola.edu.br / sgp2026
 *
 * Rodar: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { aplicacoes } from '../../web-professor/src/mocks/aplicacoes';
import { correcoes } from '../../web-professor/src/mocks/correcoes';
import { provas } from '../../web-professor/src/mocks/provas';
import { questoes } from '../../web-professor/src/mocks/questoes';
import { professoraLogada, turmas } from '../../web-professor/src/mocks/turmas';
import { montarLayout, type Letra } from '../src/applications/versoes.js';

const SENHA_DO_SEED = 'sgp2026';

const prisma = new PrismaClient();

/** "2026-08-28" → meio-dia UTC, para o dia não mudar com o fuso. */
function dia(texto: string): Date {
  return new Date(`${texto}T12:00:00Z`);
}

async function main() {
  const professorId = professoraLogada.id;
  const passwordHash = await bcrypt.hash(SENHA_DO_SEED, 10);

  await prisma.professor.upsert({
    where: { id: professorId },
    update: { nome: professoraLogada.nome, email: professoraLogada.email, passwordHash },
    create: {
      id: professorId,
      nome: professoraLogada.nome,
      email: professoraLogada.email,
      passwordHash,
    },
  });

  for (const turma of turmas) {
    const dados = {
      nome: turma.nome,
      disciplina: turma.disciplina,
      ano: turma.ano,
      turno: turma.turno,
    };
    await prisma.turma.upsert({
      where: { id: turma.id },
      update: dados,
      create: { id: turma.id, professorId, ...dados },
    });
    await prisma.aluno.createMany({
      data: turma.alunos.map((aluno) => ({
        id: aluno.id,
        turmaId: turma.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
      })),
      skipDuplicates: true,
    });
  }

  for (const questao of questoes) {
    const dados = {
      enunciado: questao.enunciado,
      tipo: questao.tipo,
      respostaEsperada: questao.respostaEsperada ?? null,
      pontuacaoMaxima: questao.pontuacaoMaxima ?? null,
      disciplina: questao.disciplina,
      tags: questao.tags,
      criadaEm: dia(questao.criadaEm),
    };
    await prisma.questao.upsert({
      where: { id: questao.id },
      update: dados,
      create: { id: questao.id, professorId, ...dados },
    });
    await prisma.alternativa.createMany({
      data: (questao.alternativas ?? []).map((alternativa) => ({
        id: `${questao.id}-${alternativa.letra}`,
        questaoId: questao.id,
        letra: alternativa.letra,
        texto: alternativa.texto,
        correta: alternativa.correta,
      })),
      skipDuplicates: true,
    });
  }

  for (const prova of provas) {
    const dados = {
      titulo: prova.titulo,
      disciplina: prova.disciplina,
      totalPontos: prova.totalPontos,
      criadaEm: dia(prova.criadaEm),
    };
    await prisma.prova.upsert({
      where: { id: prova.id },
      update: dados,
      create: { id: prova.id, professorId, ...dados },
    });
    await prisma.provaQuestao.createMany({
      data: prova.questoes.map((item) => ({
        id: `${prova.id}-${item.questaoId}`,
        provaId: prova.id,
        questaoId: item.questaoId,
        ordem: item.ordem,
        pontuacao: item.pontuacao,
      })),
      skipDuplicates: true,
    });
  }

  for (const aplicacao of aplicacoes) {
    const dados = {
      provaId: aplicacao.provaId,
      turmaId: aplicacao.turmaId,
      data: new Date(`${aplicacao.data}T00:00:00Z`),
      versoes: aplicacao.versoes,
      embaralharQuestoes: aplicacao.embaralharQuestoes,
      embaralharAlternativas: aplicacao.embaralharAlternativas,
      identificarAluno: aplicacao.identificarAluno,
      status: aplicacao.status,
      corrigidas: aplicacao.corrigidas,
    };
    await prisma.aplicacao.upsert({
      where: { id: aplicacao.id },
      update: dados,
      create: { id: aplicacao.id, professorId, ...dados },
    });

    // Aplicação com PDF gerado já tem as versões, como se tivesse passado
    // por POST /applications/:id/generate. A semente fixa deixa o layout igual
    // em todas as execuções do seed.
    if (aplicacao.status === 'rascunho') continue;
    const prova = provas.find((item) => item.id === aplicacao.provaId);
    if (!prova) continue;
    const questoesDaProva = prova.questoes.map((item) => ({
      questaoId: item.questaoId,
      ordem: item.ordem,
      letras: (questoes.find((q) => q.id === item.questaoId)?.alternativas ?? []).map(
        (alternativa) => alternativa.letra as Letra,
      ),
    }));
    await prisma.versaoProva.createMany({
      data: Array.from({ length: aplicacao.versoes }, (_, indice) => ({
        id: `${aplicacao.id}-v${indice + 1}`,
        aplicacaoId: aplicacao.id,
        numeroVersao: indice + 1,
        layout: montarLayout(questoesDaProva, indice + 1, aplicacao, aplicacao.id) as object,
        qrCodePayload: `sgp:${aplicacao.id}:v${indice + 1}`,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.correcao.createMany({
    data: correcoes.map((correcao) => ({
      id: correcao.id,
      aplicacaoId: correcao.aplicacaoId,
      alunoId: correcao.alunoId,
      versao: correcao.versao,
      nota: correcao.nota,
      respostas: correcao.respostas as object[],
      origem: correcao.origem,
      clientCorrectionId: correcao.clientCorrectionId,
      statusSync: correcao.statusSync,
      corrigidaEm: dia(correcao.corrigidaEm),
    })),
    skipDuplicates: true,
  });

  const contagem = {
    professores: await prisma.professor.count(),
    turmas: await prisma.turma.count(),
    alunos: await prisma.aluno.count(),
    questoes: await prisma.questao.count(),
    alternativas: await prisma.alternativa.count(),
    provas: await prisma.prova.count(),
    aplicacoes: await prisma.aplicacao.count(),
    versoes: await prisma.versaoProva.count(),
    correcoes: await prisma.correcao.count(),
  };
  console.log('Seed concluído:', contagem);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
