<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { mensagemDeErro } from '../services/http'
import { buscarProva, criarProva, editarProva, LIMITE_QUESTOES } from '../services/provas'
import { listarQuestoes } from '../services/questoes'
import type { Exam, Question } from '../types'

/**
 * Montagem de prova (RF04) — fiel ao protótipo docs/telas/08-prova-montagem.png.
 *
 * Duas colunas: à esquerda o banco de questões com seleção, à direita as
 * selecionadas com a pontuação de cada uma. O limite de 20 questões da
 * RF04 é aplicado no próprio clique, não só na hora de salvar (a API
 * confere de novo). A mesma tela edita uma prova em /provas/:id/editar.
 */

const route = useRoute()
const router = useRouter()
const provaId = computed(() => (route.params.id as string | undefined) ?? null)

const questoes = ref<Question[]>([])
const provaAtual = ref<Exam | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

const titulo = ref('')
/** Ids das questões selecionadas, na ordem em que entraram na prova. */
const selecionadas = ref<string[]>([])
/** Pontuação por questão, indexada pelo id. */
const pontuacoes = ref<Record<string, number>>({})
const erro = ref('')
const salvando = ref(false)

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const [lista, prova] = await Promise.all([
      listarQuestoes(),
      provaId.value ? buscarProva(provaId.value) : Promise.resolve(null),
    ])
    questoes.value = lista
    provaAtual.value = prova
    if (prova) {
      titulo.value = prova.titulo
      const ordenadas = [...prova.questoes].sort((a, b) => a.ordem - b.ordem)
      selecionadas.value = ordenadas.map((item) => item.questaoId)
      pontuacoes.value = Object.fromEntries(ordenadas.map((item) => [item.questaoId, item.pontuacao]))
    }
  } catch (falha) {
    erroCarga.value = mensagemDeErro(falha, 'Não foi possível carregar a prova.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const totalPontos = computed(() =>
  selecionadas.value.reduce((soma, id) => soma + (pontuacoes.value[id] ?? 0), 0),
)

const atingiuLimite = computed(
  () => selecionadas.value.length >= LIMITE_QUESTOES,
)

function estaSelecionada(id: string): boolean {
  return selecionadas.value.includes(id)
}

function alternar(id: string) {
  erro.value = ''

  if (estaSelecionada(id)) {
    selecionadas.value = selecionadas.value.filter((item) => item !== id)
    delete pontuacoes.value[id]
    return
  }

  if (atingiuLimite.value) {
    erro.value = `Uma prova pode ter no máximo ${LIMITE_QUESTOES} questões.`
    return
  }

  selecionadas.value.push(id)
  pontuacoes.value[id] = 1
}

function enunciadoDe(id: string): string {
  // A questão pode ter sido excluída do banco depois de entrar na prova.
  return questoes.value.find((questao) => questao.id === id)?.enunciado ?? '(questão excluída do banco)'
}

/** Corta o enunciado para caber na linha, como no protótipo. */
function resumo(texto: string, limite = 42): string {
  return texto.length > limite ? `${texto.slice(0, limite)}...` : texto
}

async function salvarProva() {
  erro.value = ''

  if (!titulo.value.trim()) {
    erro.value = 'Informe o título da prova.'
    return
  }

  if (selecionadas.value.length === 0) {
    erro.value = 'Selecione ao menos uma questão.'
    return
  }

  if (selecionadas.value.some((id) => !pontuacoes.value[id] || pontuacoes.value[id] <= 0)) {
    erro.value = 'Informe uma pontuação maior que zero em todas as questões selecionadas.'
    return
  }

  const primeira = questoes.value.find((questao) => questao.id === selecionadas.value[0])
  const dados = {
    titulo: titulo.value.trim(),
    disciplina: provaAtual.value?.disciplina ?? primeira?.disciplina ?? 'Geral',
    questoes: selecionadas.value.map((id) => ({ questaoId: id, pontuacao: pontuacoes.value[id] })),
  }

  salvando.value = true
  try {
    if (provaId.value) await editarProva(provaId.value, dados)
    else await criarProva(dados)
    router.push('/provas')
  } catch (falha) {
    // Ex.: 409 ao trocar as questões de uma prova que já tem PDF gerado.
    erro.value = mensagemDeErro(falha, 'Não foi possível salvar a prova.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>Provas / {{ provaId ? 'Editar prova' : 'Nova prova' }}</template>
    <template #titulo>{{ provaId ? 'Editar prova' : 'Montar prova' }}</template>
    <template #acoes>
      <span class="contador">
        {{ selecionadas.length }} de {{ LIMITE_QUESTOES }} questões ·
        {{ totalPontos.toFixed(1).replace('.', ',') }} pontos
      </span>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando questões...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>

    <template v-else>
      <div class="campo-titulo">
        <label class="rotulo" for="titulo">Título da prova</label>
        <input
          id="titulo"
          v-model="titulo"
          type="text"
          placeholder="Ex.: Avaliação Bimestral 2"
        />
      </div>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <div class="colunas">
        <section class="painel">
          <h2 class="painel-titulo">Banco de questões</h2>

          <ul class="lista">
            <li v-for="questao in questoes" :key="questao.id" class="item">
              <button
                type="button"
                class="caixa"
                :class="{ marcada: estaSelecionada(questao.id) }"
                :aria-pressed="estaSelecionada(questao.id)"
                :aria-label="`Selecionar: ${questao.enunciado}`"
                @click="alternar(questao.id)"
              />
              <span class="item-texto">{{ resumo(questao.enunciado) }}</span>
            </li>
            <li v-if="questoes.length === 0" class="vazio">
              Seu banco de questões está vazio. Cadastre questões em "Banco de questões".
            </li>
          </ul>
        </section>

        <section class="painel">
          <h2 class="painel-titulo">Selecionadas (pontuação)</h2>

          <ul class="lista">
            <li v-for="(id, indice) in selecionadas" :key="id" class="item">
              <span class="item-texto">
                {{ indice + 1 }}. {{ resumo(enunciadoDe(id), 34) }}
              </span>
              <input
                v-model.number="pontuacoes[id]"
                class="pontuacao"
                type="number"
                min="0"
                step="0.5"
                :aria-label="`Pontuação da questão ${indice + 1}`"
              />
            </li>
            <li v-if="selecionadas.length === 0" class="vazio">
              Nenhuma questão selecionada ainda.
            </li>
          </ul>
        </section>
      </div>

      <div class="rodape">
        <button class="botao" type="button" :disabled="salvando" @click="salvarProva">
          {{ salvando ? 'Salvando...' : 'Salvar prova' }}
        </button>
        <button class="botao-secundario" type="button" @click="router.push('/provas')">
          Cancelar
        </button>
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.contador {
  font-size: var(--text-base);
  color: var(--text-soft);
  white-space: nowrap;
}

.campo-titulo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-width: 420px;
  margin-bottom: var(--space-4);
}

.rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
}

input[type='text'] {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.erro {
  margin: 0 0 var(--space-4);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.colunas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
}

.painel {
  min-height: 320px;
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.painel-titulo {
  margin: 0 0 var(--space-4);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.item-texto {
  flex: 1;
  font-size: var(--text-base);
  color: var(--text);
}

.caixa {
  width: 20px;
  height: 20px;
  flex: none;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.caixa.marcada {
  background: var(--accent);
  border-color: var(--accent);
}

.pontuacao {
  width: 64px;
  padding: var(--space-1) var(--space-2);
  text-align: center;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.vazio {
  padding: var(--space-3) 0;
  font-size: var(--text-base);
  color: var(--text-soft);
}

.rodape {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.botao {
  padding: var(--space-2) var(--space-4);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.botao:disabled {
  opacity: 0.7;
  cursor: wait;
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.botao-secundario {
  padding: var(--space-2) var(--space-4);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.botao-secundario:hover {
  color: var(--text);
  background: var(--bg);
}
</style>
