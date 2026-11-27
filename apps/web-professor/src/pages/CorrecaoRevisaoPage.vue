<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import { precisaConferir } from '../correcao/captura'
import type { QuestaoLida } from '../correcao/leitura-cartao'
import { LETRAS_IMPRESSAS, notaPrevista, respostasParaApi, type Marcacoes } from '../correcao/respostas'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacao, listarVersoes } from '../services/aplicacoes'
import { listarCorrecoes, novoIdDeCorrecao } from '../services/correcoes'
import { registrarOuGuardar } from '../services/filaOffline'
import { ErroApi, mensagemDeErro } from '../services/http'
import { useLeituraStore } from '../stores/leitura'
import type { Application, ApplicationVersionKey, Correction, OptionLetter, PrintedQuestion } from '../types'

/**
 * Revisar correção (RF08, RF09) — fiel ao protótipo docs/telas/16-mobile-revisao.png.
 *
 * Abre na versão lida no QR Code (?versao=N) e, na prova identificada, no
 * aluno dela (&aluno=<id>). As questões aparecem na ordem impressa e com as
 * letras impressas, como no cartão do aluno. Vinda da câmera, a tela já traz as
 * respostas lidas no cartão, a miniatura da foto e, em amarelo, as questões em
 * branco, anuladas ou de leitura fraca, para o professor conferir. Sem a
 * leitura ("Escolher a versão", "Marcar à mão" ou a página recarregada), as
 * respostas começam em branco e o professor marca na tela. Ao confirmar, as
 * letras são convertidas para as originais e a API recalcula a nota com o
 * gabarito do banco.
 */

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const numeroVersao = Number(route.query.versao)
const alunoDoQrCode = typeof route.query.aluno === 'string' ? route.query.aluno : null
const telaDeEscanear = `/correcao/${id}/escanear`
/** Respostas lidas pela câmera, quando a tela veio da leitura do cartão. */
const leitura = useLeituraStore().retirar(id, numeroVersao)

const aplicacao = ref<Application | null>(null)
const versao = ref<ApplicationVersionKey | null>(null)
const correcoes = ref<Correction[]>([])
const carregando = ref(true)
const erroCarga = ref('')

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const [encontrada, versoes, lidas] = await Promise.all([
      buscarAplicacao(id),
      listarVersoes(id),
      listarCorrecoes(id),
    ])
    aplicacao.value = encontrada
    versao.value = versoes.find((item) => item.numeroVersao === numeroVersao) ?? null
    correcoes.value = lidas
    preencherComALeitura()
  } catch (erro) {
    if (!(erro instanceof ErroApi && erro.status === 404)) {
      erroCarga.value = mensagemDeErro(erro, 'Não foi possível carregar a prova lida.')
    }
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  // Sem a versão lida no QR Code não há o que revisar: volta para a câmera.
  if (!Number.isInteger(numeroVersao) || numeroVersao < 1) {
    router.replace(telaDeEscanear)
    return
  }
  carregar()
})

/** Aluno da prova identificada: vem da versão guardada, não só do QR Code. */
const aluno = computed(() => versao.value?.aluno ?? null)

/** Motivo para não deixar revisar esta prova, ou null se pode. */
const impedimento = computed(() => {
  if (!aplicacao.value) return null
  if (!versao.value) return `Versão ${numeroVersao} não encontrada nesta aplicação.`
  if (alunoDoQrCode && alunoDoQrCode !== aluno.value?.id) {
    return 'O aluno do QR Code não é o desta versão. Gere o PDF de novo e use o cartão atual.'
  }
  if (aplicacao.value.status === 'concluida') return 'Todas as provas desta aplicação já foram corrigidas.'
  const atual = aluno.value
  if (atual && correcoes.value.some((correcao) => correcao.alunoId === atual.id)) {
    return `A prova de ${atual.nome} já foi corrigida. Para mudar a nota, use "Ver notas".`
  }
  return null
})

const questoes = computed<PrintedQuestion[]>(() => versao.value?.questoes ?? [])

const marcacoes = ref<Marcacoes>({ letras: {}, pontos: {} })

/** Leitura de cada questão objetiva, pelo id da questão. */
const lidas = ref<Record<string, QuestaoLida>>({})

function preencherComALeitura() {
  if (!leitura || !versao.value) return
  const daVersao = new Set(versao.value.questoes.map((questao) => questao.questaoId))
  for (const lida of leitura.questoes) {
    if (!daVersao.has(lida.questaoId)) continue
    lidas.value[lida.questaoId] = lida
    marcacoes.value.letras[lida.questaoId] = lida.letra
  }
}

