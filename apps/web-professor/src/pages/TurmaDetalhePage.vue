<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ConfirmarExclusao from '../components/ConfirmarExclusao.vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { ErroApi, mensagemDeErro } from '../services/http'
import { adicionarAluno, buscarTurma, editarAluno, removerAluno } from '../services/turmas'
import type { Class, Student } from '../types'

/**
 * Detalhe da turma (RF03) — fiel ao mockup docs/telas/04-turma-detalhe.png.
 * Aluno aqui é só nome + matrícula: sem e-mail, senha ou login (o aluno
 * não acessa o sistema). Editar troca a linha pelos campos; remover pede
 * confirmação na própria linha.
 */

const route = useRoute()
const turmaId = route.params.id as string

const turma = ref<Class | null>(null)
const carregando = ref(true)
const erroCarga = ref('')
const naoEncontrada = ref(false)

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    turma.value = await buscarTurma(turmaId)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) naoEncontrada.value = true
    else erroCarga.value = mensagemDeErro(erro, 'Não foi possível carregar a turma.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const mostrarFormulario = ref(false)
const novoNome = ref('')
const novaMatricula = ref('')
const salvando = ref(false)
const erroFormulario = ref('')

function abrirFormulario() {
  mostrarFormulario.value = true
  erroFormulario.value = ''
}

function cancelar() {
  mostrarFormulario.value = false
  novoNome.value = ''
  novaMatricula.value = ''
  erroFormulario.value = ''
}

async function salvarAluno() {
  if (!turma.value || !novoNome.value.trim() || !novaMatricula.value.trim()) return

  salvando.value = true
  erroFormulario.value = ''
  try {
    const aluno = await adicionarAluno(turmaId, {
      nome: novoNome.value.trim(),
      matricula: novaMatricula.value.trim(),
    })
    turma.value.alunos.push(aluno)
    cancelar()
  } catch (erro) {
    // 409: matrícula repetida nesta turma.
    erroFormulario.value = mensagemDeErro(erro, 'Não foi possível adicionar o aluno.')
  } finally {
    salvando.value = false
  }
}

/** Aluno com a linha em edição. */
const editandoId = ref<string | null>(null)
const nomeEditado = ref('')
const matriculaEditada = ref('')
const salvandoEdicao = ref(false)
const erroEdicao = ref('')

function abrirEdicao(aluno: Student) {
  excluindoId.value = null
  editandoId.value = aluno.id
  nomeEditado.value = aluno.nome
  matriculaEditada.value = aluno.matricula
  erroEdicao.value = ''
}

async function salvarEdicao(alunoId: string) {
  if (!turma.value || !nomeEditado.value.trim() || !matriculaEditada.value.trim()) return

  salvandoEdicao.value = true
  erroEdicao.value = ''
  try {
    const atualizado = await editarAluno(turmaId, alunoId, {
      nome: nomeEditado.value.trim(),
      matricula: matriculaEditada.value.trim(),
    })
    turma.value.alunos = turma.value.alunos.map((aluno) =>
      aluno.id === alunoId ? atualizado : aluno,
    )
    editandoId.value = null
  } catch (erro) {
    erroEdicao.value = mensagemDeErro(erro, 'Não foi possível salvar o aluno.')
  } finally {
    salvandoEdicao.value = false
  }
}

/** Aluno com a confirmação de remoção aberta. */
const excluindoId = ref<string | null>(null)
const excluindo = ref(false)
const erroExclusao = ref('')

function pedirExclusao(alunoId: string) {
  editandoId.value = null
  excluindoId.value = alunoId
  erroExclusao.value = ''
}

async function confirmarExclusao(alunoId: string) {
  if (!turma.value) return

  excluindo.value = true
  erroExclusao.value = ''
  try {
    await removerAluno(turmaId, alunoId)
    turma.value.alunos = turma.value.alunos.filter((aluno) => aluno.id !== alunoId)
    excluindoId.value = null
  } catch (erro) {
    // 409: o aluno já tem prova corrigida.
    erroExclusao.value = mensagemDeErro(erro, 'Não foi possível remover o aluno.')
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/turmas">Turmas</RouterLink> /
      {{ turma?.nome ?? (naoEncontrada ? 'Turma não encontrada' : '...') }}
    </template>
    <template #titulo>
      {{ turma?.nome ?? (naoEncontrada ? 'Turma não encontrada' : 'Turma') }}
    </template>
    <template v-if="turma" #subtitulo>
      {{ turma.alunos.length }} alunos cadastrados nesta turma.
    </template>
    <template v-if="turma" #acoes>
      <button class="botao" type="button" @click="abrirFormulario">+ Adicionar aluno</button>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando turma...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>

    <template v-else-if="turma">
      <form v-if="mostrarFormulario" class="formulario" @submit.prevent="salvarAluno">
        <label class="campo">
          <span class="rotulo">Nome do aluno</span>
          <input v-model="novoNome" type="text" placeholder="Nome completo" required />
        </label>

        <label class="campo">
          <span class="rotulo">Matrícula</span>
          <input v-model="novaMatricula" type="text" placeholder="2026099" required />
        </label>

        <div class="formulario-acoes">
          <button class="botao" type="submit" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
          <button class="botao-secundario" type="button" @click="cancelar">Cancelar</button>
        </div>

        <p v-if="erroFormulario" class="erro" role="alert">{{ erroFormulario }}</p>
      </form>

      <EstadoTela v-if="turma.alunos.length === 0" tipo="vazio">
        Nenhum aluno cadastrado nesta turma ainda. Use "+ Adicionar aluno".
      </EstadoTela>

      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="aluno in turma.alunos" :key="aluno.id">
            <tr v-if="editandoId === aluno.id">
              <td>
                <input v-model="nomeEditado" type="text" aria-label="Nome do aluno" />
              </td>
              <td>
                <input v-model="matriculaEditada" type="text" aria-label="Matrícula" />
              </td>
              <td class="tabela-acao">
                <button
                  class="link-acao"
                  type="button"
                  :disabled="salvandoEdicao"
                  @click="salvarEdicao(aluno.id)"
                >
                  {{ salvandoEdicao ? 'Salvando...' : 'Salvar' }}
                </button>
                <button class="link-acao" type="button" @click="editandoId = null">
                  Cancelar
                </button>
              </td>
            </tr>
            <tr v-else>
              <td>{{ aluno.nome }}</td>
              <td>{{ aluno.matricula }}</td>
              <td class="tabela-acao">
                <button class="link-acao" type="button" @click="abrirEdicao(aluno)">Editar</button>
                <button class="link-acao" type="button" @click="pedirExclusao(aluno.id)">
                  Remover
                </button>
              </td>
            </tr>
            <tr v-if="editandoId === aluno.id && erroEdicao">
              <td colspan="3"><p class="erro" role="alert">{{ erroEdicao }}</p></td>
            </tr>
            <tr v-if="excluindoId === aluno.id">
              <td colspan="3">
                <ConfirmarExclusao
                  :alvo="`o aluno ${aluno.nome}`"
                  :excluindo="excluindo"
                  :erro="erroExclusao"
                  @confirmar="confirmarExclusao(aluno.id)"
                  @cancelar="excluindoId = null"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>

    <EstadoTela v-else tipo="vazio">
      Nenhuma turma encontrada com este id.
      <RouterLink to="/turmas">Voltar para as turmas</RouterLink>
    </EstadoTela>
  </AppShell>
</template>

<style scoped>
.botao {
  padding: var(--space-2) var(--space-4);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
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
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}

.botao-secundario:hover {
  color: var(--text);
  background: var(--bg);
}

.formulario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

input {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.formulario-acoes {
  display: flex;
  gap: var(--space-2);
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

.tabela td input {
  width: 100%;
  min-width: 120px;
}

.link-acao {
  margin-left: var(--space-4);
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

.erro {
  grid-column: 1 / -1;
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.botao:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
