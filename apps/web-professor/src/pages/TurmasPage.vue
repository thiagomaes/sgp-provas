<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { turmas } from '../mocks/turmas'
import type { Class } from '../mocks/types'

/**
 * Lista de turmas (RF03) — fiel ao mockup docs/telas/03-turmas-lista.png.
 * "Período" usa turma.turno (Manhã/Tarde/Noite): é o único dado de período
 * que existe no mock — não há campo de ano letivo/semestre em Class.
 */

const listaTurmas = ref<Class[]>(turmas)

const mostrarFormulario = ref(false)
const novoNome = ref('')
const novaDisciplina = ref('')
const novoAno = ref('')
const novoTurno = ref<Class['turno']>('Manhã')

function abrirFormulario() {
  mostrarFormulario.value = true
}

function cancelar() {
  mostrarFormulario.value = false
  novoNome.value = ''
  novaDisciplina.value = ''
  novoAno.value = ''
  novoTurno.value = 'Manhã'
}

function criarTurma() {
  if (!novoNome.value.trim() || !novaDisciplina.value.trim() || !novoAno.value.trim()) return

  listaTurmas.value.push({
    id: `turma-${Date.now()}`,
    nome: novoNome.value.trim(),
    disciplina: novaDisciplina.value.trim(),
    ano: novoAno.value.trim(),
    turno: novoTurno.value,
    alunos: [],
  })

  cancelar()
}
</script>

<template>
  <AppShell>
    <template #titulo>Turmas</template>
    <template #subtitulo>Suas turmas e o total de alunos cadastrados em cada uma.</template>
    <template #acoes>
      <button class="botao" type="button" @click="abrirFormulario">+ Nova turma</button>
    </template>

    <form v-if="mostrarFormulario" class="formulario" @submit.prevent="criarTurma">
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
        <button class="botao" type="submit">Salvar</button>
        <button class="botao-secundario" type="button" @click="cancelar">Cancelar</button>
      </div>
    </form>

    <table class="tabela">
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
        <tr v-for="turma in listaTurmas" :key="turma.id">
          <td>{{ turma.nome }}</td>
          <td>{{ turma.disciplina }}</td>
          <td>{{ turma.alunos.length }}</td>
          <td>{{ turma.turno }}</td>
          <td class="tabela-acao">
            <RouterLink :to="`/turmas/${turma.id}`">Abrir →</RouterLink>
          </td>
        </tr>
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

.tabela-acao a {
  font-weight: 600;
  color: var(--text);
}

.tabela-acao a:hover {
  color: var(--accent-dark);
}
</style>
