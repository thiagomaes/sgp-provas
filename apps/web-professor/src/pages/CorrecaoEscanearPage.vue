<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import { conferirQrCode, MENSAGEM_DE_RECUSA } from '../correcao/qrcode'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacao, listarVersoes } from '../services/aplicacoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import { buscarProva } from '../services/provas'
import { buscarTurma } from '../services/turmas'
import type { Application, ApplicationVersionKey, Class, Exam } from '../types'

/**
 * Escanear prova (RF08) — fiel ao protótipo docs/telas/15-mobile-scanner.png.
 *
 * Abre a câmera traseira do celular pelo navegador (getUserMedia) e lê o QR
 * Code do cartão-resposta uns 8 quadros por segundo, com o BarcodeDetector do
 * navegador ou, onde ele não existe (iPhone, por exemplo), com o jsQR. O QR
 * Code válido leva à revisão na versão certa e, na prova identificada, no aluno
 * certo. A câmera só abre em contexto seguro (localhost ou o site publicado);
 * sem ela, "Escolher a versão" faz o mesmo à mão.
 *
 * A leitura das bolinhas do cartão é a T08: por enquanto o professor marca as
 * respostas na tela de revisão.
 */

type EstadoCamera = 'abrindo' | 'ativa' | 'negada' | 'indisponivel'

/** Largura do quadro analisado: menor que o vídeo, para o celular dar conta. */
const LARGURA_DE_LEITURA = 640
const INTERVALO_MS = 125

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const aplicacao = ref<Application | null>(null)
const prova = ref<Exam | null>(null)
const turma = ref<Class | null>(null)
const versoes = ref<ApplicationVersionKey[]>([])
const carregando = ref(true)
const erroCarga = ref('')

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const encontrada = await buscarAplicacao(id)
    const [provaEncontrada, turmaEncontrada, versoesEncontradas] = await Promise.all([
      buscarProva(encontrada.provaId).catch(() => null),
      buscarTurma(encontrada.turmaId),
      listarVersoes(id),
    ])
    aplicacao.value = encontrada
    prova.value = provaEncontrada
    turma.value = turmaEncontrada
    versoes.value = versoesEncontradas
  } catch (erro) {
    if (!(erro instanceof ErroApi && erro.status === 404)) {
      erroCarga.value = mensagemDeErro(erro, 'Não foi possível carregar a aplicação.')
    }
  } finally {
    carregando.value = false
  }
}

const video = ref<HTMLVideoElement | null>(null)
const estado = ref<EstadoCamera>('abrindo')
let stream: MediaStream | null = null
/** A tela já foi fechada: uma câmera que abrir depois disso é desligada. */
let saiu = false

