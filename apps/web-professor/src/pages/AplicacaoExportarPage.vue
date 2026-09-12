<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacaoPorId } from '../mocks/aplicacoes'
import { buscarProvaPorId } from '../mocks/provas'
import { buscarTurmaPorId } from '../mocks/turmas'

/**
 * Configuração do PDF da aplicação (RF06, RF07) — fiel ao mockup
 * docs/telas/10-aplicacao-exportar-pdf.png.
 *
 * Na N1 o botão "Gerar PDF" só confirma na tela: a geração do arquivo e o
 * QR Code são escopo da N2/N3. O que já vale é salvar a configuração
 * escolhida na aplicação.
 */

const route = useRoute()
const router = useRouter()

const aplicacao = buscarAplicacaoPorId(route.params.id as string)

const versoes = ref(aplicacao?.versoes ?? 1)
const embaralharQuestoes = ref(aplicacao?.embaralharQuestoes ?? true)
const embaralharAlternativas = ref(aplicacao?.embaralharAlternativas ?? true)
const identificarAluno = ref(aplicacao?.identificarAluno ?? true)
const mensagem = ref('')

const prova = computed(() =>
  aplicacao ? buscarProvaPorId(aplicacao.provaId) : undefined,
)
const turma = computed(() =>
  aplicacao ? buscarTurmaPorId(aplicacao.turmaId) : undefined,
)

/** Quantidade máxima de versões: uma por aluno da turma. */
const maximoVersoes = computed(() => turma.value?.alunos.length ?? 1)

function alterarVersoes(delta: number) {
  const novo = versoes.value + delta
  if (novo < 1 || novo > maximoVersoes.value) return
  versoes.value = novo
  mensagem.value = ''
}

function gerarPdf() {
  if (!aplicacao) return

  // Guarda a configuração escolhida; o arquivo em si é escopo da N2.
  aplicacao.versoes = versoes.value
  aplicacao.embaralharQuestoes = embaralharQuestoes.value
  aplicacao.embaralharAlternativas = embaralharAlternativas.value
  aplicacao.identificarAluno = identificarAluno.value
  if (aplicacao.status === 'rascunho') aplicacao.status = 'pdf-gerado'

  mensagem.value = `PDF gerado com ${versoes.value} ${
    versoes.value === 1 ? 'versão' : 'versões'
  }. A geração do arquivo entra na N2.`
}
</script>

<template>
  <AppShell>
    <template #caminho>
      Aplicações /
      {{ prova?.titulo ?? 'Aplicação' }} → {{ turma?.nome ?? '' }}
    </template>
    <template #titulo>Configurar geração do PDF</template>

    <p v-if="!aplicacao" class="vazio">
      Nenhuma aplicação encontrada com este id.
    </p>

    <template v-else>
      <section class="painel">
        <div class="linha">
          <div class="linha-texto">
            <span class="linha-titulo">Quantidade de versões</span>
            <span class="linha-desc">Uma versão embaralhada por aluno da turma</span>
          </div>
          <div class="stepper">
            <button type="button" aria-label="Menos uma versão" @click="alterarVersoes(-1)">
              −
            </button>
            <span class="stepper-valor">{{ versoes }}</span>
            <button type="button" aria-label="Mais uma versão" @click="alterarVersoes(1)">
              +
            </button>
          </div>
        </div>

        <div class="linha">
          <div class="linha-texto">
            <span class="linha-titulo">Embaralhar questões</span>
            <span class="linha-desc">Ordem das questões muda entre as versões</span>
          </div>
          <button
            type="button"
            class="chave"
            :class="{ ligada: embaralharQuestoes }"
            role="switch"
            :aria-checked="embaralharQuestoes"
            aria-label="Embaralhar questões"
            @click="embaralharQuestoes = !embaralharQuestoes"
          >
            <span class="bolinha" />
          </button>
        </div>

        <div class="linha">
          <div class="linha-texto">
            <span class="linha-titulo">Embaralhar alternativas</span>
            <span class="linha-desc">Ordem das alternativas muda entre as versões</span>
          </div>
          <button
            type="button"
            class="chave"
            :class="{ ligada: embaralharAlternativas }"
            role="switch"
            :aria-checked="embaralharAlternativas"
            aria-label="Embaralhar alternativas"
            @click="embaralharAlternativas = !embaralharAlternativas"
          >
            <span class="bolinha" />
          </button>
        </div>

        <div class="linha">
          <div class="linha-texto">
            <span class="linha-titulo">Identificar aluno na prova</span>
            <span class="linha-desc">Gera QR Code vinculado a cada aluno da turma</span>
          </div>
          <button
            type="button"
            class="chave"
            :class="{ ligada: identificarAluno }"
            role="switch"
            :aria-checked="identificarAluno"
            aria-label="Identificar aluno na prova"
            @click="identificarAluno = !identificarAluno"
          >
            <span class="bolinha" />
          </button>
        </div>
      </section>

      <p v-if="mensagem" class="sucesso">{{ mensagem }}</p>

      <div class="rodape">
        <button class="botao" type="button" @click="gerarPdf">Gerar PDF</button>
        <button
          class="botao-secundario"
          type="button"
          @click="router.push('/aplicacoes')"
        >
          Cancelar
        </button>
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.painel {
  max-width: 720px;
  padding: 0 var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
}

.linha:last-child {
  border-bottom: none;
}

.linha-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.linha-titulo {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--text);
}

.linha-desc {
  font-size: var(--text-base);
  color: var(--text-soft);
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.stepper button {
  padding: 0 var(--space-1);
  color: var(--text);
  background: none;
  border: none;
  font-size: var(--text-lg);
  cursor: pointer;
}

.stepper-valor {
  min-width: 28px;
  text-align: center;
  font-weight: 700;
}

.chave {
  position: relative;
  width: 52px;
  height: 28px;
  flex: none;
  padding: 0;
  background: var(--border-strong);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chave.ligada {
  background: var(--accent);
}

.bolinha {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: var(--surface);
  border-radius: 50%;
  transition: transform 0.15s ease;
}

.chave.ligada .bolinha {
  transform: translateX(24px);
}

.sucesso {
  max-width: 720px;
  margin: var(--space-4) 0 0;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--accent-dark);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}

.rodape {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
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

.botao-secundario {
  padding: var(--space-3) var(--space-5);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 700;
  cursor: pointer;
}

.botao-secundario:hover {
  background: var(--bg);
}

.vazio {
  color: var(--text-soft);
}
</style>
