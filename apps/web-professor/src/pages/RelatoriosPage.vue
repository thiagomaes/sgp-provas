<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../layouts/AppShell.vue'

// Importação dos dados e serviços de mock
import { aplicacoes } from '../mocks/aplicacoes'
import { turmas } from '../mocks/turmas'
import { provas } from '../mocks/provas'
import { buscarCorrecoesPorAplicacao } from '../mocks/correcoes'

// Função para formatar a data de AAAA-MM-DD para DD/MM
const formatarData = (dataIso: string) => {
  if (!dataIso) return ''
  const partes = dataIso.split('-')
  if (partes.length < 3) return dataIso
  return `${partes[2]}/${partes[1]}`
}

// Prepara a lista de relatórios juntando dados e calculando médias
const relatorios = computed(() => {
  return aplicacoes.map(aplicacao => {
    const turma = turmas.find(t => t.id === aplicacao.turmaId)
    const prova = provas.find(p => p.id === aplicacao.provaId)
    
    // Calcula a média a partir das correções (conforme feedback)
    const correcoes = buscarCorrecoesPorAplicacao(aplicacao.id)
    const mediaCalculada = correcoes.length
      ? correcoes.reduce((soma, c) => soma + c.nota, 0) / correcoes.length
      : null

    return {
      ...aplicacao,
      nomeTurma: turma?.nome || 'Turma apagada',
      tituloProva: prova?.titulo || 'Prova apagada',
      dataFormatada: formatarData(aplicacao.data),
      mediaExibida: mediaCalculada !== null ? mediaCalculada.toFixed(1) : '—'
    }
  })
})
</script>

<template>
  <AppShell>
    <template #titulo>Relatórios e notas</template>
    <template #subtitulo>Notas por aplicação e relatórios consolidados</template>

    <div class="tabela-container">
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