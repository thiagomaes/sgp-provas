/**
 * QR Code do cartão-resposta (docs/arquitetura/cartao-resposta.md, seção 4).
 * Funções puras: usadas pela tela de escanear e pelos testes.
 */

export interface QrCodeDaProva {
  aplicacaoId: string
  numeroVersao: number
  /** 8 caracteres hexadecimais; as versões do seed não têm. */
  hash: string | null
  /** Só na prova identificada. */
  alunoId: string | null
}

const FORMATO = /^sgp:([^:]+):v(\d+)(?::([0-9a-f]{8}))?(?::a([^:]+))?$/

/** Lê o conteúdo do QR Code; null quando não é um QR Code de prova do SGP. */
export function lerQrCode(texto: string): QrCodeDaProva | null {
  const partes = FORMATO.exec(texto.trim())
  if (!partes) return null
  return {
    aplicacaoId: partes[1],
    numeroVersao: Number(partes[2]),
    hash: partes[3] ?? null,
    alunoId: partes[4] ?? null,
  }
}

export type MotivoRecusa = 'outro-sistema' | 'outra-aplicacao' | 'versao-inexistente' | 'geracao-antiga'

export const MENSAGEM_DE_RECUSA: Record<MotivoRecusa, string> = {
  'outro-sistema': 'Este QR Code não é de uma prova do SGP',
  'outra-aplicacao': 'Esta prova é de outra aplicação',
  'versao-inexistente': 'Versão não encontrada nesta aplicação',
  'geracao-antiga': 'Este cartão é de versões que foram geradas de novo: use o PDF atual',
}

export type ResultadoDaLeitura =
  | { ok: true; qrCode: QrCodeDaProva }
  | { ok: false; motivo: MotivoRecusa }

/**
 * Confere o QR Code lido contra as versões da aplicação aberta. O texto
 * precisa ser igual ao guardado: uma versão com o mesmo número, mas gerada de
 * novo depois da impressão, tem outro layout e daria a nota errada.
 */
export function conferirQrCode(
  texto: string,
  aplicacaoId: string,
  versoes: { numeroVersao: number; qrCodePayload: string }[],
): ResultadoDaLeitura {
  const qrCode = lerQrCode(texto)
  if (!qrCode) return { ok: false, motivo: 'outro-sistema' }
  if (qrCode.aplicacaoId !== aplicacaoId) return { ok: false, motivo: 'outra-aplicacao' }

  const versao = versoes.find((item) => item.numeroVersao === qrCode.numeroVersao)
  if (!versao) return { ok: false, motivo: 'versao-inexistente' }
  if (versao.qrCodePayload !== texto.trim()) return { ok: false, motivo: 'geracao-antiga' }
  return { ok: true, qrCode }
}
