import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PrintedQuestion } from '../types/index.ts'
import { letraOriginal, notaPrevista, respostasParaApi } from './respostas.ts'

// Versão embaralhada: na q1 a correta original é A, impressa como B.
const questoes: PrintedQuestion[] = [
  { ordem: 1, questaoId: 'q1', tipo: 'objetiva', pontuacao: 4, alternativas: ['C', 'A', 'B'], corretaImpressa: 'B' },
  { ordem: 2, questaoId: 'q2', tipo: 'objetiva', pontuacao: 3, alternativas: ['D', 'E', 'A', 'B', 'C'], corretaImpressa: 'A' },
  { ordem: 3, questaoId: 'q3', tipo: 'discursiva', pontuacao: 3, alternativas: [], corretaImpressa: null },
]

describe('letraOriginal', () => {
  it('converte a letra impressa pela posição', () => {
    assert.equal(letraOriginal(questoes[0], 'B'), 'A')
    assert.equal(letraOriginal(questoes[0], 'A'), 'C')
  })

  it('em branco ou letra que não foi impressa vira null', () => {
    assert.equal(letraOriginal(questoes[0], null), null)
    assert.equal(letraOriginal(questoes[0], 'E'), null)
  })
})

describe('marcar a resposta certa impressa de uma versão embaralhada', () => {
  const marcacoes = { letras: { q1: 'B' as const, q2: 'A' as const }, pontos: { q3: 3 } }

  it('dá nota cheia', () => {
    assert.equal(notaPrevista(questoes, marcacoes), 10)
  })

  it('envia para a API as letras originais', () => {
    assert.deepEqual(respostasParaApi(questoes, marcacoes), [
      { questaoId: 'q1', marcada: 'A' },
      { questaoId: 'q2', marcada: 'D' },
      { questaoId: 'q3', pontuacao: 3 },
    ])
  })
})

describe('notaPrevista', () => {
  it('em branco vale zero', () => {
    assert.equal(notaPrevista(questoes, { letras: {}, pontos: {} }), 0)
  })

  it('marcar a letra original em vez da impressa não pontua', () => {
    assert.equal(notaPrevista(questoes, { letras: { q1: 'A' }, pontos: {} }), 0)
  })

  it('limita os pontos da discursiva à pontuação da questão', () => {
    assert.equal(notaPrevista(questoes, { letras: {}, pontos: { q3: 9 } }), 3)
    assert.deepEqual(respostasParaApi(questoes, { letras: {}, pontos: { q3: -2 } })[2], { questaoId: 'q3', pontuacao: 0 })
  })
})
