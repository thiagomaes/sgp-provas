<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../layouts/AppShell.vue'
import { mensagemDeErro } from '../services/http'
import { useAuthStore } from '../stores/auth'

/**
 * Minha conta: dados do professor e anonimização (RF13, LGPD).
 *
 * A anonimização chama POST /auth/anonymize com a senha do professor. Ela é
 * sem volta, então a confirmação fica na própria tela: o professor marca que
 * entendeu o que acontece e digita a senha. Depois disso a sessão é
 * encerrada e a tela volta para o login.
 */
const router = useRouter()
const auth = useAuthStore()

const confirmando = ref(false)
const entendi = ref(false)
const senha = ref('')
const anonimizando = ref(false)
const erro = ref('')

function abrirConfirmacao() {
  confirmando.value = true
  entendi.value = false
  senha.value = ''
  erro.value = ''
}

function cancelar() {
  confirmando.value = false
  senha.value = ''
  erro.value = ''
}

async function anonimizar() {
  erro.value = ''
  if (!entendi.value) {
    erro.value = 'Marque que você entendeu que a anonimização não pode ser desfeita.'
    return
  }
  if (!senha.value) {
    erro.value = 'Informe a sua senha para confirmar.'
    return
  }

  anonimizando.value = true
  try {
    await auth.anonimizarConta(senha.value)
    router.push('/login')
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível anonimizar a conta. Tente de novo.')
  } finally {
    anonimizando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #titulo>Minha conta</template>
    <template #subtitulo>Seus dados de acesso ao SGP.</template>

    <section class="bloco">
      <h2 class="bloco-titulo">Dados do professor</h2>
      <dl class="dados">
        <dt>Nome</dt>
        <dd>{{ auth.professor?.nome ?? 'Carregando...' }}</dd>
        <dt>E-mail</dt>
        <dd>{{ auth.professor?.email ?? 'Carregando...' }}</dd>
      </dl>
    </section>

    <section class="bloco">
      <h2 class="bloco-titulo">Anonimizar minha conta</h2>
      <p class="texto">
        Atende à LGPD. O seu nome e e-mail e o nome e a matrícula de todos os alunos das suas
        turmas são trocados por valores anônimos. As turmas, questões, provas, correções e notas
        continuam guardadas, mas sem identificar ninguém.
      </p>
      <p class="texto">
        Depois disso você é desconectado e <strong>não consegue mais entrar com esta conta</strong>.
        Não é possível desfazer.
      </p>

      <button v-if="!confirmando" class="botao-perigo" type="button" @click="abrirConfirmacao">
        Anonimizar minha conta
      </button>

      <form v-else class="confirmacao" @submit.prevent="anonimizar">
        <label class="marcar">
          <input v-model="entendi" type="checkbox" />
          <span>Entendi que a anonimização apaga meus dados e os dos meus alunos e não pode ser desfeita.</span>
        </label>

        <label class="campo">
          <span class="rotulo">Sua senha</span>
          <input v-model="senha" type="password" autocomplete="current-password" />
        </label>

        <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

        <div class="acoes">
          <button class="botao-perigo" type="submit" :disabled="anonimizando">
            {{ anonimizando ? 'Anonimizando...' : 'Anonimizar definitivamente' }}
          </button>
          <button class="botao-secundario" type="button" :disabled="anonimizando" @click="cancelar">
            Cancelar
          </button>
        </div>
      </form>
    </section>
  </AppShell>
</template>

<style scoped>
.bloco {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  max-width: 640px;
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.bloco-titulo {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
}

.dados {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-5);
  margin: 0;
}

.dados dt {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
}

.dados dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.texto {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text-soft);
}

.confirmacao {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  background: var(--warn-soft);
  border-radius: var(--radius-md);
}

.marcar {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  font-size: var(--text-base);
  color: var(--text);
}

.marcar input {
  margin-top: 3px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-width: 320px;
}

.rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-soft);
}

.campo input {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.campo input:focus {
  outline: none;
  border-color: var(--accent);
}

.erro {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.botao-perigo {
  padding: var(--space-2) var(--space-4);
  color: var(--surface);
  background: var(--warn);
  border: 1px solid var(--warn);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}

.botao-perigo:disabled {
  opacity: 0.7;
  cursor: wait;
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
</style>
