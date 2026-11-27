<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import { desenharMiniatura, fotoDaCamera, quadroDoVideo } from '../correcao/captura'
import { lerCartao, type Imagem, type ResultadoDoCartao } from '../correcao/leitura-cartao'
import type { Ponto } from '../correcao/medidas-cartao'
import { conferirQrCode, MENSAGEM_DE_RECUSA } from '../correcao/qrcode'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacao, listarVersoes } from '../services/aplicacoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import { buscarProva } from '../services/provas'
import { buscarTurma } from '../services/turmas'
import { useLeituraStore } from '../stores/leitura'
import type { Application, ApplicationVersionKey, Class, Exam } from '../types'

/**
 * Escanear prova (RF08) — fiel ao protótipo docs/telas/15-mobile-scanner.png.
 *
 * Abre a câmera traseira do celular pelo navegador (getUserMedia) e lê o QR
 * Code do cartão-resposta várias vezes por segundo, com o BarcodeDetector do
 * navegador ou, onde ele não existe (iPhone, por exemplo), com o jsQR. O QR
 * Code válido identifica a versão e, na prova identificada, o aluno. Em
 * seguida a tela tira uma foto do cartão na maior resolução que a câmera der e
 * lê as bolinhas marcadas (correcao/leitura-cartao.ts), tentando os quadros
 * seguintes por até 2 segundos. A revisão abre com as respostas lidas; se a
 * leitura falhar, o professor tenta de novo ou marca à mão. A câmera só abre
 * em contexto seguro (localhost ou o site publicado); sem ela, "Escolher a
 * versão" leva à revisão para marcar à mão.
 */

type EstadoCamera = 'abrindo' | 'ativa' | 'negada' | 'indisponivel'

/**
 * Lado menor do quadro em que o QR Code é procurado. Com o cartão inteiro na
 * imagem o QR Code fica pequeno (o da prova identificada tem 41 módulos em
 * 35 mm), então só vídeos maiores que 1080p são reduzidos.
 */
const LADO_MENOR_DE_LEITURA = 1080
const INTERVALO_MS = 125
/** Tempo para achar um quadro em que as bolinhas sejam lidas. */
const TEMPO_DA_LEITURA_MS = 2000

const route = useRoute()
const router = useRouter()
const leituraStore = useLeituraStore()
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
    // Resolução alta: o cartão inteiro precisa caber com as bolinhas nítidas.
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
  detect(imagem: CanvasImageSource): Promise<{ rawValue: string; cornerPoints: Ponto[] }[]>
}
type ConstrutorDeDetector = {
  new (opcoes: { formats: string[] }): Detector
  getSupportedFormats(): Promise<string[]>
}

/** Texto do QR Code e o centro dele no quadro, para a leitura saber o lado de cima do cartão. */
interface QrCodeLido {
  texto: string
  centro: Ponto | null
}
type Decodificador = (quadro: HTMLCanvasElement, contexto: CanvasRenderingContext2D) => Promise<QrCodeLido | null>

function centroDos(pontos: Ponto[]): Ponto | null {
  if (pontos.length === 0) return null
  return {
    x: pontos.reduce((soma, ponto) => soma + ponto.x, 0) / pontos.length,
    y: pontos.reduce((soma, ponto) => soma + ponto.y, 0) / pontos.length,
  }
}

/** BarcodeDetector quando o navegador lê QR Code; senão o jsQR, carregado só aqui. */
async function criarDecodificador(): Promise<Decodificador> {
  const Nativo = (window as unknown as { BarcodeDetector?: ConstrutorDeDetector }).BarcodeDetector
  if (Nativo && (await Nativo.getSupportedFormats().catch((): string[] => [])).includes('qr_code')) {
    const detector = new Nativo({ formats: ['qr_code'] })
    return async (quadro) => {
      const [achado] = await detector.detect(quadro)
      return achado ? { texto: achado.rawValue, centro: centroDos(achado.cornerPoints ?? []) } : null
    }
  }
  const { default: jsQR } = await import('jsqr')
  return async (quadro, contexto) => {
    const imagem = contexto.getImageData(0, 0, quadro.width, quadro.height)
    const achado = jsQR(imagem.data, imagem.width, imagem.height, { inversionAttempts: 'dontInvert' })
    if (!achado) return null
    const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = achado.location
    return { texto: achado.data, centro: centroDos([topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]) }
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
      const escala = Math.min(1, LADO_MENOR_DE_LEITURA / Math.min(atual.videoWidth, atual.videoHeight))
      quadro.width = Math.round(atual.videoWidth * escala)
      quadro.height = Math.round(atual.videoHeight * escala)
      contexto.drawImage(atual, 0, 0, quadro.width, quadro.height)
      const lido = await decodificar(quadro, contexto).catch(() => null)
      if (lido && lendo) {
        // O centro do QR Code volta para a escala do vídeo, que é a da foto.
        const centro = lido.centro && { x: lido.centro.x / escala, y: lido.centro.y / escala }
        tratarLeitura(lido.texto, centro)
      }
    }
    if (lendo) temporizador = setTimeout(lerQuadro, INTERVALO_MS)
  }
  lerQuadro()
}