/** Texto do destaque amarelo, ou null quando a leitura não pede conferência. */
function avisoDaLeitura(questao: PrintedQuestion): string | null {
  const lida = lidas.value[questao.questaoId]
  if (!lida || !precisaConferir(lida)) return null
  if (lida.estado === 'em-branco') return 'Em branco: confira'
  if (lida.motivo === 'mais-de-uma') return 'Mais de uma marcação: anulada'
  if (lida.estado === 'anulada') return 'Marcação duvidosa: confira'
  return 'Leitura fraca: confira'
}

const paraConferir = computed(() => questoes.value.filter((questao) => avisoDaLeitura(questao)).length)

function marcar(questao: PrintedQuestion, letra: OptionLetter) {
  const atual = marcacoes.value.letras[questao.questaoId] ?? null
  // Tocar de novo na letra marcada deixa a questão em branco.
  marcacoes.value.letras[questao.questaoId] = atual === letra ? null : letra
}

function letrasImpressas(questao: PrintedQuestion): OptionLetter[] {
  return LETRAS_IMPRESSAS.slice(0, questao.alternativas.length)
}

const notaCalculada = computed(() => notaPrevista(questoes.value, marcacoes.value))

const totalPontos = computed(() =>
  Math.round(questoes.value.reduce((soma, questao) => soma + questao.pontuacao, 0) * 10) / 10,
)

/** Nota digitada pelo professor em "Ajustar nota"; null usa a calculada. */
const notaAjustada = ref<number | null>(null)
const ajustando = ref(false)
const valorDigitado = ref<number | null>(null)
const erro = ref('')

const notaFinal = computed(() => notaAjustada.value ?? notaCalculada.value)

