import { rgb, type PDFDocument, type PDFPage } from 'pdf-lib';
import { dataParaImpressao } from './desenhar-cartao.js';
import { cortarComReticencias, quebrarEmLinhas } from './texto-pdf.js';
import type { DadosDoPdf, FontesDoPdf, QuestaoImpressa, VersaoImpressa } from './tipos-pdf.js';
import { ALTURA_A4_MM, LARGURA_A4_MM, mmParaPontos } from './unidades.js';

const MARGEM = mmParaPontos(20);
const MARGEM_INFERIOR = mmParaPontos(22);
const LARGURA_UTIL = mmParaPontos(LARGURA_A4_MM) - 2 * MARGEM;
const ALTURA_DA_PAGINA = mmParaPontos(ALTURA_A4_MM);
const TAMANHO_DO_TEXTO = 10.5;
const ALTURA_DA_LINHA = 14.5;
const RECUO_DA_ALTERNATIVA = 18;
const ESPACO_ENTRE_QUESTOES = 12;
const LINHAS_DE_RESPOSTA_DISCURSIVA = 6;
const PRETO = rgb(0, 0, 0);
const CINZA = rgb(0.4, 0.4, 0.4);
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

interface LinhaDoCaderno {
  texto: string;
  negrito: boolean;
  recuo: number;
  linhaDeResposta: boolean;
}

export function desenharCaderno(
  documento: PDFDocument,
  fontes: FontesDoPdf,
  dados: DadosDoPdf,
  versao: VersaoImpressa,
): void {
  const paginas: PDFPage[] = [];
  let pagina = novaPagina(documento, paginas);
  let y = desenharTitulo(pagina, fontes, dados, versao);

  for (const [indice, questao] of versao.layout.questoes.entries()) {
    const dadosDaQuestao = dados.questoes.get(questao.questaoId);
    if (!dadosDaQuestao) continue;

    const linhas = montarLinhasDaQuestao(fontes, indice + 1, dadosDaQuestao, questao.alternativas);
    const altura = linhas.length * ALTURA_DA_LINHA;
    const cabeInteira = altura <= ALTURA_DA_PAGINA - MARGEM - MARGEM_INFERIOR;

    if (cabeInteira && y - altura < MARGEM_INFERIOR) {
      pagina = novaPagina(documento, paginas);
      y = ALTURA_DA_PAGINA - MARGEM;
    }
    for (const linha of linhas) {
      if (y - ALTURA_DA_LINHA < MARGEM_INFERIOR) {
        pagina = novaPagina(documento, paginas);
        y = ALTURA_DA_PAGINA - MARGEM;
      }
      desenharLinha(pagina, fontes, linha, y);
      y -= ALTURA_DA_LINHA;
    }
    y -= ESPACO_ENTRE_QUESTOES;
  }

  desenharRodapes(paginas, fontes, versao);
}

function novaPagina(documento: PDFDocument, paginas: PDFPage[]): PDFPage {
  const pagina = documento.addPage([mmParaPontos(LARGURA_A4_MM), ALTURA_DA_PAGINA]);
  paginas.push(pagina);
  return pagina;
}

function desenharTitulo(pagina: PDFPage, fontes: FontesDoPdf, dados: DadosDoPdf, versao: VersaoImpressa): number {
  const topo = ALTURA_DA_PAGINA - MARGEM;
  const titulo = cortarComReticencias(fontes.negrito, dados.tituloDaProva, 16, LARGURA_UTIL);
  pagina.drawText(titulo, { x: MARGEM, y: topo - 12, size: 16, font: fontes.negrito, color: PRETO });

  const detalhes = cortarComReticencias(
    fontes.normal,
    `${dados.nomeDaTurma}  |  ${dataParaImpressao(dados.data)}  |  Versão ${versao.numeroVersao}`,
    TAMANHO_DO_TEXTO,
    LARGURA_UTIL,
  );
  pagina.drawText(detalhes, { x: MARGEM, y: topo - 30, size: TAMANHO_DO_TEXTO, font: fontes.normal, color: CINZA });

  pagina.drawLine({
    start: { x: MARGEM, y: topo - 40 },
    end: { x: MARGEM + LARGURA_UTIL, y: topo - 40 },
    thickness: 0.6,
    color: PRETO,
  });
  return topo - 40 - ESPACO_ENTRE_QUESTOES - ALTURA_DA_LINHA;
}

function textoDaPontuacao(pontuacao: number): string {
  const valor = pontuacao.toLocaleString('pt-BR');
  return `${valor} ${pontuacao === 1 ? 'ponto' : 'pontos'}`;
}

function montarLinhasDaQuestao(
  fontes: FontesDoPdf,
  numero: number,
  questao: QuestaoImpressa,
  letrasOriginais: string[],
): LinhaDoCaderno[] {
  const linhas: LinhaDoCaderno[] = [
    { texto: `Questão ${numero} (${textoDaPontuacao(questao.pontuacao)})`, negrito: true, recuo: 0, linhaDeResposta: false },
  ];

  for (const texto of quebrarEmLinhas(fontes.normal, questao.enunciado, TAMANHO_DO_TEXTO, LARGURA_UTIL)) {
    linhas.push({ texto, negrito: false, recuo: 0, linhaDeResposta: false });
  }

  if (letrasOriginais.length === 0) {
    for (let i = 0; i < LINHAS_DE_RESPOSTA_DISCURSIVA; i++) {
      linhas.push({ texto: '', negrito: false, recuo: 0, linhaDeResposta: true });
    }
    return linhas;
  }

  letrasOriginais.forEach((letraOriginal, posicao) => {
    const rotulo = `${LETRAS[posicao]})`;
    const textoDaAlternativa = questao.textoDasAlternativas[letraOriginal] ?? '';
    const partes = quebrarEmLinhas(fontes.normal, textoDaAlternativa, TAMANHO_DO_TEXTO, LARGURA_UTIL - RECUO_DA_ALTERNATIVA);
    partes.forEach((parte, indice) => {
      linhas.push({
        texto: indice === 0 ? `${rotulo} ${parte}` : parte,
        negrito: false,
        recuo: indice === 0 ? 4 : RECUO_DA_ALTERNATIVA,
        linhaDeResposta: false,
      });
    });
  });
  return linhas;
}

function desenharLinha(pagina: PDFPage, fontes: FontesDoPdf, linha: LinhaDoCaderno, y: number): void {
  if (linha.linhaDeResposta) {
    pagina.drawLine({
      start: { x: MARGEM, y: y - 2 },
      end: { x: MARGEM + LARGURA_UTIL, y: y - 2 },
      thickness: 0.4,
      color: CINZA,
    });
    return;
  }
  pagina.drawText(linha.texto, {
    x: MARGEM + linha.recuo,
    y,
    size: TAMANHO_DO_TEXTO,
    font: linha.negrito ? fontes.negrito : fontes.normal,
    color: PRETO,
  });
}

function desenharRodapes(paginas: PDFPage[], fontes: FontesDoPdf, versao: VersaoImpressa): void {
  paginas.forEach((pagina, indice) => {
    const texto = `Versão ${versao.numeroVersao}  |  Página ${indice + 1} de ${paginas.length}`;
    const largura = fontes.normal.widthOfTextAtSize(texto, 9);
    pagina.drawText(texto, {
      x: (mmParaPontos(LARGURA_A4_MM) - largura) / 2,
      y: mmParaPontos(12),
      size: 9,
      font: fontes.normal,
      color: CINZA,
    });
  });
}
