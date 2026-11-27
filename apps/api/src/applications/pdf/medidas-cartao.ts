export const MARCA_LADO_MM = 10;

export const MARCAS_DE_ALINHAMENTO = [
  { x: 10, y: 10 },
  { x: 190, y: 10 },
  { x: 10, y: 277 },
  { x: 190, y: 277 },
] as const;

export const QR_CODE = { x: 30, y: 25, lado: 35 } as const;

export const CABECALHO = {
  x: 75,
  xLimite: 177,
  xVersao: 125,
  sistemaY: 20,
  provaY: 27,
  turmaY: 33,
  dataY: 39,
  nomeY: 47,
  matriculaY: 56,
  xLinhaNome: 88,
  xLinhaMatricula: 93,
  tamanhoSistema: 4.2,
  tamanhoCampo: 3.5,
  espessuraLinha: 0.2,
} as const;

export const INSTRUCOES = {
  tituloX: 33,
  tituloY: 76,
  tamanhoTitulo: 3.5,
  tamanhoItem: 3.2,
  itens: [
    { texto: '1. Use caneta azul ou preta.', x: 33, y: 82 },
    { texto: '2. Preencha a bolinha inteira.', x: 33, y: 88 },
    { texto: '3. Faça só uma marcação por questão.', x: 105, y: 82 },
    { texto: '4. Não dobre esta folha.', x: 105, y: 88 },
  ],
} as const;

export const GRADE = {
  maximoDeQuestoes: 20,
  questoesPorColuna: 10,
  maximoDeAlternativas: 5,
  xPrimeiraColuna: 48,
  xSegundaColuna: 138,
  yPrimeiraLinha: 110,
  passoHorizontal: 9,
  passoVertical: 10,
  raioBolinha: 3,
  espessuraContorno: 0.3,
  tamanhoLetra: 2.4,
  deslocamentoLetraY: 0.85,
  tamanhoNumero: 3.5,
  numeroRecuoX: 7,
  numeroDeslocamentoY: 1.2,
  tamanhoDiscursiva: 2.5,
  discursivaRecuoX: 3,
  discursivaDeslocamentoY: 1,
} as const;

export const TEXTO_DISCURSIVA = 'Discursiva: corrigida pelo professor';

export interface Ponto {
  x: number;
  y: number;
}

export function xInicialDaColuna(numeroDaQuestao: number): number {
  return numeroDaQuestao <= GRADE.questoesPorColuna ? GRADE.xPrimeiraColuna : GRADE.xSegundaColuna;
}

export function yDaLinha(numeroDaQuestao: number): number {
  return GRADE.yPrimeiraLinha + GRADE.passoVertical * ((numeroDaQuestao - 1) % GRADE.questoesPorColuna);
}

export function centroDaBolinha(numeroDaQuestao: number, indiceDaAlternativa: number): Ponto {
  return {
    x: xInicialDaColuna(numeroDaQuestao) + GRADE.passoHorizontal * indiceDaAlternativa,
    y: yDaLinha(numeroDaQuestao),
  };
}
