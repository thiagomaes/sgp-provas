/**
 * Medidas do cartão-resposta, em mm, com a origem no canto superior esquerdo da
 * folha (docs/arquitetura/cartao-resposta.md, seções 3, 4, 7 e 13).
 *
 * ATENÇÃO: estes valores são cópia de apps/api/src/applications/pdf/medidas-cartao.ts,
 * que é quem desenha o PDF. Os dois arquivos precisam ficar iguais: se a API mudar
 * uma medida, a leitura passa a procurar as bolinhas no lugar errado. O teste
 * medidas-cartao.test.ts compara os dois arquivos e a tabela do documento.
 */

export const FOLHA = { largura: 210, altura: 297 } as const

export const MARCA_LADO_MM = 10

export const MARCAS_DE_ALINHAMENTO = [
  { x: 10, y: 10 },
  { x: 190, y: 10 },
  { x: 10, y: 277 },
  { x: 190, y: 277 },
] as const

export const QR_CODE = { x: 30, y: 25, lado: 35 } as const

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
} as const

export interface Ponto {
  x: number
  y: number
}

export function xInicialDaColuna(numeroDaQuestao: number): number {
  return numeroDaQuestao <= GRADE.questoesPorColuna ? GRADE.xPrimeiraColuna : GRADE.xSegundaColuna
}

export function yDaLinha(numeroDaQuestao: number): number {
  return GRADE.yPrimeiraLinha + GRADE.passoVertical * ((numeroDaQuestao - 1) % GRADE.questoesPorColuna)
}

export function centroDaBolinha(numeroDaQuestao: number, indiceDaAlternativa: number): Ponto {
  return {
    x: xInicialDaColuna(numeroDaQuestao) + GRADE.passoHorizontal * indiceDaAlternativa,
    y: yDaLinha(numeroDaQuestao),
  }
}

/** Centro de cada marca, em sentido horário a partir da superior esquerda. */
export const CENTROS_DAS_MARCAS: readonly Ponto[] = [
  MARCAS_DE_ALINHAMENTO[0],
  MARCAS_DE_ALINHAMENTO[1],
  MARCAS_DE_ALINHAMENTO[3],
  MARCAS_DE_ALINHAMENTO[2],
].map((marca) => ({ x: marca.x + MARCA_LADO_MM / 2, y: marca.y + MARCA_LADO_MM / 2 }))

export const CENTRO_DO_QR_CODE: Ponto = {
  x: QR_CODE.x + QR_CODE.lado / 2,
  y: QR_CODE.y + QR_CODE.lado / 2,
}
