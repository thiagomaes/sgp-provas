<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { listarAplicacoes } from '../services/aplicacoes'
import { mensagemDeErro } from '../services/http'
import { listarProvas } from '../services/provas'
import { buscarResumo } from '../services/relatorios'
import { listarTurmas } from '../services/turmas'
import type { Application, Class, Exam } from '../types'

/**
 * Relatórios e notas (RF12): uma linha por aplicação, com a média que a
 * API calcula em GET /reports/summary.
 */

const aplicacoes = ref<Application[]>([])
const turmas = ref<Class[]>([])
const provas = ref<Exam[]>([])
const medias = ref<Record<string, number | null>>({})
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [listaAplicacoes, listaTurmas, listaProvas, resumo] = await Promise.all([
      listarAplicacoes(),
      listarTurmas(),
      listarProvas(),
      buscarResumo(),
    ])
    aplicacoes.value = listaAplicacoes
    turmas.value = listaTurmas
    provas.value = listaProvas
    medias.value = resumo.medias
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível carregar os relatórios.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

// Formata a data de AAAA-MM-DD para DD/MM
const formatarData = (dataIso: string) => {
  const partes = dataIso.split('-')
  if (partes.length < 3) return dataIso
  return `${partes[2]}/${partes[1]}`
}

// Junta os nomes da turma e da prova com a média de cada aplicação
const relatorios = computed(() =>
  aplicacoes.value.map((aplicacao) => {
    const media = medias.value[aplicacao.id] ?? null
    return {
      ...aplicacao,
      nomeTurma: turmas.value.find((t) => t.id === aplicacao.turmaId)?.nome ?? 'Turma apagada',
      tituloProva: provas.value.find((p) => p.id === aplicacao.provaId)?.titulo ?? 'Prova apagada',
      dataFormatada: formatarData(aplicacao.data),
      mediaExibida: media === null ? '—' : media.toFixed(1).replace('.', ','),
    }
  }),
)
</script>

<template>
  <AppShell>
    <template #titulo>Relatórios e notas</template>
    <template #subtitulo>Notas por aplicação e relatórios consolidados</template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando relatórios...</EstadoTela>
    <EstadoTela v-else-if="erro" tipo="erro" @tentar="carregar">{{ erro }}</EstadoTela>
    <EstadoTela v-else-if="relatorios.length === 0" tipo="vazio">
      Nenhuma aplicação ainda. As notas aparecem aqui depois que você aplicar uma prova.
    </EstadoTela>

    <div v-else class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Turma</th>
            <th>Prova</th>
            <th>Data</th>
            <th>Média</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="relatorio in relatorios" :key="relatorio.id">
            <td>{{ relatorio.nomeTurma }}</td>
            <td>{{ relatorio.tituloProva }}</td>
            <td>{{ relatorio.dataFormatada }}</td>
            <td>{{ relatorio.mediaExibida }}</td>
            <td class="coluna-acao">
              <router-link :to="`/relatorios/${relatorio.id}`" class="btn-link">
                Ver resultados &rarr;
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppShell>
</template>

<style scoped>
.tabela-container {
  margin-top: 2rem;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

th {
  background-color: var(--surface);
  font-weight: 600;
}

tr:last-child td {
  border-bottom: none;
}

.coluna-acao {
  text-align: right;
}

.btn-link {
  color: var(--accent-dark);
  text-decoration: none;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>