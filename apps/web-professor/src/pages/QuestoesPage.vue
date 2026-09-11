<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { questoesState } from '../state/questoes'

const router = useRouter()
const busca = ref('')
const filtroAtual = ref('Todas')

const chips = computed(() => {
  const tags = [...new Set(questoesState.flatMap((questao) => questao.tags))]
  return ['Todas', 'Objetivas', 'Discursivas', ...tags]
})

const questoesFiltradas = computed(() => {
  const termo = busca.value.trim().toLowerCase()

  return questoesState.filter((questao) => {
    const matchBusca =
      termo.length === 0 || questao.enunciado.toLowerCase().includes(termo)

    const matchTipo =
      filtroAtual.value === 'Todas' ||
      (filtroAtual.value === 'Objetivas' && questao.tipo === 'objetiva') ||
      (filtroAtual.value === 'Discursivas' && questao.tipo === 'discursiva') ||
      questao.tags.some((tag) => tag.toLowerCase() === filtroAtual.value.toLowerCase())

    return matchBusca && matchTipo
  })
})

const resumirTexto = (texto: string) => {
  return texto.length > 90 ? `${texto.slice(0, 90).trim()}...` : texto
}

const irParaNovaQuestao = () => {
  router.push('/questoes/nova')
}

const irParaEdicao = (id: string) => {
  router.push({ name: 'questao-editar', params: { id } })
}
</script>

<template>
  <AppShell>
    <template #titulo>Banco de questões</template>
    <template #subtitulo>Questões objetivas e discursivas, com tags e busca</template>

    <section class="pagina-questoes">
      <div class="toolbar">
        <input
          v-model="busca"
          type="search"
          class="campo-busca"
          placeholder="Buscar por enunciado ou tag..."
        />
        <button type="button" class="botao-primario" @click="irParaNovaQuestao">
          + Nova questão
        </button>
      </div>

      <div class="filtros" aria-label="Filtros de questão">
        <button
          v-for="chip in chips"
          :key="chip"
          type="button"
          class="chip"
          :class="{ ativo: filtroAtual === chip }"
          @click="filtroAtual = chip"
        >
          {{ chip }}
        </button>
      </div>

      <div class="tabela-wrap" v-if="questoesFiltradas.length">
        <table>
          <thead>
            <tr>
              <th>Enunciado</th>
              <th>Tipo</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="questao in questoesFiltradas" :key="questao.id">
              <td class="coluna-enunciado">{{ resumirTexto(questao.enunciado) }}</td>
              <td>
                <span class="badge" :class="questao.tipo === 'objetiva' ? 'objetiva' : 'discursiva'">
                  {{ questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva' }}
                </span>
              </td>
              <td>
                <div class="tags" v-if="questao.tags.length">
                  <span v-for="tag in questao.tags" :key="`${questao.id}-${tag}`" class="tag">
                    {{ tag }}
                  </span>
                </div>
              </td>
              <td class="coluna-acoes">
                <button type="button" class="botao-link" @click="irParaEdicao(questao.id)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="vazio">
        Nenhuma questão encontrada para o filtro atual.
      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.pagina-questoes {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.campo-busca {
  flex: 1;
  min-height: 42px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
}

.campo-busca:focus {
  outline: 2px solid var(--accent-soft);
  border-color: var(--accent);
}

.botao-primario,
.botao-link,
.chip {
  transition: all 0.15s ease-in-out;
}

.botao-primario {
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--surface);
  padding: 0 var(--space-4);
  min-height: 42px;
  font-weight: 600;
  cursor: pointer;
}

.botao-primario:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-soft);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}

.chip.ativo {
  background: var(--accent-soft);
  border-color: var(--border-strong);
  color: var(--accent-dark);
  font-weight: 600;
}

.tabela-wrap {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

th {
  font-size: var(--text-sm);
  color: var(--text-soft);
  font-weight: 600;
}

tr:last-child td {
  border-bottom: none;
}

.coluna-enunciado {
  width: 58%;
  color: var(--text);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  padding: var(--space-1) var(--space-2);
  border-radius: 999px;
  font-size: var(--text-sm);
  border: 1px solid transparent;
}

.badge.objetiva {
  background: var(--bg);
  color: var(--text-soft);
  border-color: var(--border);
}

.badge.discursiva {
  background: var(--accent-soft);
  color: var(--accent-dark);
  border-color: var(--border-strong);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.tag {
  display: inline-flex;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: var(--space-1) var(--space-2);
  color: var(--text-soft);
  font-size: var(--text-sm);
}

.coluna-acoes {
  width: 90px;
}

.botao-link {
  background: transparent;
  border: none;
  color: var(--accent-dark);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.vazio {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface);
  padding: var(--space-5);
  color: var(--text-soft);
  text-align: center;
}
</style>
