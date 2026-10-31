<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacao } from '../services/aplicacoes'
import { listarCorrecoes, novoIdDeCorrecao, registrarCorrecao } from '../services/correcoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import { buscarProva } from '../services/provas'
import { listarQuestoes } from '../services/questoes'
import { buscarTurma } from '../services/turmas'
import type { Application, Class, Correction, CorrectionAnswer, Exam, Question } from '../types'

/**
 * Revisar correção (RF08, RF09) — fiel ao protótipo docs/telas/16-mobile-revisao.png.
 *
 * Mostra a nota calculada a partir da leitura do cartão-resposta para o
 * professor conferir, ajustar se precisar e confirmar. Confirmar grava a
 * correção na API (POST /applications/:id/corrections), que recalcula a
 * nota com o gabarito do banco e soma 1 nas provas corrigidas.
 *
 * TODO(N3): as respostas abaixo são de exemplo, montadas a partir da
 * prova da aplicação. Com a leitura real, elas vêm do cartão-resposta lido
 * na tela de escanear, e o aluno vem do QR Code da prova identificada.
 */

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const aplicacao = ref<Application | null>(null)
const prova = ref<Exam | null>(null)
const turma = ref<Class | null>(null)
const questoes = ref<Question[]>([])
const correcoes = ref<Correction[]>([])
const carregando = ref(true)
const erroCarga = ref('')

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const encontrada = await buscarAplicacao(id)
    const [provaEncontrada, turmaEncontrada, banco, lidas] = await Promise.all([
      buscarProva(encontrada.provaId),
      buscarTurma(encontrada.turmaId),
      listarQuestoes(),
      listarCorrecoes(id),
    ])
    aplicacao.value = encontrada
    prova.value = provaEncontrada
    turma.value = turmaEncontrada
    questoes.value = banco
    correcoes.value = lidas
  } catch (erro) {
    if (!(erro instanceof ErroApi && erro.status === 404)) {
      erroCarga.value = mensagemDeErro(erro, 'Não foi possível carregar a correção.')
    }
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

/** A aplicação já teve todas as provas lidas. */
const semProvasRestantes = computed(
  () => !!aplicacao.value && aplicacao.value.corrigidas >= aplicacao.value.totalProvas,
)

/**
 * Aluno da prova lida. Na prova identificada, o QR Code diz de quem é: aqui
 * simulamos com o primeiro aluno da turma que ainda não tem correção. Na
 * prova sem identificação, não há aluno: a nota é lançada depois (RF09).
 */
const aluno = computed(() => {
  if (!aplicacao.value?.identificarAluno || !turma.value) return null

  return (
    turma.value.alunos.find(
      (item) => !correcoes.value.some((correcao) => correcao.alunoId === item.id),
    ) ?? null
  )
})

/**
 * Leitura de exemplo: erra algumas questões por uma regra fixa (sem valor
 * aleatório), variando conforme quantas provas já foram corrigidas. A nota
 * segue a mesma regra da API: objetiva vale tudo ou nada; discursiva, os
 * pontos dados.
 */
const respostas = computed<CorrectionAnswer[]>(() => {
  if (!prova.value || !aplicacao.value) return []
  const jaCorrigidas = aplicacao.value.corrigidas

  return [...prova.value.questoes]
    .sort((a, b) => a.ordem - b.ordem)
    .map((item, posicao) => {
      const questao = questoes.value.find((q) => q.id === item.questaoId)
      const acertou = !!questao && (posicao + jaCorrigidas) % 4 !== 1
      const alternativas = questao?.alternativas ?? []
      const correta = alternativas.find((alt) => alt.correta)?.letra ?? null
      const errada = alternativas.find((alt) => !alt.correta)?.letra ?? null

      return {
        questaoId: item.questaoId,
        marcada: questao?.tipo === 'objetiva' ? (acertou ? correta : errada) : null,
        correta: acertou,
        pontuacao: acertou ? item.pontuacao : 0,
      }
    })
})

const notaCalculada = computed(() =>
  Number(respostas.value.reduce((soma, item) => soma + item.pontuacao, 0).toFixed(1)),
)

const totalPontos = computed(() => prova.value?.totalPontos ?? 10)

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
  if (!aplicacao.value) return
  const lida = aplicacao.value

  enviando.value = true
  erroEnvio.value = ''
  try {
    await registrarCorrecao(lida.id, {
      clientCorrectionId,
      origem: 'mobile',
      versao: (lida.corrigidas % lida.versoes) + 1,
      alunoId: aluno.value?.id ?? null,
      respostas: respostas.value.map((resposta) => {
        const questao = questoes.value.find((q) => q.id === resposta.questaoId)
        return questao?.tipo === 'discursiva'
          ? { questaoId: resposta.questaoId, pontuacao: resposta.pontuacao }
          : { questaoId: resposta.questaoId, marcada: resposta.marcada }
      }),
      ...(notaAjustada.value === null ? {} : { nota: notaAjustada.value }),
    })
    router.push('/correcao')
  } catch (falha) {
    // Ex.: 409 "Gere o PDF desta aplicação antes de corrigir as provas."
    erroEnvio.value = mensagemDeErro(falha, 'Não foi possível gravar a correção.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/correcao">Correção</RouterLink>
    </template>
    <template #titulo>Revisar correção</template>
    <template #subtitulo>
      <template v-if="aluno">{{ aluno.nome }} · matrícula {{ aluno.matricula }}</template>
      <template v-else-if="aplicacao">
        Aluno não identificado · a nota é lançada depois em "Ver notas"
      </template>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando a prova lida...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>

    <div v-else-if="!aplicacao || !prova" class="vazio">
      Aplicação não encontrada.
      <RouterLink to="/correcao">Voltar para a correção</RouterLink>
    </div>

    <div v-else-if="semProvasRestantes || (aplicacao.identificarAluno && !aluno)" class="vazio">
      Todas as provas desta aplicação já foram corrigidas.
      <RouterLink to="/correcao">Voltar para a correção</RouterLink>
    </div>

    <div v-else class="revisao">
      <div class="nota">
        <p class="nota-valor">{{ formatarNota(notaFinal) }}</p>
        <p class="nota-legenda">
          {{ notaAjustada === null ? 'nota calculada automaticamente' : 'nota ajustada pelo professor' }}
        </p>
      </div>

      <ul class="questoes">
        <li v-for="(resposta, indice) in respostas" :key="resposta.questaoId" class="questao">
          <span>Questão {{ indice + 1 }}</span>
          <span
            class="marca"
            :class="resposta.correta ? 'marca-acerto' : 'marca-erro'"
            :aria-label="resposta.correta ? 'acertou' : 'errou'"
          >
            {{ resposta.correta ? '✓' : '✕' }}
          </span>
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
  padding: var(--space-4) 0;
  font-size: var(--text-lg);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.marca {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--surface);
  border-radius: 999px;
}

.marca-acerto {
  background: var(--accent);
}

.marca-erro {
  background: var(--warn);
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
