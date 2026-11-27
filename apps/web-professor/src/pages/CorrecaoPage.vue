<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { listarAplicacoes } from '../services/aplicacoes'
import { descartar, enviarPendentes, fila } from '../services/filaOffline'
import { mensagemDeErro } from '../services/http'
import { listarProvas } from '../services/provas'
import { listarTurmas } from '../services/turmas'
import type { Application, Class, Exam } from '../types'

/**
 * Correção de provas (RF08) — ponto de entrada do fluxo de correção.
 *
 * Lista as aplicações que já têm PDF gerado e ainda não terminaram de ser
 * corrigidas. A tela é pensada para o celular: o professor abre o SGP no
 * navegador do próprio aparelho e usa a câmera para ler as provas (ADR-001).
 * Visual baseado no protótipo docs/telas/14-mobile-home-sync.png.
 */

const listaAplicacoes = ref<Application[]>([])
const provas = ref<Exam[]>([])
const turmas = ref<Class[]>([])
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    ;[listaAplicacoes.value, provas.value, turmas.value] = await Promise.all([
      listarAplicacoes(),
      listarProvas(),
      listarTurmas(),
    ])
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível carregar as aplicações.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
// Correções guardadas sem internet saem daqui também, não só no evento "online".
onMounted(enviarPendentes)

const pendentes = computed(() => fila.value.filter((item) => !item.erro))
const conflitos = computed(() => fila.value.filter((item) => item.erro))

const paraCorrigir = computed(() =>
  listaAplicacoes.value.filter(
    (aplicacao) =>
      aplicacao.status === 'pdf-gerado' || aplicacao.status === 'em-correcao',
  ),
)

function nomeDaProva(id: string): string {
  return provas.value.find((prova) => prova.id === id)?.titulo ?? 'Prova removida'
}

function nomeDaTurma(id: string): string {
  return turmas.value.find((turma) => turma.id === id)?.nome ?? 'Turma removida'
}

function percentual(corrigidas: number, total: number): number {
  if (total === 0) return 0
  return Math.round((corrigidas / total) * 100)
}
</script>

<template>
  <AppShell>
    <template #titulo>Correção de provas</template>
    <template #subtitulo>
      Escolha a aplicação e leia as provas com a câmera do celular.
    </template>

    <p v-if="pendentes.length" class="fila" role="status">
      {{ pendentes.length }}
      {{ pendentes.length === 1 ? 'correção guardada' : 'correções guardadas' }} sem internet.
      O envio é automático quando a conexão voltar.
      <button class="link" type="button" @click="enviarPendentes">Enviar agora</button>
    </p>
    <p v-for="item in conflitos" :key="item.dados.clientCorrectionId" class="fila conflito" role="alert">
      Correção guardada sem internet não foi aceita: {{ item.erro }}
      <button class="link" type="button" @click="descartar(item.dados.clientCorrectionId)">
        Descartar
      </button>
    </p>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando aplicações...</EstadoTela>
    <EstadoTela v-else-if="erro" tipo="erro" @tentar="carregar">{{ erro }}</EstadoTela>

    <ul v-else-if="paraCorrigir.length" class="lista">
      <li v-for="aplicacao in paraCorrigir" :key="aplicacao.id" class="cartao">
        <div class="cartao-topo">
          <div class="cartao-texto">
            <p class="turma">{{ nomeDaTurma(aplicacao.turmaId) }}</p>
            <p class="prova">{{ nomeDaProva(aplicacao.provaId) }}</p>
          </div>
          <span class="selo" :class="aplicacao.identificarAluno ? 'ok' : 'neutro'">
            {{ aplicacao.identificarAluno ? 'Identificada' : 'Sem identificação' }}
          </span>
        </div>

        <div class="progresso">
          <div
            class="barra"
            role="progressbar"
            :aria-valuenow="aplicacao.corrigidas"
            aria-valuemin="0"
            :aria-valuemax="aplicacao.totalProvas"
          >
            <span
              class="barra-preenchida"
              :style="{ width: `${percentual(aplicacao.corrigidas, aplicacao.totalProvas)}%` }"
            />
          </div>
          <p class="progresso-texto">
            {{ aplicacao.corrigidas }} de {{ aplicacao.totalProvas }} corrigidas
          </p>
        </div>

        <div class="cartao-acoes">
          <RouterLink class="botao" :to="`/correcao/${aplicacao.id}/escanear`">
            Corrigir provas
          </RouterLink>
          <RouterLink class="link" :to="`/relatorios/${aplicacao.id}`">
            Ver notas
          </RouterLink>
        </div>
      </li>
    </ul>

    <p v-else class="vazio">
      Nenhuma aplicação aguardando correção. Gere o PDF de uma aplicação em
      "Aplicações e PDF" para começar.
    </p>

    <p class="nota">
      Abra esta tela no celular: a câmera do navegador lê o QR Code e o
      cartão-resposta de cada prova. Em provas sem identificação, a nota é
      lançada depois em "Ver notas", pelo nome e matrícula escritos na folha.
    </p>
  </AppShell>
</template>

<style scoped>
.lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cartao {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.cartao-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.cartao-texto {
  min-width: 0;
}

.turma {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text);
}

.prova {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.selo {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
}

.selo.ok {
  color: var(--accent-dark);
  background: var(--accent-soft);
}

.selo.neutro {
  color: var(--warn);
  background: var(--warn-soft);
}

.progresso {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.barra {
  height: 8px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.barra-preenchida {
  display: block;
  height: 100%;
  background: var(--accent);
}

.progresso-texto {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.cartao-acoes {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.botao {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: center;
  color: var(--surface);
  background: var(--accent);
  border-radius: var(--radius-md);
}

.botao:hover {
  background: var(--accent-dark);
}

.link {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.link:hover {
  color: var(--accent-dark);
}

.vazio {
  padding: var(--space-5);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.fila {
  margin: 0 0 var(--space-4);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--accent-dark);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}

.fila.conflito {
  color: var(--warn);
  background: var(--warn-soft);
}

.fila .link {
  padding: 0;
  margin-left: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
}

.nota {
  max-width: 640px;
  margin: var(--space-5) 0 0;
  font-size: var(--text-sm);
  color: var(--text-faint);
}

@media (max-width: 767px) {
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
