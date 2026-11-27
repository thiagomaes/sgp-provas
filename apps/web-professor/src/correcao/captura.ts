/**
 * Captura da foto do cartão e miniatura da leitura, no navegador. A leitura em
 * si fica em leitura-cartao.ts, que não depende do navegador.
 */
import type { PrintedQuestion } from '../types'
import { endireitarCartao, type Imagem, type QuestaoLida } from './leitura-cartao'
import { centroDaBolinha, GRADE, yDaLinha } from './medidas-cartao'

/** Leitura que pede para o professor conferir: em branco, anulada ou marcada com pouca folga. */
export const CONFIANCA_MINIMA = 0.4

export function precisaConferir(questao: QuestaoLida): boolean {
  return questao.estado !== 'marcada' || questao.confianca < CONFIANCA_MINIMA
}

/** O quadro atual do vídeo, na resolução da câmera. */
export function quadroDoVideo(video: HTMLVideoElement, tela: HTMLCanvasElement): Imagem | null {
  if (video.readyState < 2 || !video.videoWidth) return null
  tela.width = video.videoWidth
  tela.height = video.videoHeight
  const contexto = tela.getContext('2d', { willReadFrequently: true })
  if (!contexto) return null
  contexto.drawImage(video, 0, 0)
  return contexto.getImageData(0, 0, tela.width, tela.height)
}

interface CapturaDeImagem {
  takePhoto(opcoes?: { fillLightMode?: 'off' | 'auto' | 'flash' }): Promise<Blob>
}
type ConstrutorDeCaptura = new (trilha: MediaStreamTrack) => CapturaDeImagem

/**
 * Foto na resolução máxima do sensor, onde o navegador deixa (ImageCapture,
 * no Chrome do Android). Em outros navegadores, ou se demorar, devolve null.
 */
export async function fotoDaCamera(trilha: MediaStreamTrack, limiteMs = 2500): Promise<Imagem | null> {
  const Construtor = (window as unknown as { ImageCapture?: ConstrutorDeCaptura }).ImageCapture
  if (!Construtor || trilha.readyState !== 'live') return null
  try {
    // Sem flash: o reflexo no papel apaga as bolinhas. Quem não aceita a opção tira sem ela.
    const captura = new Construtor(trilha)
    const foto = await Promise.race([
      captura.takePhoto({ fillLightMode: 'off' }).catch(() => captura.takePhoto()),
      new Promise<null>((resolver) => setTimeout(() => resolver(null), limiteMs)),
    ])
    if (!foto) return null
    const bitmap = await createImageBitmap(foto)
    const tela = document.createElement('canvas')
    tela.width = bitmap.width
    tela.height = bitmap.height
    const contexto = tela.getContext('2d', { willReadFrequently: true })
    if (!contexto) return null
    contexto.drawImage(bitmap, 0, 0)
    bitmap.close()
    return contexto.getImageData(0, 0, tela.width, tela.height)
  } catch {
    return null
  }
}

function cor(nome: string, reserva: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || reserva
}

/**
 * Miniatura da grade endireitada, com um círculo na letra lida de cada questão
 * e uma faixa amarela nas que o professor precisa conferir.
 */
export function desenharMiniatura(
  imagem: Imagem,
  homografia: number[],
  questoes: PrintedQuestion[],
  lidas: QuestaoLida[],
): string {
  // Com até 10 questões só a primeira coluna aparece, maior.
  const ultima = Math.max(1, ...questoes.map((questao) => questao.ordem))
  const duasColunas = ultima > GRADE.questoesPorColuna
  const pixelsPorMm = duasColunas ? 3 : 6
  const linhas = Math.min(GRADE.questoesPorColuna, ultima)
  const recorte = { x: 28, y: 103, largura: duasColunas ? 160 : 64, altura: yDaLinha(linhas) + 7 - 103 }
  const trecho = endireitarCartao(imagem, homografia, pixelsPorMm, recorte)

  const tela = document.createElement('canvas')
  tela.width = trecho.width
  tela.height = trecho.height
  const contexto = tela.getContext('2d')
  if (!contexto) return ''
  contexto.putImageData(new ImageData(new Uint8ClampedArray(trecho.data), trecho.width, trecho.height), 0, 0)

  const emPixels = (mm: number, origem: number) => (mm - origem) * pixelsPorMm
  const destaque = cor('--highlight', '#f2c230')
  const acento = cor('--accent', '#2f6f5e')
  for (const lida of lidas) {
    const coluna = lida.ordem <= GRADE.questoesPorColuna ? 0 : 1
    if (precisaConferir(lida)) {
      contexto.fillStyle = destaque
      contexto.globalAlpha = 0.35
      contexto.fillRect(
        emPixels(38 + 90 * coluna, recorte.x),
        emPixels(yDaLinha(lida.ordem) - 4.5, recorte.y),
        52 * pixelsPorMm,
        9 * pixelsPorMm,
      )
      contexto.globalAlpha = 1
    }
    if (lida.letra) {
      const centro = centroDaBolinha(lida.ordem, 'ABCDE'.indexOf(lida.letra))
      contexto.strokeStyle = acento
      contexto.lineWidth = Math.max(2, pixelsPorMm * 0.6)
      contexto.beginPath()
      contexto.arc(emPixels(centro.x, recorte.x), emPixels(centro.y, recorte.y), 4 * pixelsPorMm, 0, 2 * Math.PI)
      contexto.stroke()
    }
  }
  return tela.toDataURL('image/jpeg', 0.85)
}
