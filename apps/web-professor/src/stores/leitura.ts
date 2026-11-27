import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QuestaoLida } from '../correcao/leitura-cartao'

/** Cartão lido pela câmera, da tela de escanear para a de revisão. */
export interface LeituraDoCartao {
  aplicacaoId: string
  numeroVersao: number
  questoes: QuestaoLida[]
  /** Trecho da grade endireitado, com as leituras desenhadas (data URL JPEG). */
  miniatura: string
}

/**
 * A leitura fica só na memória: recarregar a revisão abre sem ela, e o
 * professor marca à mão, como antes da T08.
 */
export const useLeituraStore = defineStore('leitura', () => {
  const ultima = ref<LeituraDoCartao | null>(null)

  function guardar(leitura: LeituraDoCartao) {
    ultima.value = leitura
  }

  /** Entrega a leitura uma vez só, e só para a mesma aplicação e versão. */
  function retirar(aplicacaoId: string, numeroVersao: number): LeituraDoCartao | null {
    const leitura = ultima.value
    ultima.value = null
    return leitura && leitura.aplicacaoId === aplicacaoId && leitura.numeroVersao === numeroVersao
      ? leitura
      : null
  }

  return { guardar, retirar }
})
