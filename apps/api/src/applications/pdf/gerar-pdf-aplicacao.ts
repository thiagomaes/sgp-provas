import { PDFDocument, StandardFonts } from 'pdf-lib';
import { desenharCaderno } from './desenhar-caderno.js';
import { desenharCartao } from './desenhar-cartao.js';
import type { DadosDoPdf, FontesDoPdf } from './tipos-pdf.js';
import { ALTURA_A4_MM, LARGURA_A4_MM, mmParaPontos } from './unidades.js';

export async function gerarPdfDaAplicacao(dados: DadosDoPdf): Promise<Uint8Array> {
  const documento = await PDFDocument.create();
  const fontes: FontesDoPdf = {
    normal: await documento.embedFont(StandardFonts.Helvetica),
    negrito: await documento.embedFont(StandardFonts.HelveticaBold),
  };

  for (const versao of dados.versoes) {
    desenharCaderno(documento, fontes, dados, versao);
    const paginaDoCartao = documento.addPage([mmParaPontos(LARGURA_A4_MM), mmParaPontos(ALTURA_A4_MM)]);
    desenharCartao(paginaDoCartao, fontes, dados, versao);
  }

  return documento.save();
}