function formatarNota(nota: number): string {
  return nota.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function abrirAjuste() {
  ajustando.value = true
  valorDigitado.value = notaFinal.value
  erro.value = ''
}

function aplicarAjuste() {
  const valor = valorDigitado.value
  if (valor === null || Number.isNaN(valor) || valor < 0 || valor > totalPontos.value) {
    erro.value = `Digite uma nota entre 0 e ${formatarNota(totalPontos.value)}.`
    return
  }
  notaAjustada.value = Number(valor.toFixed(1))
  ajustando.value = false
  erro.value = ''
}

/**
 * Id desta leitura, gerado uma vez: clicar "Confirmar" de novo depois de
 * uma falha de rede reenvia o mesmo id e a API não duplica (RF10).
 */
const clientCorrectionId = novoIdDeCorrecao()
const enviando = ref(false)
const erroEnvio = ref('')

async function confirmar() {
  if (!versao.value) return

  enviando.value = true
  erroEnvio.value = ''
  try {
    // Sem internet, a correção fica na fila e é enviada quando a conexão voltar (RF10).
    await registrarOuGuardar(id, {
      clientCorrectionId,
      origem: 'mobile',
      versao: versao.value.numeroVersao,
      alunoId: aluno.value?.id ?? null,
      respostas: respostasParaApi(questoes.value, marcacoes.value),
      ...(notaAjustada.value === null ? {} : { nota: notaAjustada.value }),
    })
    // Volta para a câmera, para ler a próxima prova.
    router.push(telaDeEscanear)
  } catch (falha) {
    erroEnvio.value = mensagemDeErro(falha, 'Não foi possível gravar a correção.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/correcao">Correção</RouterLink> /
      <RouterLink :to="telaDeEscanear">Escanear</RouterLink>
    </template>
    <template #titulo>Revisar correção</template>
    <template #subtitulo>
      <template v-if="versao">Versão {{ versao.numeroVersao }} · </template>
      <template v-if="aluno">{{ aluno.nome }} · matrícula {{ aluno.matricula }}</template>
      <template v-else-if="versao">
        Aluno não identificado · a nota é lançada depois em "Ver notas"
      </template>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando a prova lida...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>

    <div v-else-if="!aplicacao" class="vazio">
      Aplicação não encontrada.
      <RouterLink to="/correcao">Voltar para a correção</RouterLink>
    </div>

    <div v-else-if="impedimento" class="vazio">
      {{ impedimento }}
      <RouterLink :to="telaDeEscanear">Ler outra prova</RouterLink>
    </div>

    <div v-else class="revisao">
      <div class="nota">
        <p class="nota-valor">{{ formatarNota(notaFinal) }}</p>
        <p class="nota-legenda">
          {{
            notaAjustada !== null
              ? 'nota ajustada pelo professor'
              : leitura
                ? 'nota calculada pelas respostas lidas no cartão'
                : 'nota calculada pelas respostas marcadas'
          }}
        </p>
      </div>

      <figure v-if="leitura?.miniatura" class="foto">
        <img :src="leitura.miniatura" alt="Grade do cartão lida pela câmera, com as respostas lidas circuladas" />
        <figcaption>Foto do cartão: a letra lida está circulada.</figcaption>
      </figure>

      <p v-if="leitura" class="dica">
        Respostas lidas no cartão.
        <template v-if="paraConferir">
          Confira {{ paraConferir === 1 ? 'a questão destacada' : `as ${paraConferir} questões destacadas` }} em
          amarelo; para corrigir, toque na letra.
        </template>
        <template v-else>Se algo estiver diferente do cartão, toque na letra para corrigir.</template>
      </p>
      <p v-else class="dica">Marque as respostas como estão no cartão do aluno.</p>

      <ul class="questoes">
        <li
          v-for="questao in questoes"
          :key="questao.questaoId"
          class="questao"
          :class="{ conferir: avisoDaLeitura(questao) }"
        >
          <span class="questao-numero">
            Questão {{ questao.ordem }}
            <span v-if="avisoDaLeitura(questao)" class="aviso-leitura">{{ avisoDaLeitura(questao) }}</span>
          </span>

          <span v-if="questao.tipo === 'objetiva'" class="alternativas" role="group" :aria-label="`Questão ${questao.ordem}`">
            <button
              v-for="letra in letrasImpressas(questao)"
              :key="letra"
              type="button"
              class="alternativa"
              :class="{ marcada: marcacoes.letras[questao.questaoId] === letra }"
              :aria-pressed="marcacoes.letras[questao.questaoId] === letra"
              @click="marcar(questao, letra)"
            >
              {{ letra }}
            </button>
          </span>

          <label v-else class="discursiva">
            <span class="rotulo">Pontos (0 a {{ formatarNota(questao.pontuacao) }})</span>
            <input
              v-model.number="marcacoes.pontos[questao.questaoId]"
              type="number"
              inputmode="decimal"
              min="0"
              :max="questao.pontuacao"
              step="0.5"
              :aria-label="`Pontos da questão ${questao.ordem}`"
            />
          </label>
        </li>
      </ul>

      <div v-if="ajustando" class="ajuste">
        <label class="rotulo" for="nota">Nota (0 a {{ formatarNota(totalPontos) }})</label>
        <div class="ajuste-linha">
          <input
            id="nota"
            v-model.number="valorDigitado"
            type="number"
            inputmode="decimal"
            min="0"
            :max="totalPontos"
            step="0.5"
            @keyup.enter="aplicarAjuste"
          />
          <button class="botao-secundario" type="button" @click="aplicarAjuste">
            Aplicar
          </button>
        </div>
        <p v-if="erro" class="erro">{{ erro }}</p>
      </div>

      <p v-if="erroEnvio" class="erro" role="alert">{{ erroEnvio }}</p>

      <div class="acoes">
        <button class="botao-secundario" type="button" :disabled="enviando" @click="abrirAjuste">
          Ajustar nota
        </button>
        <button class="botao" type="button" :disabled="enviando" @click="confirmar">
          {{ enviando ? 'Gravando...' : 'Confirmar' }}
        </button>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.revisao {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 420px;
}

.nota {
  text-align: center;
}

.nota-valor {
  margin: 0;
  font-size: calc(var(--text-2xl) * 2);
  font-weight: 700;
  line-height: 1.1;
  color: var(--accent-dark);
}

.nota-legenda {
  margin: var(--space-1) 0 0;
  font-size: var(--text-base);
  color: var(--text-soft);
}

.questoes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.questao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  font-size: var(--text-lg);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.questao-numero {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.alternativas,
.discursiva {
  flex-shrink: 0;
}

/* Leitura que o professor precisa conferir (em branco, anulada ou fraca). */
.questao.conferir {
  padding-right: var(--space-2);
  padding-left: var(--space-2);
  background: var(--highlight-soft);
  border-radius: var(--radius-sm);
}

.aviso-leitura {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--highlight-text);
}

.foto {
  margin: 0;
}

.foto img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.foto figcaption {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-soft);
}

.alternativas {
  display: flex;
  gap: var(--space-2);
}

.alternativa {
  width: 38px;
  height: 38px;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  cursor: pointer;
}

.alternativa.marcada {
  color: var(--surface);
  background: var(--accent);
  border-color: var(--accent);
}

.discursiva {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.discursiva input {
  width: 80px;
  padding: var(--space-1) var(--space-2);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.dica {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.ajuste {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
}

.ajuste-linha {
  display: flex;
  gap: var(--space-3);
}

.ajuste-linha input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.ajuste-linha input:focus {
  outline: none;
  border-color: var(--accent);
}

.erro {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-md);
  cursor: pointer;
}

.botao {
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
}

.botao:disabled,
.botao-secundario:disabled {
  opacity: 0.7;
  cursor: wait;
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

.ajuste-linha .botao-secundario {
  flex: 0 0 auto;
}

.vazio {
  padding: var(--space-5);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>
