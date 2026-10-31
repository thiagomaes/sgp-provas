<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { buscarAplicacao, gerarVersoes } from '../services/aplicacoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import { buscarProva } from '../services/provas'
import { buscarTurma } from '../services/turmas'
import type { Application, ApplicationVersion, Class, Exam } from '../types'

/**
 * Configuração do PDF da aplicação (RF06, RF07) — fiel ao mockup
 * docs/telas/10-aplicacao-exportar-pdf.png.
 *
 * "Gerar PDF" chama POST /applications/:id/generate: a API sorteia as
 * versões embaralhadas, cria o QR Code de cada uma e marca a aplicação
 * como "PDF gerado". O arquivo PDF em si ainda não é montado pela API.
 */

const route = useRoute()
const router = useRouter()
const aplicacaoId = route.params.id as string

const aplicacao = ref<Application | null>(null)
const prova = ref<Exam | null>(null)
const turma = ref<Class | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

const versoes = ref(1)
const embaralharQuestoes = ref(true)
const embaralharAlternativas = ref(true)
const identificarAluno = ref(true)

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const encontrada = await buscarAplicacao(aplicacaoId)
    aplicacao.value = encontrada
    versoes.value = encontrada.versoes
    embaralharQuestoes.value = encontrada.embaralharQuestoes
    embaralharAlternativas.value = encontrada.embaralharAlternativas
    identificarAluno.value = encontrada.identificarAluno

    // A prova pode ter sido excluída depois (soft-delete): a tela segue sem o título.
    const [provaEncontrada, turmaEncontrada] = await Promise.all([
      buscarProva(encontrada.provaId).catch(() => null),
      buscarTurma(encontrada.turmaId),
    ])
    prova.value = provaEncontrada
    turma.value = turmaEncontrada
  } catch (erro) {
    erroCarga.value =
      erro instanceof ErroApi && erro.status === 404
        ? ''
        : mensagemDeErro(erro, 'Não foi possível carregar a aplicação.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

/** Quantidade máxima de versões: uma por aluno da turma (a API aceita até 200). */
const maximoVersoes = computed(() => Math.min(Math.max(turma.value?.alunos.length ?? 1, 1), 200))

const gerando = ref(false)
const mensagem = ref('')
const erro = ref('')
const geradas = ref<ApplicationVersion[]>([])

function alterarVersoes(delta: number) {
  const novo = versoes.value + delta
  if (novo < 1 || novo > maximoVersoes.value) return
  versoes.value = novo
  mensagem.value = ''
}

async function gerarPdf() {
  if (!aplicacao.value) return

  gerando.value = true
  mensagem.value = ''
  erro.value = ''
  try {
    const resultado = await gerarVersoes(aplicacaoId, {
      versoes: versoes.value,
      embaralharQuestoes: embaralharQuestoes.value,
      embaralharAlternativas: embaralharAlternativas.value,
      identificarAluno: identificarAluno.value,
    })
    aplicacao.value = resultado.aplicacao
    geradas.value = resultado.versoes
    mensagem.value = `${resultado.versoes.length} ${
      resultado.versoes.length === 1 ? 'versão gerada' : 'versões geradas'
    }, cada uma com o seu QR Code. A aplicação já pode ser corrigida.`
  } catch (falha) {
    // 409: a correção já começou e as versões não podem mudar.
    erro.value = mensagemDeErro(falha, 'Não foi possível gerar as versões.')
  } finally {
    gerando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>
      Aplicações /
      {{ prova?.titulo ?? 'Aplicação' }} → {{ turma?.nome ?? '' }}
    </template>
    <template #titulo>Configurar geração do PDF</template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando aplicação...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>
    <EstadoTela v-else-if="!aplicacao" tipo="vazio">
      Nenhuma aplicação encontrada com este id.
      <RouterLink to="/aplicacoes">Voltar para as aplicações</RouterLink>
    </EstadoTela>

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

      <p v-if="mensagem" class="sucesso" role="status">{{ mensagem }}</p>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <ul v-if="geradas.length" class="versoes">
        <li v-for="versao in geradas" :key="versao.numeroVersao" class="versao">
          <span class="versao-numero">Versão {{ versao.numeroVersao }}</span>
          <code class="versao-qr">{{ versao.qrCodePayload }}</code>
        </li>
      </ul>

      <div class="rodape">
        <button class="botao" type="button" :disabled="gerando" @click="gerarPdf">
          {{ gerando ? 'Gerando...' : 'Gerar PDF' }}
        </button>
        <button
          class="botao-secundario"
          type="button"
          @click="router.push('/aplicacoes')"
        >
          {{ geradas.length ? 'Voltar' : 'Cancelar' }}
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

.erro {
  max-width: 720px;
  margin: var(--space-4) 0 0;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.versoes {
  display: grid;
  max-width: 720px;
  max-height: 260px;
  margin: var(--space-4) 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.versao {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--border);
}

.versao:last-child {
  border-bottom: none;
}

.versao-numero {
  font-weight: 600;
  color: var(--text);
}

.versao-qr {
  font-size: var(--text-xs);
  color: var(--text-soft);
  word-break: break-all;
}

.botao:disabled {
  opacity: 0.7;
  cursor: wait;
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
