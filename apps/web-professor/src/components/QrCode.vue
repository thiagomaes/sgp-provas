<script setup lang="ts">
import QRCode from 'qrcode'
import { ref, watchEffect } from 'vue'

/**
 * Imagem do QR Code de um texto (ex.: o qrCodePayload de cada versão da
 * aplicação, que vai impresso na prova). As cores vêm de tokens.css:
 * --text nos módulos e --surface no fundo.
 */
const props = withDefaults(defineProps<{ valor: string; tamanho?: number }>(), { tamanho: 96 })

const imagem = ref('')

function corDoToken(nome: string, padrao: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao
}

watchEffect(async () => {
  const valor = props.valor
  imagem.value = ''
  if (!valor) return
  imagem.value = await QRCode.toDataURL(valor, {
    width: props.tamanho * 2,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: corDoToken('--text', '#1F2421'), light: corDoToken('--surface', '#FFFFFF') },
  })
})
</script>

<template>
  <img
    v-if="imagem"
    class="qr"
    :src="imagem"
    :width="tamanho"
    :height="tamanho"
    :alt="`QR Code: ${valor}`"
  />
  <span v-else class="qr qr-vazio" :style="{ width: `${tamanho}px`, height: `${tamanho}px` }" />
</template>

<style scoped>
.qr {
  display: block;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.qr-vazio {
  background: var(--bg);
}
</style>
