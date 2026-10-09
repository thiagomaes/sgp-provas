<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../layouts/AppShell.vue'
import { aplicacoes } from '../mocks/aplicacoes'
import { buscarProvaPorId } from '../mocks/provas'
import { buscarTurmaPorId } from '../mocks/turmas'

/**
 * Correção de provas (RF08) — ponto de entrada do fluxo de correção.
 *
 * Lista as aplicações que já têm PDF gerado e ainda não terminaram de ser
 * corrigidas. A tela é pensada para o celular: o professor abre o SGP no
 * navegador do próprio aparelho e usa a câmera para ler as provas (ADR-001).
 * Visual baseado no mockup docs/telas/14-mobile-home-sync.png.
 */

const listaAplicacoes = ref(aplicacoes)

const paraCorrigir = computed(() =>
  listaAplicacoes.value.filter(
    (aplicacao) =>
      aplicacao.status === 'pdf-gerado' || aplicacao.status === 'em-correcao',
  ),
)

function nomeDaProva(id: string): string {
  return buscarProvaPorId(id)?.titulo ?? 'Prova removida'
}

function nomeDaTurma(id: string): string {
  return buscarTurmaPorId(id)?.nome ?? 'Turma removida'
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

    <ul v-if="paraCorrigir.length" class="lista">
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
