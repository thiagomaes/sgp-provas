/**
 * PNG mínimo para os testes da leitura do cartão, só com o zlib do Node:
 * lê PNG de 8 bits (cinza, RGB ou RGBA, sem entrelaçamento) e grava em cinza.
 */
import { deflateSync, inflateSync } from 'node:zlib'
import type { Imagem } from '../leitura-cartao.ts'

const ASSINATURA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(dados: Buffer): number {
  let c = 0xffffffff
  for (const byte of dados) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloco(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, crc])
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** Lê o PNG e devolve RGBA, como um ImageData. */
export function lerPng(arquivo: Buffer): Imagem {
  if (!arquivo.subarray(0, 8).equals(ASSINATURA)) throw new Error('Não é um PNG.')
  let posicao = 8
  let largura = 0
  let altura = 0
  let tipoDeCor = 0
  const partes: Buffer[] = []
  while (posicao < arquivo.length) {
    const tamanho = arquivo.readUInt32BE(posicao)
    const tipo = arquivo.toString('ascii', posicao + 4, posicao + 8)
    const dados = arquivo.subarray(posicao + 8, posicao + 8 + tamanho)
    if (tipo === 'IHDR') {
      largura = dados.readUInt32BE(0)
      altura = dados.readUInt32BE(4)
      tipoDeCor = dados[9]
      if (dados[8] !== 8 || dados[12] !== 0) throw new Error('Só PNG de 8 bits sem entrelaçamento.')
    }
    if (tipo === 'IDAT') partes.push(dados)
    posicao += 12 + tamanho
  }
  const canais = { 0: 1, 2: 3, 6: 4 }[tipoDeCor]
  if (!canais) throw new Error(`Tipo de cor ${tipoDeCor} não suportado.`)

  const bruto = inflateSync(Buffer.concat(partes))
  const porLinha = largura * canais
  const pixels = new Uint8Array(altura * porLinha)
  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (porLinha + 1)]
    for (let x = 0; x < porLinha; x++) {
      const valor = bruto[y * (porLinha + 1) + 1 + x]
      const a = x >= canais ? pixels[y * porLinha + x - canais] : 0
      const b = y > 0 ? pixels[(y - 1) * porLinha + x] : 0
      const c = x >= canais && y > 0 ? pixels[(y - 1) * porLinha + x - canais] : 0
      const previsto = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filtro]
      pixels[y * porLinha + x] = (valor + previsto) & 0xff
    }
  }

  const data = new Uint8ClampedArray(largura * altura * 4)
  for (let i = 0; i < largura * altura; i++) {
    if (canais === 1) {
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = pixels[i]
    } else {
      data[i * 4] = pixels[i * canais]
      data[i * 4 + 1] = pixels[i * canais + 1]
      data[i * 4 + 2] = pixels[i * canais + 2]
    }
    data[i * 4 + 3] = 255
  }
  return { data, width: largura, height: altura }
}

/** Grava em tons de cinza (a leitura só usa a luminosidade), com o filtro Sub. */
export function gravarPngCinza(imagem: Imagem): Buffer {
  const { data, width, height } = imagem
  const bruto = Buffer.alloc(height * (width + 1))
  for (let y = 0; y < height; y++) {
    bruto[y * (width + 1)] = 1
    let anterior = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const cinza = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      bruto[y * (width + 1) + 1 + x] = (cinza - anterior) & 0xff
      anterior = cinza
    }
  }
  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(width, 0)
  cabecalho.writeUInt32BE(height, 4)
  cabecalho[8] = 8
  cabecalho[9] = 0
  return Buffer.concat([
    ASSINATURA,
    bloco('IHDR', cabecalho),
    bloco('IDAT', deflateSync(bruto, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ])
}
