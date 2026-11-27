import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import type { OptionLetter } from '../types/index.ts'
import { lerPng } from './__fixtures__/png.ts'
import {
  calcularHomografia,
  aplicarHomografia,
  classificarLinha,
  lerCartao,
  type QuestaoLida,
  type QuestaoParaLer,
} from './leitura-cartao.ts'

const fixture = (nome: string) => lerPng(readFileSync(new URL(`./__fixtures__/${nome}`, import.meta.url)))

/** O exemplo preenchido: 20 objetivas de 5 alternativas, sem embaralhar. */
const VINTE_OBJETIVAS: QuestaoParaLer[] = Array.from({ length: 20 }, (_, i) => ({
  ordem: i + 1,
  questaoId: `q${i + 1}`,
  tipo: 'objetiva',
  alternativas: ['A', 'B', 'C', 'D', 'E'] as OptionLetter[],
}))

/** Resultado esperado da seção 14 de docs/arquitetura/cartao-resposta.md. */
const SECAO_14 = 'A C E B D A - B E C D A x B E C A D B E'.split(' ')

function resumo(questoes: QuestaoLida[]): string[] {
  return questoes.map((questao) =>
    questao.estado === 'marcada' ? (questao.letra as string) : questao.estado === 'em-branco' ? '-' : 'x',
  )
}

describe('leitura do exemplo preenchido (seção 14)', () => {
  for (const nome of [
    'exemplo.png',
    'exemplo-180.png',
    'exemplo-inclinado.png',
    'exemplo-escuro.png',
    'exemplo-ruido-90.png',
  ]) {
    it(`${nome} bate com a tabela, inclusive a 7 em branco e a 13 anulada`, () => {
      const resultado = lerCartao(fixture(nome), VINTE_OBJETIVAS)
      assert.ok(resultado.ok, resultado.ok ? '' : resultado.mensagem)
      assert.deepEqual(resumo(resultado.questoes), SECAO_14)
      assert.equal(resultado.questoes[12].motivo, 'mais-de-uma')
      for (const questao of resultado.questoes) {
        if (questao.estado === 'marcada') assert.ok(questao.confianca >= 0.5, `questão ${questao.ordem}: ${questao.confianca}`)
      }
    })
  }
})

describe('cartão do PDF real, com as bolinhas pintadas por código', () => {
  // Versão com 3 alternativas na questão 2 e discursiva na 4 (ver o README das fixtures).
  const questoes: QuestaoParaLer[] = [
    { ordem: 1, questaoId: 'a', tipo: 'objetiva', alternativas: ['B', 'D', 'A', 'C'] },
    { ordem: 2, questaoId: 'b', tipo: 'objetiva', alternativas: ['C', 'A', 'B'] },
    { ordem: 3, questaoId: 'c', tipo: 'objetiva', alternativas: ['A', 'C', 'B', 'D'] },
    { ordem: 4, questaoId: 'd', tipo: 'discursiva', alternativas: [] },
    { ordem: 5, questaoId: 'e', tipo: 'objetiva', alternativas: ['D', 'B', 'C', 'A'] },
  ]
  const esperado = JSON.parse(readFileSync(new URL('./__fixtures__/cartao-pdf.json', import.meta.url), 'utf8'))

  for (const nome of ['cartao-pdf.png', 'cartao-pdf-270.png']) {
    it(`${nome}: lê as pintadas e ignora a discursiva`, () => {
      const resultado = lerCartao(fixture(nome), questoes, { centroDoQr: esperado.centroDoQr[nome] })
      assert.ok(resultado.ok, resultado.ok ? '' : resultado.mensagem)
      assert.deepEqual(resumo(resultado.questoes), esperado.leitura)
      assert.deepEqual(
        resultado.questoes.map((questao) => questao.ordem),
        [1, 2, 3, 5],
      )
    })
  }
})

describe('falhas da leitura', () => {
  it('sem as 4 marcas pede para enquadrar o cartão', () => {
    const imagem = fixture('exemplo.png')
    // Apaga a marca inferior direita (190..200 x 277..287 mm, a 4 px por mm).
    for (let y = 277 * 4 - 4; y < 287 * 4 + 4; y++) {
      for (let x = 190 * 4 - 4; x < 200 * 4 + 4; x++) imagem.data.fill(255, (y * imagem.width + x) * 4, (y * imagem.width + x) * 4 + 3)
    }
    const resultado = lerCartao(imagem, VINTE_OBJETIVAS)
    assert.equal(resultado.ok, false)
    assert.equal(!resultado.ok && resultado.mensagem, 'Enquadre o cartão inteiro, com os 4 quadrados pretos')
  })

  it('folha em branco também', () => {
    const data = new Uint8ClampedArray(400 * 600 * 4).fill(255)
    assert.equal(lerCartao({ data, width: 400, height: 600 }, VINTE_OBJETIVAS).ok, false)
  })
})

describe('regras da seção 10', () => {
  it('uma bolinha a 50% ou mais e 20 pontos acima da segunda é marcada', () => {
    assert.deepEqual(classificarLinha([0.05, 0.92, 0.1]).letra, 'B')
  })

  it('rabiscada e apagada ao lado da resposta não anula (60% contra 95%)', () => {
    assert.equal(classificarLinha([0.6, 0.95, 0]).estado, 'marcada')
  })

  it('duas pintadas anulam (90% contra 95%)', () => {
    assert.deepEqual(classificarLinha([0.9, 0.95, 0]).motivo, 'mais-de-uma')
  })

  it('uma só, mas pouco acima da segunda, é duvidosa', () => {
    assert.deepEqual(classificarLinha([0.55, 0.4, 0]).motivo, 'duvidosa')
  })

  it('nenhuma a 50% fica em branco', () => {
    assert.equal(classificarLinha([0.3, 0.45, 0.1]).estado, 'em-branco')
  })
})

describe('homografia', () => {
  it('leva os 4 pontos de origem aos de destino', () => {
    const origem = [
      { x: 15, y: 15 },
      { x: 195, y: 15 },
      { x: 195, y: 282 },
      { x: 15, y: 282 },
    ]
    const destino = [
      { x: 120, y: 80 },
      { x: 900, y: 140 },
      { x: 980, y: 1300 },
      { x: 60, y: 1250 },
    ]
    const h = calcularHomografia(origem, destino)
    origem.forEach((p, i) => {
      const q = aplicarHomografia(h, p)
      assert.ok(Math.abs(q.x - destino[i].x) < 1e-6 && Math.abs(q.y - destino[i].y) < 1e-6)
    })
  })
})
