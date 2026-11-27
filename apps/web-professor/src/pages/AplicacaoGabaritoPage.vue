<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { buscarGabarito } from '../services/aplicacoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import type { AnswerKey } from '../types'

/**
 * Gabarito da aplicação (RF11): a resposta certa de cada questão em cada
 * versão, já na ordem e nas letras impressas. A tela é feita para imprimir:
 * cada versão ocupa uma página e o menu some no papel.
 */

const route = useRoute()
const aplicacaoId = route.params.id as string

const gabarito = ref<AnswerKey | null>(null)
const carregando = ref(true)
const erro = ref('')
const versaoEscolhida = ref<number | 'todas'>('todas')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    gabarito.value = await buscarGabarito(aplicacaoId)
  } catch (falha) {
    erro.value =
      falha instanceof ErroApi && falha.status === 409
        ? 'Gere as versões da aplicação antes de ver o gabarito.'
        : mensagemDeErro(falha, 'Não foi possível carregar o gabarito.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const versoesVisiveis = computed(() => {
  const versoes = gabarito.value?.versoes ?? []
  return versaoEscolhida.value === 'todas'
    ? versoes
    : versoes.filter((versao) => versao.numeroVersao === versaoEscolhida.value)
})

function dataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function imprimir() {
  window.print()
}
</script>

<template>
  <AppShell>
    <template #caminho>Aplicações / {{ gabarito?.tituloDaProva ?? 'Aplicação' }}</template>
    <template #titulo>Gabarito</template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando gabarito...</EstadoTela>
    <EstadoTela v-else-if="erro" tipo="erro" @tentar="carregar">
      {{ erro }}
      <RouterLink :to="`/aplicacoes/${aplicacaoId}/exportar`">Configurar PDF</RouterLink>
    </EstadoTela>

    <template v-else-if="gabarito">
      <div class="barra">
        <label class="filtro">
          Versão
          <select v-model="versaoEscolhida">
            <option value="todas">Todas ({{ gabarito.versoes.length }})</option>
            <option v-for="versao in gabarito.versoes" :key="versao.numeroVersao" :value="versao.numeroVersao">
              Versão {{ versao.numeroVersao }}
              <template v-if="versao.aluno"> · {{ versao.aluno.nome }}</template>
            </option>
          </select>
        </label>
        <button class="botao" type="button" @click="imprimir">Imprimir gabarito</button>
      </div>

      <section v-for="versao in versoesVisiveis" :key="versao.numeroVersao" class="versao">
        <header class="versao-cabecalho">
          <h2 class="versao-titulo">{{ gabarito.tituloDaProva }}: gabarito da versão {{ versao.numeroVersao }}</h2>
          <p class="versao-info">
            Turma {{ gabarito.nomeDaTurma }} · {{ dataPorExtenso(gabarito.data) }}
            <template v-if="versao.aluno"> · {{ versao.aluno.nome }} ({{ versao.aluno.matricula }})</template>
          </p>
        </header>

        <table class="tabela">
          <thead>
            <tr>
              <th scope="col">Questão</th>
              <th scope="col">Resposta certa</th>
              <th scope="col">Pontos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in versao.questoes" :key="item.ordem">
              <td>{{ item.ordem }}</td>
              <td v-if="item.tipo === 'objetiva'" class="letra">{{ item.letraCorreta }}</td>
              <td v-else class="discursiva">
                <strong>Discursiva.</strong>
                {{ item.respostaEsperada || 'Sem resposta esperada cadastrada.' }}
              </td>
              <td>{{ item.pontuacao }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </AppShell>
</template>

<style scoped>
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.filtro {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text);
}

.filtro select {
  min-width: 240px;
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.botao {
  padding: var(--space-3) var(--space-5);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 700;
  cursor: pointer;
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.versao {
  max-width: 720px;
  margin-bottom: var(--space-6);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  break-inside: avoid;
}

.versao-titulo {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--text);
}

.versao-info {
  margin: var(--space-1) 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}

.tabela th,
.tabela td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.tabela th {
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.letra {
  font-size: var(--text-lg);
  font-weight: 700;
}

.discursiva {
  white-space: normal !important;
  color: var(--text);
}

@media print {
  .barra {
    display: none;
  }

  .versao {
    max-width: none;
    margin: 0;
    padding: 0;
    border: none;
    break-after: page;
  }

  .versao:last-of-type {
    break-after: auto;
  }
}
</style>
