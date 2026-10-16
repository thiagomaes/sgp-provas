<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacaoPorId } from '../mocks/aplicacoes'
import { buscarProvaPorId } from '../mocks/provas'
import { buscarTurmaPorId } from '../mocks/turmas'

/**
 * Escanear prova (RF08) — fiel ao mockup docs/telas/15-mobile-scanner.png.
 *
 * Abre a câmera traseira do celular pelo navegador (getUserMedia) e mostra
 * o vídeo dentro do quadro de leitura. Se o navegador não tiver câmera, o
 * professor negar o acesso ou a página não estiver em HTTPS (a câmera só
 * abre em contexto seguro: localhost ou o site publicado), o quadro fica
 * escuro com a instrução.
 *
 * TODO(N2/N3): a leitura real ainda não existe. Falta decodificar o QR Code
 * da versão (ex.: BarcodeDetector ou uma lib de QR) e reconhecer as marcações
 * do cartão-resposta. Por enquanto "Simular leitura" leva direto à revisão,
 * que monta uma correção de exemplo.
 */

type EstadoCamera = 'abrindo' | 'ativa' | 'negada' | 'indisponivel'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const aplicacao = computed(() => buscarAplicacaoPorId(id))
const prova = computed(() =>
  aplicacao.value ? buscarProvaPorId(aplicacao.value.provaId) : undefined,
)
const turma = computed(() =>
  aplicacao.value ? buscarTurmaPorId(aplicacao.value.turmaId) : undefined,
)

const video = ref<HTMLVideoElement | null>(null)
const estado = ref<EstadoCamera>('abrindo')
let stream: MediaStream | null = null

const instrucao = computed(() => {
  if (estado.value === 'negada') {
    return 'O acesso à câmera foi negado. Libere a câmera nas permissões do navegador para ler as provas.'
  }
  if (estado.value === 'indisponivel') {
    return 'Câmera indisponível neste dispositivo. Abra esta tela no celular para ler as provas.'
  }
  return ''
})

async function abrirCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    estado.value = 'indisponivel'
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    if (video.value) {
      video.value.srcObject = stream
    }
    estado.value = 'ativa'
  } catch (erro) {
    const nome = erro instanceof DOMException ? erro.name : ''
    estado.value = nome === 'NotAllowedError' ? 'negada' : 'indisponivel'
  }
}

function fecharCamera() {
  stream?.getTracks().forEach((trilha) => trilha.stop())
  stream = null
}

function simularLeitura() {
  router.push(`/correcao/${id}/revisao`)
}

onMounted(abrirCamera)
// Sair da tela desliga a câmera (a luz do celular apaga).
onBeforeUnmount(fecharCamera)
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/correcao">Correção</RouterLink>
    </template>
    <template #titulo>Escanear prova</template>
    <template #subtitulo>
      <template v-if="turma && prova">{{ turma.nome }} · {{ prova.titulo }}</template>
    </template>

    <div v-if="!aplicacao" class="vazio">
      Aplicação não encontrada.
      <RouterLink to="/correcao">Voltar para a correção</RouterLink>
    </div>

    <div v-else class="leitor">
      <div class="quadro">
        <video
          v-show="estado === 'ativa'"
          ref="video"
          class="video"
          autoplay
          muted
          playsinline
        />

        <span class="canto canto-se" aria-hidden="true" />
        <span class="canto canto-sd" aria-hidden="true" />
        <span class="canto canto-ie" aria-hidden="true" />
        <span class="canto canto-id" aria-hidden="true" />

        <p v-if="instrucao" class="aviso">{{ instrucao }}</p>
      </div>

      <p class="dica">
        Aponte a câmera para o QR Code e depois para o cartão-resposta
      </p>

      <div class="acoes">
        <button class="botao" type="button" @click="simularLeitura">
          Simular leitura
        </button>
        <RouterLink class="botao-secundario" to="/correcao">Cancelar</RouterLink>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.leitor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 420px;
}

.quadro {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 5;
  max-height: 64vh;
  overflow: hidden;
  background: var(--text);
  border-radius: var(--radius-lg);
}

.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Cantos do alvo de leitura, como no mockup. */
.canto {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: var(--surface);
  border-style: solid;
  border-width: 0;
}

.canto-se {
  top: 30%;
  left: 18%;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: var(--radius-sm);
}

.canto-sd {
  top: 30%;
  right: 18%;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: var(--radius-sm);
}

.canto-ie {
  bottom: 30%;
  left: 18%;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: var(--radius-sm);
}

.canto-id {
  right: 18%;
  bottom: 30%;
  border-right-width: 3px;
  border-bottom-width: 3px;
  border-bottom-right-radius: var(--radius-sm);
}

.aviso {
  position: relative;
  max-width: 220px;
  margin: 0;
  font-size: var(--text-sm);
  text-align: center;
  color: var(--surface);
}

.dica {
  margin: 0;
  font-size: var(--text-sm);
  text-align: center;
  color: var(--text-faint);
}

.acoes {
  display: flex;
  gap: var(--space-3);
}

.botao,
.botao-secundario {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: center;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.botao {
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.botao-secundario {
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
}

.vazio {
  padding: var(--space-5);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>
