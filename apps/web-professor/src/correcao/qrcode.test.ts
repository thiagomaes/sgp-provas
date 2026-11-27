import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { conferirQrCode, lerQrCode } from './qrcode.ts'

describe('lerQrCode', () => {
  it('lê a prova comum com hash', () => {
    assert.deepEqual(lerQrCode('sgp:cmabc123:v3:0a1b2c3d'), {
      aplicacaoId: 'cmabc123',
      numeroVersao: 3,
      hash: '0a1b2c3d',
      alunoId: null,
    })
  })

  it('lê a prova identificada', () => {
    assert.deepEqual(lerQrCode('sgp:cmabc123:v12:ffffffff:acmaluno9'), {
      aplicacaoId: 'cmabc123',
      numeroVersao: 12,
      hash: 'ffffffff',
      alunoId: 'cmaluno9',
    })
  })

  it('aceita o QR Code do seed, sem hash', () => {
    assert.deepEqual(lerQrCode('sgp:aplicacao-1:v1'), {
      aplicacaoId: 'aplicacao-1',
      numeroVersao: 1,
      hash: null,
      alunoId: null,
    })
  })

  it('recusa o que não é do SGP', () => {
    for (const texto of ['https://exemplo.com', 'sgp:', 'sgp:apl:vx', 'sgp:apl:v1:XYZ12345', 'abc sgp:apl:v1']) {
      assert.equal(lerQrCode(texto), null, texto)
    }
  })
})

describe('conferirQrCode', () => {
  const versoes = [
    { numeroVersao: 1, qrCodePayload: 'sgp:apl-1:v1:0a1b2c3d' },
    { numeroVersao: 2, qrCodePayload: 'sgp:apl-1:v2:11112222:aaluno-2' },
  ]

  it('aceita o QR Code de uma versão da aplicação', () => {
    const resultado = conferirQrCode('sgp:apl-1:v2:11112222:aaluno-2', 'apl-1', versoes)
    assert.equal(resultado.ok, true)
    assert.equal(resultado.ok && resultado.qrCode.alunoId, 'aluno-2')
  })

  it('explica cada recusa', () => {
    assert.deepEqual(conferirQrCode('olá', 'apl-1', versoes), { ok: false, motivo: 'outro-sistema' })
    assert.deepEqual(conferirQrCode('sgp:apl-9:v1:0a1b2c3d', 'apl-1', versoes), { ok: false, motivo: 'outra-aplicacao' })
    assert.deepEqual(conferirQrCode('sgp:apl-1:v7:0a1b2c3d', 'apl-1', versoes), { ok: false, motivo: 'versao-inexistente' })
  })

  it('recusa o cartão de versões geradas de novo depois da impressão', () => {
    assert.deepEqual(conferirQrCode('sgp:apl-1:v1:99999999', 'apl-1', versoes), { ok: false, motivo: 'geracao-antiga' })
  })
})