const instrucao = computed(() => {
  if (estado.value === 'negada') {
    return 'O acesso à câmera foi negado. Libere a câmera nas permissões do navegador ou use "Escolher a versão".'
  }
  if (estado.value === 'indisponivel') {
    return 'Câmera indisponível neste dispositivo. Use "Escolher a versão" ou abra esta tela no celular.'
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
    if (saiu) {
      fecharCamera()
      return
    }
    if (video.value) {
      video.value.srcObject = stream
    }
    estado.value = 'ativa'
    iniciarLeitura()
  } catch (erro) {
    const nome = erro instanceof DOMException ? erro.name : ''
    estado.value = nome === 'NotAllowedError' ? 'negada' : 'indisponivel'
  }
}

function fecharCamera() {
  stream?.getTracks().forEach((trilha) => trilha.stop())
  stream = null
}

// ---------- leitura do QR Code ----------

interface Detector {
  detect(imagem: CanvasImageSource): Promise<{ rawValue: string }[]>
}
type ConstrutorDeDetector = {
  new (opcoes: { formats: string[] }): Detector
  getSupportedFormats(): Promise<string[]>
}

type Decodificador = (quadro: HTMLCanvasElement, contexto: CanvasRenderingContext2D) => Promise<string | null>

/** BarcodeDetector quando o navegador lê QR Code; senão o jsQR, carregado só aqui. */
async function criarDecodificador(): Promise<Decodificador> {
  const Nativo = (window as unknown as { BarcodeDetector?: ConstrutorDeDetector }).BarcodeDetector
  if (Nativo && (await Nativo.getSupportedFormats().catch((): string[] => [])).includes('qr_code')) {
    const detector = new Nativo({ formats: ['qr_code'] })
    return async (quadro) => (await detector.detect(quadro))[0]?.rawValue ?? null
  }
  const { default: jsQR } = await import('jsqr')
  return async (quadro, contexto) => {
    const imagem = contexto.getImageData(0, 0, quadro.width, quadro.height)
    return jsQR(imagem.data, imagem.width, imagem.height, { inversionAttempts: 'dontInvert' })?.data ?? null
  }
}

const mensagem = ref<{ texto: string; tipo: 'ok' | 'erro' } | null>(null)
let lendo = false
let temporizador: ReturnType<typeof setTimeout> | undefined

async function iniciarLeitura() {
  const decodificar = await criarDecodificador()
  const quadro = document.createElement('canvas')
  const contexto = quadro.getContext('2d', { willReadFrequently: true })
  if (!contexto || saiu) return
  lendo = true

  const lerQuadro = async () => {
    const atual = video.value
    if (lendo && atual && atual.readyState >= 2 && atual.videoWidth > 0) {
      const escala = Math.min(1, LARGURA_DE_LEITURA / atual.videoWidth)
      quadro.width = Math.round(atual.videoWidth * escala)
      quadro.height = Math.round(atual.videoHeight * escala)
      contexto.drawImage(atual, 0, 0, quadro.width, quadro.height)
      const texto = await decodificar(quadro, contexto).catch(() => null)
      if (texto && lendo) tratarLeitura(texto)
    }
    if (lendo) temporizador = setTimeout(lerQuadro, INTERVALO_MS)
  }
  lerQuadro()
}

function pararLeitura() {
  lendo = false
  clearTimeout(temporizador)
}

/** QR Code recusado mostra o motivo e continua lendo; o válido abre a revisão. */
function tratarLeitura(texto: string) {
  const resultado = conferirQrCode(texto, id, versoes.value)
  if (!resultado.ok) {
    mensagem.value = { texto: MENSAGEM_DE_RECUSA[resultado.motivo], tipo: 'erro' }
    return
  }

  pararLeitura()
  navigator.vibrate?.(120)
  const { numeroVersao, alunoId } = resultado.qrCode
  mensagem.value = { texto: `Versão ${numeroVersao} identificada`, tipo: 'ok' }
  setTimeout(() => abrirRevisao(numeroVersao, alunoId), 600)
}

function abrirRevisao(numeroVersao: number, alunoId: string | null) {
  router.push({
    path: `/correcao/${id}/revisao`,
    query: { versao: String(numeroVersao), ...(alunoId ? { aluno: alunoId } : {}) },
  })
}

// ---------- plano B: escolher a versão à mão ----------

const escolhendo = ref(false)

function escolherVersao(versao: ApplicationVersionKey) {
  pararLeitura()
  abrirRevisao(versao.numeroVersao, versao.aluno?.id ?? null)
}

// O quadro do vídeo só aparece depois que a aplicação carrega.
onMounted(async () => {
  await carregar()
  if (!aplicacao.value || versoes.value.length === 0) return
  await nextTick()
  abrirCamera()
})
// Sair da tela para a leitura e desliga a câmera (a luz do celular apaga).
onBeforeUnmount(() => {
  saiu = true
  pararLeitura()
  fecharCamera()
})
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

    <EstadoTela v-if="carregando" tipo="carregando">Carregando aplicação...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>

    <div v-else-if="!aplicacao" class="vazio">
      Aplicação não encontrada.
      <RouterLink to="/correcao">Voltar para a correção</RouterLink>
    </div>

    <div v-else-if="versoes.length === 0" class="vazio">
      As versões desta aplicação ainda não foram geradas. Gere o PDF em
      <RouterLink :to="`/aplicacoes/${aplicacao.id}/exportar`">Configurar PDF</RouterLink>
      antes de corrigir.
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

      <p
        v-if="mensagem"
        class="leitura"
        :class="mensagem.tipo === 'ok' ? 'leitura-ok' : 'leitura-erro'"
        role="status"
      >
        {{ mensagem.texto }}
      </p>
      <p v-else class="dica">Aponte a câmera para o QR Code do cartão-resposta</p>

      <div class="acoes">
        <button class="botao" type="button" @click="escolhendo = !escolhendo">
          Escolher a versão
        </button>
        <RouterLink class="botao-secundario" to="/correcao">Cancelar</RouterLink>
      </div>

      <ul v-if="escolhendo" class="versoes" aria-label="Versões desta aplicação">
        <li v-for="versao in versoes" :key="versao.numeroVersao">
          <button class="versao" type="button" @click="escolherVersao(versao)">
            <span class="versao-numero">Versão {{ versao.numeroVersao }}</span>
            <span v-if="versao.aluno" class="versao-aluno">
              {{ versao.aluno.nome }} · {{ versao.aluno.matricula }}
            </span>
          </button>
        </li>
      </ul>
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

/* Cantos do alvo de leitura, como no protótipo. */
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

.leitura {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  border-radius: var(--radius-sm);
}

.leitura-ok {
  color: var(--accent-dark);
  background: var(--accent-soft);
}

.leitura-erro {
  color: var(--warn);
  background: var(--warn-soft);
}

.versoes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 50vh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.versao {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  text-align: left;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.versao:hover {
  background: var(--bg);
}

.versao-numero {
  font-weight: 600;
}

.versao-aluno {
  font-size: var(--text-sm);
  color: var(--text-soft);
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
