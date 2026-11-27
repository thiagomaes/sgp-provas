import { rgb, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  CABECALHO,
  centroDaBolinha,
  GRADE,
  INSTRUCOES,
  MARCA_LADO_MM,
  MARCAS_DE_ALINHAMENTO,
  QR_CODE,
  TEXTO_DISCURSIVA,
  xInicialDaColuna,
  yDaLinha,
} from './medidas-cartao.js';
import { cortarComReticencias, textoSeguro } from './texto-pdf.js';
import type { DadosDoPdf, FontesDoPdf, VersaoImpressa } from './tipos-pdf.js';
import { mmParaPontos, yDoPdf } from './unidades.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const PRETO = rgb(0, 0, 0);
const BRANCO = rgb(1, 1, 1);
const CINZA_DA_LETRA = rgb(0.6, 0.6, 0.6);

export function desenharCartao(
  pagina: PDFPage,
  fontes: FontesDoPdf,
  dados: DadosDoPdf,
  versao: VersaoImpressa,
): void {
  desenharMarcas(pagina);
  desenharQrCode(pagina, versao.qrCodePayload);
  desenharCabecalho(pagina, fontes, dados, versao);
  desenharInstrucoes(pagina, fontes);
  desenharGrade(pagina, fontes, versao);
}

export function dataParaImpressao(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function quadradoPreto(pagina: PDFPage, x: number, y: number, largura: number, altura: number): void {
  pagina.drawRectangle({
    x: mmParaPontos(x),
    y: yDoPdf(y + altura),
    width: mmParaPontos(largura),
    height: mmParaPontos(altura),
    color: PRETO,
  });
}

function desenharMarcas(pagina: PDFPage): void {
  for (const marca of MARCAS_DE_ALINHAMENTO) {
    quadradoPreto(pagina, marca.x, marca.y, MARCA_LADO_MM, MARCA_LADO_MM);
  }
}

function desenharQrCode(pagina: PDFPage, conteudo: string): void {
  const modulos = QRCode.create(conteudo, { errorCorrectionLevel: 'M' }).modules;
  const lado = QR_CODE.lado / modulos.size;

  for (let linha = 0; linha < modulos.size; linha++) {
    let inicio = -1;
    for (let coluna = 0; coluna <= modulos.size; coluna++) {
      const escuro = coluna < modulos.size && modulos.get(linha, coluna) === 1;
      if (escuro && inicio < 0) inicio = coluna;
      if (!escuro && inicio >= 0) {
        quadradoPreto(
          pagina,
          QR_CODE.x + inicio * lado,
          QR_CODE.y + linha * lado,
          (coluna - inicio) * lado,
          lado,
        );
        inicio = -1;
      }
    }
  }
}

function escrever(
  pagina: PDFPage,
  conteudo: string,
  fonte: FontesDoPdf['normal'],
  tamanhoMm: number,
  x: number,
  y: number,
): void {
  pagina.drawText(textoSeguro(fonte, conteudo), {
    x: mmParaPontos(x),
    y: yDoPdf(y),
    size: mmParaPontos(tamanhoMm),
    font: fonte,
    color: PRETO,
  });
}

function escreverCortado(pagina: PDFPage, fontes: FontesDoPdf, conteudo: string, y: number): void {
  const cortado = cortarComReticencias(
    fontes.normal,
    conteudo,
    mmParaPontos(CABECALHO.tamanhoCampo),
    mmParaPontos(CABECALHO.xLimite - CABECALHO.x),
  );
  escrever(pagina, cortado, fontes.normal, CABECALHO.tamanhoCampo, CABECALHO.x, y);
}

function linhaParaEscrever(pagina: PDFPage, xInicial: number, y: number): void {
  pagina.drawLine({
    start: { x: mmParaPontos(xInicial), y: yDoPdf(y) },
    end: { x: mmParaPontos(CABECALHO.xLimite), y: yDoPdf(y) },
    thickness: mmParaPontos(CABECALHO.espessuraLinha),
    color: PRETO,
  });
}

function desenharCabecalho(
  pagina: PDFPage,
  fontes: FontesDoPdf,
  dados: DadosDoPdf,
  versao: VersaoImpressa,
): void {
  escrever(pagina, 'SGP: Sistema de Geração de Provas', fontes.negrito, CABECALHO.tamanhoSistema, CABECALHO.x, CABECALHO.sistemaY);
  escreverCortado(pagina, fontes, `Prova: ${dados.tituloDaProva}`, CABECALHO.provaY);
  escreverCortado(pagina, fontes, `Turma: ${dados.nomeDaTurma}`, CABECALHO.turmaY);
  escrever(pagina, `Data: ${dataParaImpressao(dados.data)}`, fontes.normal, CABECALHO.tamanhoCampo, CABECALHO.x, CABECALHO.dataY);
  escrever(pagina, `Versão: ${versao.numeroVersao}`, fontes.normal, CABECALHO.tamanhoCampo, CABECALHO.xVersao, CABECALHO.dataY);

  if (versao.aluno) {
    escreverCortado(pagina, fontes, `Nome: ${versao.aluno.nome}`, CABECALHO.nomeY);
    escreverCortado(pagina, fontes, `Matrícula: ${versao.aluno.matricula}`, CABECALHO.matriculaY);
    return;
  }
  escrever(pagina, 'Nome:', fontes.normal, CABECALHO.tamanhoCampo, CABECALHO.x, CABECALHO.nomeY);
  linhaParaEscrever(pagina, CABECALHO.xLinhaNome, CABECALHO.nomeY);
  escrever(pagina, 'Matrícula:', fontes.normal, CABECALHO.tamanhoCampo, CABECALHO.x, CABECALHO.matriculaY);
  linhaParaEscrever(pagina, CABECALHO.xLinhaMatricula, CABECALHO.matriculaY);
}

function desenharInstrucoes(pagina: PDFPage, fontes: FontesDoPdf): void {
  escrever(pagina, 'Instruções', fontes.negrito, INSTRUCOES.tamanhoTitulo, INSTRUCOES.tituloX, INSTRUCOES.tituloY);
  for (const item of INSTRUCOES.itens) {
    escrever(pagina, item.texto, fontes.normal, INSTRUCOES.tamanhoItem, item.x, item.y);
  }
}

function desenharNumeroDaQuestao(pagina: PDFPage, fontes: FontesDoPdf, numero: number): void {
  const tamanho = mmParaPontos(GRADE.tamanhoNumero);
  const conteudo = String(numero);
  pagina.drawText(conteudo, {
    x: mmParaPontos(xInicialDaColuna(numero) - GRADE.numeroRecuoX) - fontes.negrito.widthOfTextAtSize(conteudo, tamanho),
    y: yDoPdf(yDaLinha(numero) + GRADE.numeroDeslocamentoY),
    size: tamanho,
    font: fontes.negrito,
    color: PRETO,
  });
}

function desenharGrade(pagina: PDFPage, fontes: FontesDoPdf, versao: VersaoImpressa): void {
  versao.layout.questoes.slice(0, GRADE.maximoDeQuestoes).forEach((questao, indice) => {
    const numero = indice + 1;
    desenharNumeroDaQuestao(pagina, fontes, numero);

    if (questao.alternativas.length === 0) {
      escrever(
        pagina,
        TEXTO_DISCURSIVA,
        fontes.normal,
        GRADE.tamanhoDiscursiva,
        xInicialDaColuna(numero) - GRADE.discursivaRecuoX,
        yDaLinha(numero) + GRADE.discursivaDeslocamentoY,
      );
      return;
    }

    questao.alternativas.slice(0, GRADE.maximoDeAlternativas).forEach((_, posicao) => {
      desenharBolinha(pagina, fontes, numero, posicao);
    });
  });
}

function desenharBolinha(pagina: PDFPage, fontes: FontesDoPdf, numero: number, posicao: number): void {
  const centro = centroDaBolinha(numero, posicao);
  pagina.drawCircle({
    x: mmParaPontos(centro.x),
    y: yDoPdf(centro.y),
    size: mmParaPontos(GRADE.raioBolinha),
    color: BRANCO,
    borderColor: PRETO,
    borderWidth: mmParaPontos(GRADE.espessuraContorno),
  });

  const letra = LETRAS[posicao];
  const tamanho = mmParaPontos(GRADE.tamanhoLetra);
  pagina.drawText(letra, {
    x: mmParaPontos(centro.x) - fontes.normal.widthOfTextAtSize(letra, tamanho) / 2,
    y: yDoPdf(centro.y + GRADE.deslocamentoLetraY),
    size: tamanho,
    font: fontes.normal,
    color: CINZA_DA_LETRA,
  });
}
