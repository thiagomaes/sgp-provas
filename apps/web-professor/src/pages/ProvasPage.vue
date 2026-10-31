<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmarExclusao from '../components/ConfirmarExclusao.vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { mensagemDeErro } from '../services/http'
import { excluirProva, listarProvas } from '../services/provas'
import type { Exam } from '../types'

/**
 * Lista de provas (RF04) — fiel ao mockup docs/telas/07-provas-lista.png.
 *
 * O status é derivado: prova sem questão ainda é rascunho; com questão,
 * está pronta para ser aplicada. Não existe campo `status` em Exam.
 */

const listaProvas = ref<Exam[]>([])
const carregando = ref(true)
const erroLista = ref('')

async function carregar() {
  carregando.value = true
  erroLista.value = ''
  try {
    listaProvas.value = await listarProvas()
  } catch (erro) {
    erroLista.value = mensagemDeErro(erro, 'Não foi possível carregar as provas.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

function formatarPontos(valor: number): string {
  return valor.toFixed(1).replace('.', ',')
}

/** Prova com a confirmação de exclusão aberta. */
const excluindoId = ref<string | null>(null)
const excluindo = ref(false)
const erroExclusao = ref('')

function pedirExclusao(id: string) {
  excluindoId.value = id
  erroExclusao.value = ''
}

async function confirmarExclusao(id: string) {
  excluindo.value = true
  erroExclusao.value = ''
  try {
    await excluirProva(id)
    listaProvas.value = listaProvas.value.filter((prova) => prova.id !== id)
    excluindoId.value = null
  } catch (erro) {
    erroExclusao.value = mensagemDeErro(erro, 'Não foi possível excluir a prova.')
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #titulo>Provas</template>
    <template #subtitulo>
      Provas reutilizáveis montadas a partir do banco de questões.
    </template>
    <template #acoes>
      <RouterLink class="botao" to="/provas/nova">+ Nova prova</RouterLink>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando provas...</EstadoTela>
    <EstadoTela v-else-if="erroLista" tipo="erro" @tentar="carregar">{{ erroLista }}</EstadoTela>
    <EstadoTela v-else-if="listaProvas.length === 0" tipo="vazio">
      Nenhuma prova criada ainda. Use "+ Nova prova" para montar a primeira.
    </EstadoTela>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Título</th>
          <th>Questões</th>
          <th>Pontuação</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="prova in listaProvas" :key="prova.id">
          <tr>
            <td>{{ prova.titulo }}</td>
            <td>{{ prova.questoes.length }}</td>
            <td>{{ formatarPontos(prova.totalPontos) }}</td>
            <td>
              <span class="selo" :class="prova.questoes.length > 0 ? 'ok' : 'neutro'">
                {{ prova.questoes.length > 0 ? 'Pronta' : 'Rascunho' }}
              </span>
            </td>
            <td class="tabela-acao">
              <RouterLink :to="`/provas/${prova.id}/editar`">Editar</RouterLink>
              <button class="link-acao" type="button" @click="pedirExclusao(prova.id)">
                Excluir
              </button>
            </td>
          </tr>
          <tr v-if="excluindoId === prova.id">
            <td colspan="5">
              <ConfirmarExclusao
                :alvo="`a prova ${prova.titulo}`"
                detalhe="As aplicações que já usam esta prova continuam com as notas."
                :excluindo="excluindo"
                :erro="erroExclusao"
                @confirmar="confirmarExclusao(prova.id)"
                @cancelar="excluindoId = null"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </AppShell>
</template>

<style scoped>
.botao {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
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

.selo.neutro {
  color: var(--text-soft);
  background: var(--bg);
}

.tabela-acao {
  text-align: right;
  white-space: nowrap;
}

.tabela-acao a {
  font-weight: 600;
  color: var(--text);
}

.tabela-acao a:hover,
.link-acao:hover {
  color: var(--accent-dark);
}

.link-acao {
  margin-left: var(--space-4);
  padding: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-soft);
  background: none;
  border: none;
  cursor: pointer;
}
</style>