function pararLeitura() {
  lendo = false
  clearTimeout(temporizador)
}

/** QR Code recusado mostra o motivo e continua lendo; o válido passa para a leitura das bolinhas. */
function tratarLeitura(texto: string, centroDoQr: Ponto | null) {
  const resultado = conferirQrCode(texto, id, versoes.value)
  if (!resultado.ok) {
    mensagem.value = { texto: MENSAGEM_DE_RECUSA[resultado.motivo], tipo: 'erro' }
    return
  }

  pararLeitura()
  navigator.vibrate?.(120)
  const { numeroVersao, alunoId } = resultado.qrCode
  mensagem.value = { texto: `Versão ${numeroVersao} identificada. Lendo as marcações...`, tipo: 'ok' }
  lerMarcacoes(numeroVersao, alunoId, centroDoQr)
}

// ---------- leitura das bolinhas ----------

/** Situação da leitura das bolinhas depois do QR Code. */
const leituraDasBolinhas = ref<'parada' | 'lendo' | 'falhou'>('parada')
const falhaDaLeitura = ref('')
/** Versão e aluno do último QR Code válido, para "Marcar à mão" depois de uma falha. */
let qrCodeAtual: { numeroVersao: number; alunoId: string | null } | null = null

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/**
 * Primeiro a foto na resolução máxima (onde o navegador deixa); depois os
 * quadros do vídeo, até um ser lido ou o tempo acabar. O centro do QR Code só
 * vale para o vídeo: a foto do sensor pode vir girada, e aí o lado de cima sai
 * da região escura do QR Code no cartão.
 */
async function lerMarcacoes(numeroVersao: number, alunoId: string | null, centroDoQr: Ponto | null) {
  const versao = versoes.value.find((item) => item.numeroVersao === numeroVersao)
  if (!versao) return
  qrCodeAtual = { numeroVersao, alunoId }
  leituraDasBolinhas.value = 'lendo'

  const tela = document.createElement('canvas')
  let resultado: ResultadoDoCartao | null = null
  let imagem: Imagem | null = null
  const trilha = stream?.getVideoTracks()[0]
  if (trilha) {
    imagem = await fotoDaCamera(trilha)
    if (imagem) resultado = lerCartao(imagem, versao.questoes)
  }
  const limite = Date.now() + TEMPO_DA_LEITURA_MS
  while (!resultado?.ok && Date.now() < limite && !saiu) {
    imagem = video.value ? quadroDoVideo(video.value, tela) : null
    if (imagem) resultado = lerCartao(imagem, versao.questoes, { centroDoQr })
    // Deixa a tela respirar entre um quadro e outro.
    await esperar(80)
  }
  if (saiu) return

  if (!resultado?.ok || !imagem) {
    leituraDasBolinhas.value = 'falhou'
    mensagem.value = null
    falhaDaLeitura.value = resultado && !resultado.ok ? resultado.mensagem : 'A câmera não mandou nenhuma imagem'
    return
  }

  navigator.vibrate?.([60, 60, 60])
  leituraStore.guardar({
    aplicacaoId: id,
    numeroVersao,
    questoes: resultado.questoes,
    miniatura: desenharMiniatura(imagem, resultado.homografia, versao.questoes, resultado.questoes),
  })
  abrirRevisao(numeroVersao, alunoId)
}

function tentarDeNovo() {
  leituraDasBolinhas.value = 'parada'
  falhaDaLeitura.value = ''
  mensagem.value = null
  qrCodeAtual = null
  iniciarLeitura()
}

function marcarAMao() {
  if (qrCodeAtual) abrirRevisao(qrCodeAtual.numeroVersao, qrCodeAtual.alunoId)
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
      <div v-else-if="leituraDasBolinhas === 'falhou'" class="falha" role="alert">
        <p class="falha-titulo">Não deu para ler as marcações</p>
        <p class="falha-texto">
          {{ falhaDaLeitura }}. Use um lugar bem iluminado, sem reflexo na folha, e segure o
          celular parado até a imagem ficar nítida.
        </p>
        <div class="acoes">
          <button class="botao" type="button" @click="tentarDeNovo">Tentar de novo</button>
          <button class="botao-secundario" type="button" @click="marcarAMao">Marcar à mão</button>
        </div>
      </div>
      <p v-else class="dica">
        Aponte a câmera para o cartão-resposta, com os 4 quadrados pretos dentro da imagem
      </p>

      <div v-if="leituraDasBolinhas !== 'falhou'" class="acoes">
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

/* Cantos do alvo de leitura: o cartão inteiro (A4 em pé) cabe dentro deles. */
.canto {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: var(--surface);
  border-style: solid;
  border-width: 0;
}

.canto-se {
  top: 12%;
  left: 5%;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: var(--radius-sm);
}

.canto-sd {
  top: 12%;
  right: 5%;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: var(--radius-sm);
}

.canto-ie {
  bottom: 12%;
  left: 5%;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: var(--radius-sm);
}

.canto-id {
  right: 5%;
  bottom: 12%;
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

.falha {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--warn-soft);
  border-radius: var(--radius-md);
}

.falha-titulo {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--warn);
}

.falha-texto {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text);
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
