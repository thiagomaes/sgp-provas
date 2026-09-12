<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { turmas, professoraLogada, buscarTurmaPorId } from '../mocks/turmas'
import { provas, buscarProvaPorId } from '../mocks/provas'
import { aplicacoes } from '../mocks/aplicacoes'
import type { Application } from '../mocks/types'

/**
 * Dashboard do professor — fiel ao mockup docs/telas/02-dashboard.png.
 *
 * Todos os números vêm dos mocks (turmas.length etc.), nunca fixos no
 * template: assim que alguém cadastrar uma turma nova em /turmas, o card
 * daqui acompanha.
 */

/** Primeiro nome, como no mockup ("Olá, Ana"). */
const primeiroNome = computed(() => professoraLogada.nome.split(' ')[0])

/**
 * Aplicações que já saíram do papel (têm PDF gerado, estão em correção ou
 * concluídas). Rascunho ainda não foi aplicado a ninguém, então não conta.
 */
const aplicadas = computed(() =>
  aplicacoes.filter((aplicacao) => aplicacao.status !== 'rascunho'),
)

const totais = computed(() => [
  { valor: turmas.length, rotulo: 'Turmas ativas' },
  { valor: provas.length, rotulo: 'Provas criadas' },
  { valor: aplicadas.value.length, rotulo: 'Aplicações recentes' },
])

/** As três aplicações mais recentes, da mais nova para a mais antiga. */
const ultimasAplicacoes = computed(() =>
  [...aplicadas.value]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 3),
)

/** "Matemática · 1º Ano", como no mockup. */
function nomeDaTurma(turmaId: string): string {
  const turma = buscarTurmaPorId(turmaId)
  if (!turma) return 'Turma removida'
  return `${turma.disciplina} · ${turma.ano}`
}

function nomeDaProva(provaId: string): string {
  return buscarProvaPorId(provaId)?.titulo ?? 'Prova removida'
}

/** Data ISO (AAAA-MM-DD) para o formato curto dd/MM do mockup. */
function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

interface Selo {
  texto: string
  tom: 'ok' | 'atencao'
}

/**
 * Status da aplicação como selo colorido. Só dois tons, ambos vindos dos
 * tokens: verde para o que está fechado, laranja para o que ainda depende
 * de alguma ação do professor.
 */
function selo(aplicacao: Application): Selo {
  switch (aplicacao.status) {
    case 'concluida':
      return { texto: 'Corrigida', tom: 'ok' }
    case 'em-correcao':
      return { texto: 'Aguardando notas', tom: 'atencao' }
    default:
      return { texto: 'Aguardando correção', tom: 'atencao' }
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>Início</template>
    <template #titulo>Olá, {{ primeiroNome }}</template>
    <template #subtitulo>Resumo das suas turmas e provas.</template>

    <section class="cards">
      <article v-for="total in totais" :key="total.rotulo" class="card">
        <span class="card-valor">{{ total.valor }}</span>
        <span class="card-rotulo">{{ total.rotulo }}</span>
      </article>
    </section>

    <section class="secao">
      <header class="secao-cabecalho">
        <h2 class="secao-titulo">Últimas aplicações</h2>
        <RouterLink class="secao-link" to="/aplicacoes">Ver todas</RouterLink>
      </header>

      <table class="tabela">
        <thead>
          <tr>
            <th>Turma</th>
            <th>Prova</th>
            <th>Data</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="aplicacao in ultimasAplicacoes" :key="aplicacao.id">
            <td>{{ nomeDaTurma(aplicacao.turmaId) }}</td>
            <td>{{ nomeDaProva(aplicacao.provaId) }}</td>
            <td>{{ dataCurta(aplicacao.data) }}</td>
            <td>
              <span class="selo" :class="selo(aplicacao).tom">
                {{ selo(aplicacao).texto }}
              </span>
            </td>
          </tr>
          <tr v-if="ultimasAplicacoes.length === 0">
            <td class="vazio" colspan="4">
              Nenhuma prova aplicada ainda.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </AppShell>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.card-valor {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--accent-dark);
  line-height: 1.1;
}

.card-rotulo {
  font-size: var(--text-base);
  color: var(--text-soft);
}

.secao-cabecalho {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.secao-titulo {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.secao-link {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-dark);
}

.secao-link:hover {
  color: var(--accent);
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
