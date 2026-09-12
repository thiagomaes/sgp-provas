<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import type { Question } from '../mocks/types'
import { questoesState } from '../state/questoes'

const router = useRouter()
const route = useRoute()

const tipo = ref<'objetiva' | 'discursiva'>('objetiva')
const enunciado = ref('')
const disciplina = ref('Matemática')
const tagsTexto = ref('')
const pontuacaoMaxima = ref(10)
const erro = ref('')
const alternativas = ref<Array<{ texto: string; correta: boolean }>>([])

const editingId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : null
})

const isEditMode = computed(() => Boolean(editingId.value))

const letras = ['A', 'B', 'C', 'D', 'E'] as const

const criarAlternativasPadrao = () => [
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
]

const resetFormulario = (questao?: Question) => {
  if (questao) {
    tipo.value = questao.tipo
    enunciado.value = questao.enunciado
    disciplina.value = questao.disciplina || 'Matemática'
    tagsTexto.value = questao.tags.join(', ')
    pontuacaoMaxima.value = questao.pontuacaoMaxima ?? 10
    alternativas.value = (questao.alternativas ?? []).map((alternativa) => ({
      texto: alternativa.texto,
      correta: alternativa.correta,
    }))

    if (alternativas.value.length === 0) {
      alternativas.value = criarAlternativasPadrao()
    }

    return
  }

  tipo.value = 'objetiva'
  enunciado.value = ''
  disciplina.value = 'Matemática'
  tagsTexto.value = ''
  pontuacaoMaxima.value = 10
  alternativas.value = criarAlternativasPadrao()
}

watch(
  editingId,
  (id) => {
    erro.value = ''
    if (!id) {
      resetFormulario()
      return
    }

    const questao = questoesState.find((item) => item.id === id)
    resetFormulario(questao)
  },
  { immediate: true },
)

const atualizarCorreta = (index: number) => {
  alternativas.value = alternativas.value.map((alternativa, itemIndex) => ({
    ...alternativa,
    correta: itemIndex === index,
  }))
}

const adicionarAlternativa = () => {
  if (alternativas.value.length >= 5) return
  alternativas.value.push({ texto: '', correta: false })
}

const removerAlternativa = (index: number) => {
  if (alternativas.value.length <= 2) return
  const novas = [...alternativas.value]
  novas.splice(index, 1)

  if (novas.length > 0 && !novas.some((alternativa) => alternativa.correta)) {
    novas[0].correta = true
  }

  alternativas.value = novas
}

const parseTags = (valor: string) => {
  return [...new Set(valor.split(',').map((tag) => tag.trim()).filter(Boolean))]
}

const salvarQuestao = () => {
  erro.value = ''

  const enunciadoFormatado = enunciado.value.trim()
  if (!enunciadoFormatado) {
    erro.value = 'Informe o enunciado da questão.'
    return
  }

  if (tipo.value === 'objetiva') {
    if (alternativas.value.length < 2 || alternativas.value.length > 5) {
      erro.value = 'A questão objetiva deve ter entre 2 e 5 alternativas.'
      return
    }

    const temVazia = alternativas.value.some((a) => a.texto.trim().length === 0)
    if (temVazia) {
      erro.value = 'Preencha o texto de todas as alternativas.'
      return
    }

    const alternativasPreenchidas = alternativas.value.filter(
      (alternativa) => alternativa.texto.trim().length > 0,
    )

    if (alternativasPreenchidas.length < 2 || alternativasPreenchidas.length > 5) {
      erro.value = 'Preencha todas as alternativas com texto válido.'
      return
    }

    const corretas = alternativas.value.filter((alternativa) => alternativa.correta).length
    if (corretas !== 1) {
      erro.value = 'Marque exatamente uma alternativa como correta.'
      return
    }
  }

  const dadosQuestao = {
    id: editingId.value ?? `questao-${Date.now()}`,
    enunciado: enunciadoFormatado,
    tipo: tipo.value,
    disciplina: disciplina.value,
    tags: parseTags(tagsTexto.value),
    criadaEm: new Date().toISOString().slice(0, 10),
    ...(tipo.value === 'objetiva'
      ? {
          alternativas: alternativas.value.map((alternativa, index) => ({
            letra: letras[index] ?? 'A',
            texto: alternativa.texto.trim(),
            correta: alternativa.correta,
          })),
        }
      : {
          respostaEsperada: '',
          pontuacaoMaxima: Number(pontuacaoMaxima.value) || 10,
        }),
  }

  if (editingId.value) {
    const index = questoesState.findIndex((item) => item.id === editingId.value)
    if (index >= 0) {
      questoesState[index] = dadosQuestao
    }
  } else {
    questoesState.push(dadosQuestao)
  }

  router.push('/questoes')
}

const cancelar = () => {
  router.push('/questoes')
}
</script>

