<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmarExclusao from '../components/ConfirmarExclusao.vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import {
  criarAplicacao as criarNaApi,
  dataDeHoje,
  excluirAplicacao,
  listarAplicacoes,
} from '../services/aplicacoes'
import { mensagemDeErro } from '../services/http'
import { listarProvas } from '../services/provas'
import { listarTurmas } from '../services/turmas'
import type { Application, Class, Exam } from '../types'

/**
 * Aplicações (RF05) — fiel ao protótipo docs/telas/09-aplicacoes-lista.png.
 *
 * Criar a aplicação já leva para a configuração do PDF, que é o passo
 * seguinte do fluxo do professor. Excluir pede confirmação na linha; a
 * API recusa (409) quando a aplicação já tem provas corrigidas.
 */

const router = useRouter()
const listaAplicacoes = ref<Application[]>([])
const provas = ref<Exam[]>([])
const turmas = ref<Class[]>([])
const carregando = ref(true)
const erroLista = ref('')

async function carregar() {
  carregando.value = true
  erroLista.value = ''
  try {
    ;[listaAplicacoes.value, provas.value, turmas.value] = await Promise.all([
      listarAplicacoes(),
      listarProvas(),
      listarTurmas(),
    ])
  } catch (erro) {
    erroLista.value = mensagemDeErro(erro, 'Não foi possível carregar as aplicações.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

/** Só provas com questão podem ser aplicadas. */
const provasProntas = computed(() => provas.value.filter((prova) => prova.questoes.length > 0))

const provaId = ref('')
const turmaId = ref('')
const erro = ref('')
const criando = ref(false)

const rotuloStatus: Record<Application['status'], string> = {
  rascunho: 'Rascunho',
  'pdf-gerado': 'PDF gerado',
  'em-correcao': 'Em correção',
  concluida: 'Concluída',
}

function nomeDaProva(id: string): string {
  return provas.value.find((prova) => prova.id === id)?.titulo ?? 'Prova removida'
}

function nomeDaTurma(id: string): string {
  return turmas.value.find((turma) => turma.id === id)?.nome ?? 'Turma removida'
}

/** Com o PDF gerado, as provas impressas já podem ser lidas pela câmera. */
function podeCorrigir(aplicacao: Application): boolean {
  return aplicacao.status === 'pdf-gerado' || aplicacao.status === 'em-correcao'
}

async function criarAplicacao() {
  erro.value = ''

  if (!provaId.value || !turmaId.value) {
    erro.value = 'Escolha a prova e a turma.'
    return
  }

  const turma = turmas.value.find((item) => item.id === turmaId.value)
  criando.value = true
  try {
    const nova = await criarNaApi({
      provaId: provaId.value,
      turmaId: turmaId.value,
      data: dataDeHoje(),
      // Padrão do fluxo: uma versão embaralhada por aluno da turma.
      versoes: Math.min(Math.max(turma?.alunos.length ?? 1, 1), 200),
    })
    router.push(`/aplicacoes/${nova.id}/exportar`)
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível criar a aplicação.')
  } finally {
    criando.value = false
  }
}

/** Aplicação com a confirmação de exclusão aberta. */
const excluindoId = ref<string | null>(null)
const excluindo = ref(false)
const erroExclusao = ref('')

function pedirExclusao(id: string) {
  excluindoId.value = id
  erroExclusao.value = ''
}

async function confirmarExclusao(id: string) {
  excluindo.value = true
  erroExclusao.value = ''
  try {
    await excluirAplicacao(id)
    listaAplicacoes.value = listaAplicacoes.value.filter((aplicacao) => aplicacao.id !== id)
    excluindoId.value = null
  } catch (falha) {
    erroExclusao.value = mensagemDeErro(falha, 'Não foi possível excluir a aplicação.')
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #titulo>Aplicações e PDF</template>
    <template #subtitulo>
      Provas aplicadas às turmas e geração do PDF consolidado.
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando aplicações...</EstadoTela>
    <EstadoTela v-else-if="erroLista" tipo="erro" @tentar="carregar">{{ erroLista }}</EstadoTela>

    <template v-else>
      <section class="formulario">
        <div class="campo">
          <label class="rotulo" for="prova">Prova</label>
          <select id="prova" v-model="provaId">
            <option value="">Selecione a prova</option>
            <option v-for="prova in provasProntas" :key="prova.id" :value="prova.id">
              {{ prova.titulo }}
            </option>
          </select>
        </div>

        <div class="campo">
          <label class="rotulo" for="turma">Turma</label>
          <select id="turma" v-model="turmaId">
            <option value="">Selecione a turma</option>
            <option v-for="turma in turmas" :key="turma.id" :value="turma.id">
              {{ turma.nome }}
            </option>
          </select>
        </div>

        <button class="botao" type="button" :disabled="criando" @click="criarAplicacao">
          {{ criando ? 'Criando...' : 'Configurar PDF →' }}
        </button>
      </section>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <EstadoTela v-if="listaAplicacoes.length === 0" tipo="vazio">
        Nenhuma aplicação criada ainda. Escolha a prova e a turma acima.
      </EstadoTela>

      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Prova</th>
            <th>Turma</th>
            <th>Versões</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="aplicacao in listaAplicacoes" :key="aplicacao.id">
            <tr>
              <td>{{ nomeDaProva(aplicacao.provaId) }}</td>
              <td>{{ nomeDaTurma(aplicacao.turmaId) }}</td>
              <td>{{ aplicacao.versoes }}</td>
              <td>
                <span class="selo" :class="aplicacao.status === 'concluida' ? 'ok' : 'neutro'">
                  {{ rotuloStatus[aplicacao.status] }}
                </span>
              </td>
              <td class="tabela-acao">
                <RouterLink
                  v-if="podeCorrigir(aplicacao)"
                  class="botao-corrigir"
                  :to="`/correcao/${aplicacao.id}/escanear`"
                >
                  Corrigir
                </RouterLink>
                <button class="link-acao" type="button" @click="pedirExclusao(aplicacao.id)">
                  Excluir
                </button>
                <RouterLink :to="`/aplicacoes/${aplicacao.id}/exportar`">
                  Configurar PDF →
                </RouterLink>
              </td>
            </tr>
            <tr v-if="excluindoId === aplicacao.id">
              <td colspan="5">
                <ConfirmarExclusao
                  :alvo="`a aplicação de ${nomeDaProva(aplicacao.provaId)} para ${nomeDaTurma(aplicacao.turmaId)}`"
                  detalhe="As versões geradas para ela também são apagadas."
                  :excluindo="excluindo"
                  :erro="erroExclusao"
                  @confirmar="confirmarExclusao(aplicacao.id)"
                  @cancelar="excluindoId = null"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
  </AppShell>
</template>

<style scoped>
.formulario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  align-items: end;
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
}

select {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

select:focus {
  outline: none;
  border-color: var(--accent);
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

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.erro {
  margin: 0 0 var(--space-4);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
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

.tabela-acao {
  text-align: right;
  white-space: nowrap;
}

.tabela-acao a {
  font-weight: 600;
  color: var(--text);
}

.tabela-acao .botao-corrigir {
  display: inline-block;
  margin-right: var(--space-4);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  color: var(--surface);
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.tabela-acao .botao-corrigir:hover {
  color: var(--surface);
  background: var(--accent-dark);
}

.tabela-acao a:hover {
  color: var(--accent-dark);
}

.link-acao {
  margin-right: var(--space-4);
  padding: 0;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-soft);
  background: none;
  border: none;
  cursor: pointer;
}

.link-acao:hover {
  color: var(--accent-dark);
}

.botao:disabled {
  opacity: 0.7;
  cursor: wait;
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
</style>
