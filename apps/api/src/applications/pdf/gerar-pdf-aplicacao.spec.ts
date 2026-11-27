import { PDFDocument } from 'pdf-lib';
import { centroDaBolinha, GRADE } from './medidas-cartao.js';
import { gerarPdfDaAplicacao } from './gerar-pdf-aplicacao.js';
import type { DadosDoPdf, QuestaoImpressa } from './tipos-pdf.js';
import { montarLayout, type Letra } from '../versoes.js';

const ENUNCIADO_LONGO = 'Considere o texto a seguir e responda com atenção. '.repeat(14);

function questao(indice: number): QuestaoImpressa {
  return {
    enunciado: indice % 4 === 0 ? ENUNCIADO_LONGO : `Enunciado da questão ${indice} com acentuação: é, ã, ç, ü.`,
    pontuacao: 0.5,
    textoDasAlternativas: { A: 'Primeira', B: 'Segunda alternativa', C: 'Terceira', D: 'Quarta', E: ENUNCIADO_LONGO },
  };
}

function dadosDeExemplo(totalDeQuestoes: number, totalDeVersoes: number): DadosDoPdf {
  const ids = Array.from({ length: totalDeQuestoes }, (_, i) => `q${i + 1}`);
  const letras: Letra[] = ['A', 'B', 'C', 'D', 'E'];
  const base = ids.map((questaoId, i) => ({ questaoId, ordem: i + 1, letras }));
  return {
    tituloDaProva: 'Prova de exemplo',
    nomeDaTurma: 'Matemática, 1º Ano',
    data: '2026-11-27',
    questoes: new Map(ids.map((id, i) => [id, questao(i + 1)])),
    versoes: Array.from({ length: totalDeVersoes }, (_, i) => ({
      numeroVersao: i + 1,
      layout: montarLayout(base, i + 1, { embaralharQuestoes: true, embaralharAlternativas: true }, 'semente'),
      qrCodePayload: `sgp:aplicacao-1:v${i + 1}:abcdef12`,
    })),
  };
}

async function paginasDoPdf(dados: DadosDoPdf) {
  const bytes = await gerarPdfDaAplicacao(dados);
  return { bytes, documento: await PDFDocument.load(bytes) };
}

describe('gerarPdfDaAplicacao', () => {
  it('gera um PDF válido em A4', async () => {
    const { bytes, documento } = await paginasDoPdf(dadosDeExemplo(5, 1));
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
    const { width, height } = documento.getPage(0).getSize();
    expect(width).toBeCloseTo(595.28, 1);
    expect(height).toBeCloseTo(841.89, 1);
  });

  it('termina cada versão com uma folha de cartão-resposta', async () => {
    const { documento } = await paginasDoPdf(dadosDeExemplo(3, 2));
    expect(documento.getPageCount()).toBe(4);
  });

  it('usa mais de uma página no caderno quando as questões não cabem em uma', async () => {
    const { documento } = await paginasDoPdf(dadosDeExemplo(20, 1));
    expect(documento.getPageCount()).toBeGreaterThan(2);
  });

  it('aceita questão discursiva e texto com caracteres fora do alfabeto latino', async () => {
    const dados = dadosDeExemplo(2, 1);
    dados.questoes.set('q1', { enunciado: 'Explique 😀 e 日本', pontuacao: 2, textoDasAlternativas: {} });
    dados.versoes[0].layout.questoes[0].alternativas = [];
    await expect(gerarPdfDaAplicacao(dados)).resolves.toBeInstanceOf(Uint8Array);
  });

  it('imprime nome e matrícula quando a versão tem aluno', async () => {
    const dados = dadosDeExemplo(2, 1);
    dados.versoes[0].aluno = { nome: 'Ana '.repeat(60), matricula: '2026001' };
    await expect(gerarPdfDaAplicacao(dados)).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe('medidas do cartão-resposta', () => {
  it('bate com a tabela de coordenadas do documento', () => {
    expect(centroDaBolinha(1, 0)).toEqual({ x: 48, y: 110 });
    expect(centroDaBolinha(10, 4)).toEqual({ x: 84, y: 200 });
    expect(centroDaBolinha(11, 0)).toEqual({ x: 138, y: 110 });
    expect(centroDaBolinha(20, 4)).toEqual({ x: 174, y: 200 });
    expect(GRADE.maximoDeQuestoes).toBe(20);
  });
});