<template>
  <AppShell>
    <template #titulo>{{ isEditMode ? 'Editar questão' : 'Nova questão' }}</template>
    <template #subtitulo>
      {{ isEditMode ? 'Atualize os dados desta questão' : 'Cadastre uma questão objetiva ou discursiva' }}
    </template>

    <section class="pagina-nova-questao">
      <div class="area-formulario">
      <div class="campo-grupo">
        <label class="label" for="disciplina">Disciplina</label>
        <input
          id="disciplina"
          v-model="disciplina"
          type="text"
          class="input"
          placeholder="Ex.: Matemática, História, Física"
        />
      </div>
        <div class="campo-grupo tipo-grupo">
          <label class="label">Tipo</label>

          <div class="seletor-tipo" role="radiogroup" aria-label="Tipo da questão">
            <button
              type="button"
              class="tipo-btn"
              :class="{ ativo: tipo === 'objetiva' }"
              @click="tipo = 'objetiva'"
            >
              Objetiva
            </button>
            <button
              type="button"
              class="tipo-btn"
              :class="{ ativo: tipo === 'discursiva' }"
              @click="tipo = 'discursiva'"
            >
              Discursiva
            </button>
          </div>
        </div>

        <div class="campo-grupo">
          <label class="label" for="enunciado">Enunciado</label>
          <textarea id="enunciado" v-model="enunciado" rows="4" class="input-texto" />
        </div>

        <div v-if="tipo === 'objetiva'" class="campo-grupo">
          <label class="label">Alternativas</label>

          <div class="alternativas">
            <div
              v-for="(alternativa, index) in alternativas"
              :key="`${index}-${alternativa.texto}`"
              class="alternativa-item"
              :class="{ correta: alternativa.correta }"
            >
              <label class="alternativa-resposta">
                <input
                  type="radio"
                  name="alternativa-correta"
                  :checked="alternativa.correta"
                  @change="atualizarCorreta(index)"
                />
                <span class="radio-visual" aria-hidden="true"></span>
              </label>

              <input
                v-model="alternativa.texto"
                type="text"
                class="input-alternativa"
                :placeholder="`Alternativa ${String.fromCharCode(65 + index)}`"
              />

              <button type="button" class="botao-remover" @click="removerAlternativa(index)">
                Remover
              </button>
            </div>
          </div>

          <button type="button" class="botao-adicionar" @click="adicionarAlternativa">
            + Adicionar alternativa
          </button>
        </div>

        <div v-else class="campo-grupo">
          <label class="label" for="pontuacaoMaxima">Pontuação máxima</label>
          <input
            id="pontuacaoMaxima"
            v-model.number="pontuacaoMaxima"
            type="number"
            min="1"
            class="input-texto"
          />
        </div>
      </div>

      <aside class="area-meta">
        <div class="meta-box">
          <label class="label" for="tags">Tags</label>
          <input id="tags" v-model="tagsTexto" type="text" class="input-texto" placeholder="Ex.: equações, álgebra" />
        </div>
      </aside>

      <div v-if="erro" class="mensagem-erro">{{ erro }}</div>

      <div class="acoes">
        <button type="button" class="botao-primario" @click="salvarQuestao">
          {{ isEditMode ? 'Salvar alterações' : 'Salvar questão' }}
        </button>
        <button type="button" class="botao-secundario" @click="cancelar">Cancelar</button>
      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.pagina-nova-questao {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(220px, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.area-formulario,
.area-meta {
  background: transparent;
}

.area-formulario {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.area-meta {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.campo-grupo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-base);
  color: var(--text);
  font-weight: 600;
}

.seletor-tipo {
  display: inline-flex;
  width: fit-content;
  gap: var(--space-2);
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
}

.tipo-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}

.tipo-btn.ativo {
  background: var(--accent-soft);
  border-color: var(--border-strong);
  color: var(--accent-dark);
  font-weight: 600;
}

.input-texto,
.input-alternativa {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  min-height: 40px;
  padding: 0 var(--space-3);
}

textarea.input-texto {
  min-height: 100px;
  resize: vertical;
  padding: var(--space-3);
}

.input-texto:focus,
.input-alternativa:focus {
  outline: 2px solid var(--accent-soft);
  border-color: var(--accent);
}

.meta-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.alternativas {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.alternativa-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.alternativa-item.correta {
  background: var(--accent-soft);
  border-color: var(--border-strong);
}

.alternativa-resposta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.alternativa-resposta input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-visual {
  width: 16px;
  height: 16px;
  display: inline-block;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  position: relative;
}

.alternativa-resposta input:checked + .radio-visual {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: inset 0 0 0 4px var(--surface);
}

.botao-remover,
.botao-adicionar,
.botao-primario,
.botao-secundario {
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
}

.botao-remover {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-soft);
  padding: var(--space-2) var(--space-3);
}

.botao-adicionar {
  border: 1px dashed var(--border-strong);
  background: transparent;
  color: var(--accent-dark);
  padding: var(--space-2) var(--space-3);
  align-self: flex-start;
}

.acoes {
  grid-column: 1 / -1;
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.botao-primario,
.botao-secundario {
  min-height: 42px;
  padding: 0 var(--space-4);
}

.botao-primario {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: var(--surface);
}

.botao-secundario {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.mensagem-erro {
  grid-column: 1 / -1;
  border: 1px solid var(--border);
  border-left: 4px solid var(--warn);
  background: var(--warn-soft);
  color: var(--warn);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
}

@media (max-width: 900px) {
  .pagina-nova-questao {
    grid-template-columns: 1fr;
  }

  .area-meta {
    order: 2;
  }
}
</style>
