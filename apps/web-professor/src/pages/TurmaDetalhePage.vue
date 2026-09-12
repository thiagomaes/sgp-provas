<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { buscarTurmaPorId } from '../mocks/turmas'

/**
 * Detalhe da turma (RF03) — fiel ao mockup docs/telas/04-turma-detalhe.png.
 * Aluno aqui é só nome + matrícula: sem e-mail, senha ou login (o aluno
 * não acessa o sistema).
 */

const route = useRoute()
const turma = ref(buscarTurmaPorId(route.params.id as string))

const mostrarFormulario = ref(false)
const novoNome = ref('')
const novaMatricula = ref('')

function abrirFormulario() {
  mostrarFormulario.value = true
}

function cancelar() {
  mostrarFormulario.value = false
  novoNome.value = ''
  novaMatricula.value = ''
}

function adicionarAluno() {
  if (!turma.value || !novoNome.value.trim() || !novaMatricula.value.trim()) return

  turma.value.alunos.push({
    id: `aluno-${Date.now()}`,
    nome: novoNome.value.trim(),
    matricula: novaMatricula.value.trim(),
  })

  cancelar()
}
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/turmas">Turmas</RouterLink> / {{ turma?.nome ?? 'Turma não encontrada' }}
    </template>
    <template #titulo>{{ turma?.nome ?? 'Turma não encontrada' }}</template>
    <template v-if="turma" #subtitulo>{{ turma.alunos.length }} alunos cadastrados nesta turma.</template>
    <template v-if="turma" #acoes>
      <button class="botao" type="button" @click="abrirFormulario">+ Adicionar aluno</button>
    </template>

    <template v-if="turma">
      <form v-if="mostrarFormulario" class="formulario" @submit.prevent="adicionarAluno">
        <label class="campo">
          <span class="rotulo">Nome do aluno</span>
          <input v-model="novoNome" type="text" placeholder="Nome completo" required />
        </label>

        <label class="campo">
          <span class="rotulo">Matrícula</span>
          <input v-model="novaMatricula" type="text" placeholder="2026099" required />
        </label>

        <div class="formulario-acoes">
          <button class="botao" type="submit">Salvar</button>
          <button class="botao-secundario" type="button" @click="cancelar">Cancelar</button>
        </div>
      </form>

      <table class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="aluno in turma.alunos" :key="aluno.id">
            <td>{{ aluno.nome }}</td>
            <td>{{ aluno.matricula }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <p v-else class="vazio">Nenhuma turma encontrada com este id.</p>
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

.vazio {
  padding: var(--space-6);
  color: var(--text-soft);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>
