<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../layouts/AppShell.vue'

// Importação dos dados falsos (mocks)
import { aplicacoes } from '../mocks/aplicacoes'
import { turmas } from '../mocks/turmas'
import { provas } from '../mocks/provas'

// Prepara a lista de relatórios juntando os dados
const relatorios = computed(() => {
  return aplicacoes.map(aplicacao => {
    // Busca a turma e a prova correspondentes aos IDs da aplicação
    const turma = turmas.find(t => t.id === aplicacao.turmaId)
    const prova = provas.find(p => p.id === aplicacao.provaId)
    
    // Retorna todos os dados da aplicação + os nomes reais encontrados
    return {
      ...aplicacao,
      nomeTurma: turma?.nome || 'Turma apagada',
      tituloProva: prova?.titulo || 'Prova apagada'
    }
  })
})
</script>

<template>
  <AppShell>
    <!-- Cabeçalho da página usando os slots do AppShell -->
    <template #titulo>Relatórios e notas</template>
    <template #subtitulo>Notas por aplicação e relatórios consolidados</template>

    <!-- Tabela de dados -->
    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Turma</th>
            <th>Prova</th>
            <th>Data</th>
            <th>Média</th>
            <th></th> <!-- Coluna do link -->
          </tr>
        </thead>
        <tbody>
          <!-- Loop passando por cada relatório preparado no script -->
          <tr v-for="relatorio in relatorios" :key="relatorio.id">
            <td>{{ relatorio.nomeTurma }}</td>
            <td>{{ relatorio.tituloProva }}</td>
            <td>{{ relatorio.data }}</td> 
            <td>{{ relatorio.media ?? '-' }}</td>
            
            <!-- Link de navegação para a página de detalhes -->
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
/* Container da tabela para bordas arredondadas */
.tabela-container {
  margin-top: 2rem;
  background-color: var(--surface-primary, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
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
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

th {
  background-color: var(--surface-secondary, #f8fafc);
  color: var(--text-muted, #64748b);
  font-weight: 600;
}

/* Remove a linha de baixo do último item para ficar bonito */
tr:last-child td {
  border-bottom: none;
}

.coluna-acao {
  text-align: right;
}

.btn-link {
  color: var(--color-primary, #2563eb);
  text-decoration: none;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>