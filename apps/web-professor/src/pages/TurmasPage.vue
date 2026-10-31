<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmarExclusao from '../components/ConfirmarExclusao.vue'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { mensagemDeErro } from '../services/http'
import { criarTurma, editarTurma, excluirTurma, listarTurmas } from '../services/turmas'
import type { Class, Shift } from '../types'

/**
 * Lista de turmas (RF03) — fiel ao protótipo docs/telas/03-turmas-lista.png.
 * "Período" usa turma.turno (Manhã/Tarde/Noite). O mesmo formulário serve
 * para criar e para editar; excluir pede confirmação na própria linha.
 */

const listaTurmas = ref<Class[]>([])
const carregando = ref(true)
const erroLista = ref('')

async function carregar() {
  carregando.value = true
  erroLista.value = ''
  try {
    listaTurmas.value = await listarTurmas()
  } catch (erro) {
    erroLista.value = mensagemDeErro(erro, 'Não foi possível carregar as turmas.')
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const mostrarFormulario = ref(false)
/** Turma em edição; null quando o formulário está criando uma nova. */
const editandoId = ref<string | null>(null)
const novoNome = ref('')
const novaDisciplina = ref('')
const novoAno = ref('')
const novoTurno = ref<Shift>('Manhã')
const salvando = ref(false)
const erroFormulario = ref('')

function abrirFormulario() {
  cancelar()
  mostrarFormulario.value = true
}

function abrirEdicao(turma: Class) {
  excluindoId.value = null
  editandoId.value = turma.id
  novoNome.value = turma.nome
  novaDisciplina.value = turma.disciplina
  novoAno.value = turma.ano
  novoTurno.value = turma.turno
  erroFormulario.value = ''
  mostrarFormulario.value = true
}

function cancelar() {
  mostrarFormulario.value = false
  editandoId.value = null
  novoNome.value = ''
  novaDisciplina.value = ''
  novoAno.value = ''
  novoTurno.value = 'Manhã'
  erroFormulario.value = ''
}

async function salvarTurma() {
  if (!novoNome.value.trim() || !novaDisciplina.value.trim() || !novoAno.value.trim()) return

  const dados = {
    nome: novoNome.value.trim(),
    disciplina: novaDisciplina.value.trim(),
    ano: novoAno.value.trim(),
    turno: novoTurno.value,
  }

  salvando.value = true
  erroFormulario.value = ''
  try {
    if (editandoId.value) {
      const atualizada = await editarTurma(editandoId.value, dados)
      listaTurmas.value = listaTurmas.value.map((turma) =>
        turma.id === atualizada.id ? atualizada : turma,
      )
    } else {
      listaTurmas.value.push(await criarTurma(dados))
    }
    cancelar()
  } catch (erro) {
    erroFormulario.value = mensagemDeErro(erro, 'Não foi possível salvar a turma.')
  } finally {
    salvando.value = false
  }
}

/** Turma com a confirmação de exclusão aberta. */
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
    await excluirTurma(id)
    listaTurmas.value = listaTurmas.value.filter((turma) => turma.id !== id)
    excluindoId.value = null
    if (editandoId.value === id) cancelar()
  } catch (erro) {
    // 409: a turma tem provas corrigidas. A mensagem da API explica.
    erroExclusao.value = mensagemDeErro(erro, 'Não foi possível excluir a turma.')
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #titulo>Turmas</template>
    <template #subtitulo>Suas turmas e o total de alunos cadastrados em cada uma.</template>
    <template #acoes>
      <button class="botao" type="button" @click="abrirFormulario">+ Nova turma</button>
    </template>

    <form v-if="mostrarFormulario" class="formulario" @submit.prevent="salvarTurma">
      <p class="formulario-titulo">{{ editandoId ? 'Editar turma' : 'Nova turma' }}</p>

      <label class="campo">
        <span class="rotulo">Nome da turma</span>
        <input v-model="novoNome" type="text" placeholder="Matemática — 1º Ano" required />
      </label>

      <label class="campo">
        <span class="rotulo">Disciplina</span>
        <input v-model="novaDisciplina" type="text" placeholder="Matemática" required />
      </label>

      <label class="campo">
        <span class="rotulo">Ano</span>
        <input v-model="novoAno" type="text" placeholder="1º Ano" required />
      </label>

      <label class="campo">
        <span class="rotulo">Período</span>
        <select v-model="novoTurno">
          <option value="Manhã">Manhã</option>
          <option value="Tarde">Tarde</option>
          <option value="Noite">Noite</option>
        </select>
      </label>

      <div class="formulario-acoes">
        <button class="botao" type="submit" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </button>
        <button class="botao-secundario" type="button" @click="cancelar">Cancelar</button>
      </div>

      <p v-if="erroFormulario" class="erro" role="alert">{{ erroFormulario }}</p>
    </form>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando turmas...</EstadoTela>
    <EstadoTela v-else-if="erroLista" tipo="erro" @tentar="carregar">{{ erroLista }}</EstadoTela>
    <EstadoTela v-else-if="listaTurmas.length === 0" tipo="vazio">
      Nenhuma turma cadastrada ainda. Use "+ Nova turma" para começar.
    </EstadoTela>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Turma</th>
          <th>Disciplina</th>
          <th>Alunos</th>
          <th>Período</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="turma in listaTurmas" :key="turma.id">
          <tr>
            <td>{{ turma.nome }}</td>
            <td>{{ turma.disciplina }}</td>
            <td>{{ turma.alunos.length }}</td>
            <td>{{ turma.turno }}</td>
            <td class="tabela-acao">
              <button class="link-acao" type="button" @click="abrirEdicao(turma)">Editar</button>
              <button class="link-acao" type="button" @click="pedirExclusao(turma.id)">Excluir</button>
              <RouterLink :to="`/turmas/${turma.id}`">Abrir →</RouterLink>
            </td>
          </tr>
          <tr v-if="excluindoId === turma.id">
            <td colspan="5">
              <ConfirmarExclusao
                :alvo="`a turma ${turma.nome}`"
                detalhe="Os alunos cadastrados nela também são removidos."
                :excluindo="excluindo"
                :erro="erroExclusao"
                @confirmar="confirmarExclusao(turma.id)"
                @cancelar="excluindoId = null"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
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

input,
select {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

input:focus,
select:focus {
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

.tabela-acao a {
  font-weight: 600;
  color: var(--text);
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

.formulario-titulo {
  grid-column: 1 / -1;
  margin: 0;
  font-weight: 600;
  color: var(--text);
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

.tabela-acao a:hover {
  color: var(--accent-dark);
}
</style>
