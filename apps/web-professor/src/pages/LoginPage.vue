<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { professoraLogada } from '../mocks/turmas'

/**
 * Login do professor (RF01) — não usa o AppShell: é um card centralizado.
 * Na N1 não há autenticação real; o botão apenas leva ao dashboard.
 */
const router = useRouter()
const email = ref(professoraLogada.email)
const senha = ref('')

function entrar() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="pagina">
    <form class="card" @submit.prevent="entrar">
      <div class="marca">
        <span class="marca-logo">SGP</span>
        <span class="marca-sub">Sistema de Geração de Provas</span>
      </div>

      <label class="campo">
        <span class="rotulo">E-mail</span>
        <input v-model="email" type="email" autocomplete="email" required />
      </label>

      <label class="campo">
        <span class="rotulo">Senha</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
        />
      </label>

      <button class="botao" type="submit">Entrar</button>

      <p class="aviso">
        Acesso exclusivo do professor. O aluno não acessa o sistema.
      </p>
    </form>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background: var(--bg);
}

.card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.marca {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-1);
}

.marca-logo {
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--accent-dark);
}

.marca-sub {
  font-size: var(--text-xs);
  color: var(--text-faint);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.rotulo {
  font-size: var(--text-sm);
  color: var(--text-soft);
}

input {
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.botao {
  padding: var(--space-2) var(--space-3);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.aviso {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-faint);
}
</style>
