<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { mensagemDeErro } from '../services/http'
import { buscarResumo } from '../services/relatorios'
import { useAuthStore } from '../stores/auth'
import type { Application, DashboardSummary } from '../types'

/**
 * Dashboard do professor — fiel ao mockup docs/telas/02-dashboard.png.
 *
 * Os números e as últimas aplicações vêm de GET /reports/summary, nunca
 * fixos no template: a API conta só o que é do professor logado.
 */

const auth = useAuthStore()
const resumo = ref<DashboardSummary | null>(null)
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    resumo.value = await buscarResumo()
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível carregar o resumo.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

/** Primeiro nome, como no mockup ("Olá, Ana"). */
const primeiroNome = computed(() => auth.professor?.nome.split(' ')[0] ?? '')

const totais = computed(() => {
  if (!resumo.value) return []
  const { turmas, provas, aplicacoesRecentes } = resumo.value.totais
  return [
    { valor: turmas, rotulo: 'Turmas ativas' },
    { valor: provas, rotulo: 'Provas criadas' },
    { valor: aplicacoesRecentes, rotulo: 'Aplicações recentes' },
  ]
})

/** As três aplicações mais recentes, já ordenadas pela API. */
const ultimasAplicacoes = computed(() => resumo.value?.ultimasAplicacoes ?? [])

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
    <template #titulo>{{ primeiroNome ? `Olá, ${primeiroNome}` : 'Olá' }}</template>
    <template #subtitulo>Resumo das suas turmas e provas.</template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando resumo...</EstadoTela>
    <EstadoTela v-else-if="erro" tipo="erro" @tentar="carregar">{{ erro }}</EstadoTela>

    <template v-else>
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
              <td>{{ aplicacao.turma.disciplina }} · {{ aplicacao.turma.ano }}</td>
              <td>{{ aplicacao.prova.titulo }}</td>
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
    </template>
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
