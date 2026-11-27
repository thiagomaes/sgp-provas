import type { PDFFont } from 'pdf-lib';

const RETICENCIAS = '...';

export function textoSeguro(fonte: PDFFont, texto: string): string {
  const aceitos = new Set(fonte.getCharacterSet());
  return Array.from(texto.replace(/\t/g, ' '))
    .map((caractere) => (aceitos.has(caractere.codePointAt(0)!) ? caractere : '?'))
    .join('');
}

export function cortarComReticencias(
  fonte: PDFFont,
  texto: string,
  tamanho: number,
  larguraMaxima: number,
): string {
  const limpo = textoSeguro(fonte, texto.replace(/\s+/g, ' ').trim());
  if (fonte.widthOfTextAtSize(limpo, tamanho) <= larguraMaxima) return limpo;

  let cortado = limpo;
  while (cortado.length > 0 && fonte.widthOfTextAtSize(cortado + RETICENCIAS, tamanho) > larguraMaxima) {
    cortado = cortado.slice(0, -1);
  }
  return cortado.trimEnd() + RETICENCIAS;
}

export function quebrarEmLinhas(
  fonte: PDFFont,
  texto: string,
  tamanho: number,
  larguraMaxima: number,
): string[] {
  return textoSeguro(fonte, texto)
    .split(/\r?\n/)
    .flatMap((paragrafo) => quebrarParagrafo(fonte, paragrafo, tamanho, larguraMaxima));
}

function quebrarParagrafo(fonte: PDFFont, paragrafo: string, tamanho: number, larguraMaxima: number): string[] {
  const palavras = paragrafo.split(' ').filter((palavra) => palavra.length > 0);
  if (palavras.length === 0) return [''];

  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras.flatMap((item) => partirPalavraLonga(fonte, item, tamanho, larguraMaxima))) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (atual && fonte.widthOfTextAtSize(candidata, tamanho) > larguraMaxima) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = candidata;
    }
  }
  linhas.push(atual);
  return linhas;
}

function partirPalavraLonga(fonte: PDFFont, palavra: string, tamanho: number, larguraMaxima: number): string[] {
  if (fonte.widthOfTextAtSize(palavra, tamanho) <= larguraMaxima) return [palavra];

  const pedacos: string[] = [];
  let atual = '';
  for (const caractere of palavra) {
    if (atual && fonte.widthOfTextAtSize(atual + caractere, tamanho) > larguraMaxima) {
      pedacos.push(atual);
      atual = '';
    }
    atual += caractere;
  }
  pedacos.push(atual);
  return pedacos;
}
