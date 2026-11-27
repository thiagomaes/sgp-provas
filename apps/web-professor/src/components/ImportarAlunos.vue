<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  lerPlanilha,
  MAXIMO_ALUNOS_POR_IMPORTACAO,
  montarPrevia,
  type LinhaPrevia,
} from '../services/importacao-alunos'
import { mensagemDeErro } from '../services/http'
import { importarAlunos } from '../services/turmas'
import type { Class } from '../types'

/**
 * Importação de alunos por planilha (RF03), aberta na TurmaDetalhePage.
 *
 * O professor escolhe um .csv ou .xlsx, vê a prévia com as linhas com erro
 * marcadas (sem nome, matrícula repetida, aluno já na turma) e confirma. Só as
 * linhas sem erro são enviadas, numa chamada só, e a API grava todas juntas.
 */
const props = defineProps<{
  turmaId: string
  /** Matrículas que já estão na turma, para marcar na prévia. */
  matriculas: string[]
}>()
const emit = defineEmits<{ importado: [turma: Class]; cancelar: [] }>()

const nomeArquivo = ref('')
const previa = ref<LinhaPrevia[]>([])
const lendo = ref(false)
const importando = ref(false)
const erro = ref('')

const prontas = computed(() => previa.value.filter((linha) => !linha.erro))
const comErro = computed(() => previa.value.length - prontas.value.length)

async function escolherArquivo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const arquivo = entrada.files?.[0]
  if (!arquivo) return

  erro.value = ''
  previa.value = []
  nomeArquivo.value = arquivo.name
  lendo.value = true
  try {
    previa.value = montarPrevia(await lerPlanilha(arquivo), props.matriculas)
    if (previa.value.length === 0) erro.value = 'A planilha não tem nenhum aluno.'
  } catch (falha) {
    erro.value =
      falha instanceof Error && falha.message.startsWith('Use um arquivo')
        ? falha.message
        : 'Não foi possível ler a planilha. Confira se o arquivo é um .csv ou .xlsx válido.'
  } finally {
    lendo.value = false
    // Permite escolher o mesmo arquivo de novo depois de corrigir.
    entrada.value = ''
  }
}

async function importar() {
  erro.value = ''
  if (prontas.value.length === 0) return
  if (prontas.value.length > MAXIMO_ALUNOS_POR_IMPORTACAO) {
    erro.value = `Importe no máximo ${MAXIMO_ALUNOS_POR_IMPORTACAO} alunos por vez.`
    return
  }

  importando.value = true
  try {
    const turma = await importarAlunos(
      props.turmaId,
      prontas.value.map(({ nome, matricula }) => ({ nome, matricula })),
    )
    emit('importado', turma)
  } catch (falha) {
    // 409: matrícula que outra pessoa cadastrou enquanto a prévia estava aberta.
    erro.value = mensagemDeErro(falha, 'Não foi possível importar os alunos.')
  } finally {
    importando.value = false
  }
}
</script>

<template>
  <section class="importar" aria-label="Importar alunos">
    <div class="cabeca">
      <h2 class="titulo">Importar alunos</h2>
      <p class="dica">
        Envie um arquivo <strong>.csv</strong> ou <strong>.xlsx</strong> com uma coluna
        <strong>Nome</strong> e uma <strong>Matrícula</strong>. Sem os títulos na primeira linha,
        a coluna A é o nome e a B é a matrícula.
      </p>
    </div>

    <label class="arquivo">
      <input type="file" accept=".csv,.xlsx" :disabled="lendo || importando" @change="escolherArquivo" />
      <span class="botao-secundario">{{ nomeArquivo ? 'Trocar arquivo' : 'Escolher arquivo' }}</span>
      <span v-if="nomeArquivo" class="nome-arquivo">{{ nomeArquivo }}</span>
    </label>

    <p v-if="lendo" class="resumo">Lendo a planilha...</p>

    <template v-if="previa.length > 0">
      <p class="resumo">
        <strong>{{ prontas.length }}</strong> {{ prontas.length === 1 ? 'aluno pronto' : 'alunos prontos' }}
        para importar<template v-if="comErro > 0">
          · <span class="resumo-erro">{{ comErro }} {{ comErro === 1 ? 'linha' : 'linhas' }} com erro
          {{ comErro === 1 ? 'vai' : 'vão' }} ficar de fora</span></template
        >.
      </p>

      <div class="rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Linha</th>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linha in previa" :key="linha.linha" :class="{ 'com-erro': linha.erro }">
              <td>{{ linha.linha }}</td>
              <td>{{ linha.nome || '—' }}</td>
              <td>{{ linha.matricula || '—' }}</td>
              <td>{{ linha.erro || 'Pronto' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

    <div class="acoes">
      <button
        class="botao"
        type="button"
        :disabled="prontas.length === 0 || importando"
        @click="importar"
      >
        {{
          importando
            ? 'Importando...'
            : `Importar ${prontas.length} ${prontas.length === 1 ? 'aluno' : 'alunos'}`
        }}
      </button>
      <button class="botao-secundario" type="button" :disabled="importando" @click="emit('cancelar')">
        Cancelar
      </button>
    </div>
  </section>
</template>

<style scoped>
.importar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.titulo {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.dica {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.arquivo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

/* O input fica escondido; o botão ao lado abre a escolha do arquivo. */
.arquivo input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.arquivo input:focus-visible + .botao-secundario {
  outline: 2px solid var(--accent);
}

.nome-arquivo {
  font-size: var(--text-sm);
  color: var(--text-soft);
  overflow-wrap: anywhere;
}

.resumo {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text);
}

.resumo-erro {
  color: var(--warn);
}

.rolagem {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}

.tabela th {
  position: sticky;
  top: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-faint);
  text-align: left;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.tabela td {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.tabela tr.com-erro td {
  color: var(--warn);
  background: var(--warn-soft);
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
  flex-wrap: wrap;
  gap: var(--space-2);
}

.botao {
  padding: var(--space-2) var(--space-4);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}

.botao:hover:not(:disabled) {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.botao:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.botao-secundario {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}

.botao-secundario:hover {
  color: var(--text);
  background: var(--bg);
}
</style>
