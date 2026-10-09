<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { aplicacoes } from '../mocks/aplicacoes'
import { correcoes } from '../mocks/correcoes'
import { buscarProvaPorId } from '../mocks/provas'
import { buscarQuestaoPorId } from '../mocks/questoes'
import { buscarTurmaPorId } from '../mocks/turmas'
import type { Correction, CorrectionAnswer } from '../mocks/types'

/**
 * Revisar correção (RF08, RF09) — fiel ao mockup docs/telas/16-mobile-revisao.png.
 *
 * Mostra a nota calculada a partir da leitura do cartão-resposta para o
 * professor conferir, ajustar se precisar e confirmar. Confirmar grava a
 * correção no array do mock (padrão de estado da N1, ver CONTRIBUTING.md)
 * e soma 1 nas provas corrigidas da aplicação.
 *
 * TODO(N2/N3): as respostas abaixo são de exemplo, montadas a partir da
 * prova da aplicação. Com a leitura real, elas vêm do cartão-resposta lido
 * na tela de escanear, e o aluno vem do QR Code da prova identificada.
 */

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const listaAplicacoes = ref(aplicacoes)
const listaCorrecoes = ref(correcoes)

const aplicacao = computed(() =>
  listaAplicacoes.value.find((item) => item.id === id),
)
const prova = computed(() =>
  aplicacao.value ? buscarProvaPorId(aplicacao.value.provaId) : undefined,
)
const turma = computed(() =>
  aplicacao.value ? buscarTurmaPorId(aplicacao.value.turmaId) : undefined,
)

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
      (item) =>
        !listaCorrecoes.value.some(
          (correcao) => correcao.aplicacaoId === id && correcao.alunoId === item.id,
        ),
    ) ?? null
  )
})

/**
 * Leitura de exemplo: erra algumas questões por uma regra fixa (sem valor
 * aleatório), variando conforme quantas provas já foram corrigidas.
 */
const respostas = computed<CorrectionAnswer[]>(() => {
  if (!prova.value || !aplicacao.value) return []
  const jaCorrigidas = aplicacao.value.corrigidas

  return prova.value.questoes.map((item, posicao) => {
    const questao = buscarQuestaoPorId(item.questaoId)
    const acertou = (posicao + jaCorrigidas) % 4 !== 1
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

function confirmar() {
  if (!aplicacao.value) return
  const agora = Date.now()

  const correcao: Correction = {
    id: `correcao-${agora}`,
    aplicacaoId: aplicacao.value.id,
    alunoId: aluno.value?.id ?? null,
    versao: (aplicacao.value.corrigidas % aplicacao.value.versoes) + 1,
    nota: notaFinal.value,
    respostas: respostas.value,
    // 'mobile' = lida pela câmera do celular (o nome do tipo vem da N1).
    origem: 'mobile',
    clientCorrectionId: `cli-${agora}`,
    statusSync: 'sincronizada',
    corrigidaEm: new Date().toISOString().slice(0, 10),
  }

  listaCorrecoes.value.push(correcao)
  aplicacao.value.corrigidas += 1
  if (aplicacao.value.status === 'pdf-gerado') {
    aplicacao.value.status = 'em-correcao'
  }

  router.push('/correcao')
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

    <div v-if="!aplicacao || !prova" class="vazio">
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

      <div class="acoes">
        <button class="botao-secundario" type="button" @click="abrirAjuste">
          Ajustar nota
        </button>
        <button class="botao" type="button" @click="confirmar">Confirmar</button>
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
