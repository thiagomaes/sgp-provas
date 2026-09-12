<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { aplicacoes } from '../mocks/aplicacoes'
import { provas, buscarProvaPorId } from '../mocks/provas'
import { turmas, buscarTurmaPorId } from '../mocks/turmas'
import type { Application } from '../mocks/types'

/**
 * Aplicações (RF05) — fiel ao mockup docs/telas/09-aplicacoes-lista.png.
 *
 * Criar a aplicação já leva para a configuração do PDF, que é o passo
 * seguinte do fluxo do professor.
 */

const router = useRouter()
const listaAplicacoes = ref(aplicacoes)

const provaId = ref('')
const turmaId = ref('')
const erro = ref('')

const rotuloStatus: Record<Application['status'], string> = {
  rascunho: 'Rascunho',
  'pdf-gerado': 'PDF gerado',
  'em-correcao': 'Em correção',
  concluida: 'Concluída',
}

function nomeDaProva(id: string): string {
  return buscarProvaPorId(id)?.titulo ?? 'Prova removida'
}

function nomeDaTurma(id: string): string {
  return buscarTurmaPorId(id)?.nome ?? 'Turma removida'
}

function criarAplicacao() {
  erro.value = ''

  if (!provaId.value || !turmaId.value) {
    erro.value = 'Escolha a prova e a turma.'
    return
  }

  const turma = buscarTurmaPorId(turmaId.value)
  const novaAplicacao: Application = {
    id: `aplicacao-${Date.now()}`,
    provaId: provaId.value,
    turmaId: turmaId.value,
    data: new Date().toISOString().slice(0, 10),
    // Padrão do fluxo: uma versão embaralhada por aluno da turma.
    versoes: turma?.alunos.length ?? 1,
    embaralharQuestoes: true,
    embaralharAlternativas: true,
    identificarAluno: true,
    status: 'rascunho',
    corrigidas: 0,
    totalProvas: turma?.alunos.length ?? 0,
  }

  listaAplicacoes.value.push(novaAplicacao)
  router.push(`/aplicacoes/${novaAplicacao.id}/exportar`)
}
</script>

<template>
  <AppShell>
    <template #titulo>Aplicações e PDF</template>
    <template #subtitulo>
      Provas aplicadas às turmas e geração do PDF consolidado.
    </template>

    <section class="formulario">
      <div class="campo">
        <label class="rotulo" for="prova">Prova</label>
        <select id="prova" v-model="provaId">
          <option value="">Selecione a prova</option>
          <option v-for="prova in provas" :key="prova.id" :value="prova.id">
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

      <button class="botao" type="button" @click="criarAplicacao">
        Configurar PDF →
      </button>
    </section>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <table class="tabela">
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
        <tr v-for="aplicacao in listaAplicacoes" :key="aplicacao.id">
          <td>{{ nomeDaProva(aplicacao.provaId) }}</td>
          <td>{{ nomeDaTurma(aplicacao.turmaId) }}</td>
          <td>{{ aplicacao.versoes }}</td>
          <td>
            <span class="selo" :class="aplicacao.status === 'concluida' ? 'ok' : 'neutro'">
              {{ rotuloStatus[aplicacao.status] }}
            </span>
          </td>
          <td class="tabela-acao">
            <RouterLink :to="`/aplicacoes/${aplicacao.id}/exportar`">
              Configurar PDF →
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
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

.tabela-acao a {
  font-weight: 600;
  color: var(--text);
}

.tabela-acao a:hover {
  color: var(--accent-dark);
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
