import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import * as daApi from '../../../api/src/applications/pdf/medidas-cartao.ts'
import * as daWeb from './medidas-cartao.ts'

/** Linhas da tabela da seção 13 do documento: questão, coluna, y e o x de A a E. */
function tabelaDoDocumento(): number[][] {
  const texto = readFileSync(new URL('../../../../docs/arquitetura/cartao-resposta.md', import.meta.url), 'utf8')
  const secao = texto.slice(texto.indexOf('## 13.'), texto.indexOf('## 14.'))
  return secao
    .split('\n')
    .filter((linha) => /^\|\s*\d+\s*\|/.test(linha))
    .map((linha) => linha.split('|').slice(1, -1).map((celula) => Number(celula.trim())))
}

describe('medidas do cartão na web', () => {
  it('o centro de cada bolinha bate com a tabela da seção 13', () => {
    const tabela = tabelaDoDocumento()
    assert.equal(tabela.length, 20)
    for (const [questao, , y, ...xs] of tabela) {
      xs.forEach((x, indice) => {
        assert.deepEqual(daWeb.centroDaBolinha(questao, indice), { x, y }, `questão ${questao}, alternativa ${indice}`)
      })
    }
  })

  it('são iguais às da API, que desenha o PDF', () => {
    assert.deepEqual(daWeb.MARCAS_DE_ALINHAMENTO, daApi.MARCAS_DE_ALINHAMENTO)
    assert.equal(daWeb.MARCA_LADO_MM, daApi.MARCA_LADO_MM)
    assert.deepEqual(daWeb.QR_CODE, daApi.QR_CODE)
    for (const [chave, valor] of Object.entries(daWeb.GRADE)) {
      assert.equal(valor, daApi.GRADE[chave as keyof typeof daApi.GRADE], `GRADE.${chave}`)
    }
    for (let questao = 1; questao <= 20; questao++) {
      for (let indice = 0; indice < 5; indice++) {
        assert.deepEqual(daWeb.centroDaBolinha(questao, indice), daApi.centroDaBolinha(questao, indice))
      }
    }
  })

  it('os centros das marcas formam o retângulo de 180 x 267 mm da seção 3', () => {
    assert.deepEqual(daWeb.CENTROS_DAS_MARCAS, [
      { x: 15, y: 15 },
      { x: 195, y: 15 },
      { x: 195, y: 282 },
      { x: 15, y: 282 },
    ])
  })
})
