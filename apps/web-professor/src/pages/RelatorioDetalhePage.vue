<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacaoPorId } from '../mocks/aplicacoes'
import { buscarProvaPorId } from '../mocks/provas'
import { buscarTurmaPorId } from '../mocks/turmas'
import { correcoes } from '../mocks/correcoes'
import type { Correction } from '../mocks/types'

/**
 * Notas da aplicação (RF09, RF12) — fiel ao mockup
 * docs/telas/12-notas-detalhe.png.
 *
 * Aluno sem correção lida pelo app aparece como "— lançar —": é o
 * lançamento manual da RF09. Ao lançar, entra uma correção com
 * origem 'manual' na mesma lista das automáticas.
 */

const route = useRoute()
const listaCorrecoes = ref(correcoes)

const aplicacao = computed(() =>
  buscarAplicacaoPorId(route.params.id as string),
)
const prova = computed(() =>
  aplicacao.value ? buscarProvaPorId(aplicacao.value.provaId) : undefined,
)
const turma = computed(() =>
  aplicacao.value ? buscarTurmaPorId(aplicacao.value.turmaId) : undefined,
)

/** Aluno da turma + a correção dele, quando existir. */
const linhas = computed(() => {
  if (!aplicacao.value || !turma.value) return []

  return turma.value.alunos.map((aluno) => ({
    aluno,
    correcao: listaCorrecoes.value.find(
      (item) =>
        item.aplicacaoId === aplicacao.value!.id && item.alunoId === aluno.id,
    ),
  }))
})

/** Aluno cuja nota está sendo lançada agora. */
const lancandoPara = ref<string | null>(null)
const notaDigitada = ref<number | null>(null)

function abrirLancamento(alunoId: string) {
  lancandoPara.value = alunoId
  notaDigitada.value = null
}

function confirmarLancamento(alunoId: string) {
  if (!aplicacao.value) return
  if (notaDigitada.value === null || Number.isNaN(notaDigitada.value)) return

  const total = prova.value?.totalPontos ?? 10
  const nota = Math.min(Math.max(notaDigitada.value, 0), total)

  const manual: Correction = {
    id: `correcao-manual-${Date.now()}`,
    aplicacaoId: aplicacao.value.id,
    alunoId,
    versao: 1,
    nota,
    // Lançamento manual não passa pelo cartão-resposta: sem respostas lidas.
    respostas: [],
    origem: 'manual',
    clientCorrectionId: `manual-${Date.now()}`,
    statusSync: 'sincronizada',
    corrigidaEm: new Date().toISOString().slice(0, 10),
  }

  listaCorrecoes.value.push(manual)
  aplicacao.value.corrigidas += 1
  lancandoPara.value = null
  notaDigitada.value = null
}

function formatarNota(valor: number): string {
  return valor.toFixed(1).replace('.', ',')
}

function exportar(formato: string) {
  mensagem.value = `Exportação em ${formato} entra na N2, junto com o back-end.`
}

const mensagem = ref('')
</script>

<template>
  <AppShell>
    <template #caminho>
      Relatórios / {{ prova?.titulo ?? '' }} — {{ turma?.nome ?? '' }}
    </template>
    <template #titulo>Notas</template>
    <template v-if="aplicacao" #acoes>
      <span class="acoes">
        <button class="botao-secundario" type="button" @click="exportar('CSV')">
          Exportar CSV
        </button>
        <button class="botao-secundario" type="button" @click="exportar('PDF')">
          Exportar PDF
        </button>
      </span>
    </template>

    <p v-if="!aplicacao" class="vazio">
      Nenhuma aplicação encontrada com este id.
    </p>

    <template v-else>
      <p v-if="mensagem" class="aviso">{{ mensagem }}</p>

      <table class="tabela">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Nota</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="linha.aluno.id">
            <td>{{ linha.aluno.nome }}</td>
            <td>{{ linha.aluno.matricula }}</td>

            <td>
              <template v-if="linha.correcao">
                {{ formatarNota(linha.correcao.nota) }}
              </template>

              <template v-else-if="lancandoPara === linha.aluno.id">
                <span class="lancamento">
                  <input
                    v-model.number="notaDigitada"
                    type="number"
                    min="0"
                    :max="prova?.totalPontos ?? 10"
                    step="0.5"
                    :aria-label="`Nota de ${linha.aluno.nome}`"
                  />
                  <button
                    class="botao"
                    type="button"
                    @click="confirmarLancamento(linha.aluno.id)"
                  >
                    Salvar
                  </button>
                </span>
              </template>

              <template v-else>
                <button
                  class="link-lancar"
                  type="button"
                  @click="abrirLancamento(linha.aluno.id)"
                >
                  — lançar —
                </button>
              </template>
            </td>

            <td>
              <span
                class="selo"
                :class="linha.correcao?.origem === 'mobile' ? 'ok' : 'atencao'"
              >
                {{
                  linha.correcao
                    ? linha.correcao.origem === 'mobile'
                      ? 'Automática'
                      : 'Manual'
                    : 'Manual pendente'
                }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </AppShell>
</template>

<style scoped>
.acoes {
  display: flex;
  gap: var(--space-2);
}

.botao-secundario {
  padding: var(--space-2) var(--space-4);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
}

.botao-secundario:hover {
  background: var(--bg);
}

.botao {
  padding: var(--space-1) var(--space-3);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.aviso {
  margin: 0 0 var(--space-4);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--accent-dark);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}

.lancamento {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lancamento input {
  width: 72px;
  padding: var(--space-1) var(--space-2);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.link-lancar {
  padding: 0;
  color: var(--warn);
  background: none;
  border: none;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabela th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-faint);
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.tabela td {
  padding: var(--space-4);
  font-size: var(--text-base);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.tabela tbody tr:last-child td {
  border-bottom: none;
}

.selo {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.selo.ok {
  color: var(--accent-dark);
  background: var(--accent-soft);
}

.selo.atencao {
  color: var(--warn);
  background: var(--warn-soft);
}

.vazio {
  color: var(--text-soft);
}
</style>
