<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { provas } from '../mocks/provas'

/**
 * Lista de provas (RF04) — fiel ao mockup docs/telas/07-provas-lista.png.
 *
 * O status é derivado: prova sem questão ainda é rascunho; com questão,
 * está pronta para ser aplicada. Não existe campo `status` em Exam e não
 * criamos um só para esta tela.
 */

const listaProvas = computed(() =>
  provas.map((prova) => ({
    ...prova,
    pronta: prova.questoes.length > 0,
  })),
)
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

    <table class="tabela">
      <thead>
        <tr>
          <th>Título</th>
          <th>Questões</th>
          <th>Pontuação</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prova in listaProvas" :key="prova.id">
          <td>{{ prova.titulo }}</td>
          <td>{{ prova.questoes.length }}</td>
          <td>{{ prova.totalPontos.toFixed(1).replace('.', ',') }}</td>
          <td>
            <span class="selo" :class="prova.pronta ? 'ok' : 'neutro'">
              {{ prova.pronta ? 'Pronta' : 'Rascunho' }}
            </span>
          </td>
        </tr>
        <tr v-if="listaProvas.length === 0">
          <td class="vazio" colspan="4">Nenhuma prova criada ainda.</td>
        </tr>
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

.vazio {
  color: var(--text-soft);
}
</style>
