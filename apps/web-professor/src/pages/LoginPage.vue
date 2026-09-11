<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoSGP from '../components/LogoSGP.vue'

/**
 * Login do professor (RF01) — não usa o AppShell.
 * Layout fiel ao mockup docs/telas/01-login-web.png: coluna centralizada
 * sobre fundo branco, sem card com borda.
 *
 * Na N1 não há autenticação real; o botão apenas leva ao dashboard.
 */
const router = useRouter()
const email = ref('')
const senha = ref('')

function entrar() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="pagina">
    <form class="coluna" @submit.prevent="entrar">
      <LogoSGP :tamanho="48" />

      <div class="intro">
        <h1 class="titulo">Entrar no SGP</h1>
        <p class="subtitulo">Acesso exclusivo do professor.</p>
      </div>

      <label class="campo">
        <span class="rotulo">E-mail</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="ana.professora@escola.edu.br"
        />
      </label>

      <label class="campo">
        <span class="rotulo">Senha</span>
        <input
          v-model="senha"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••••"
        />
      </label>

      <button class="botao" type="submit">Entrar</button>

      <!-- Ainda sem ação: recuperação de senha não faz parte da N1. -->
      <a class="esqueci" href="#" @click.prevent>Esqueci minha senha</a>
    </form>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: var(--space-7) var(--space-5);
  background: var(--surface);
}

.coluna {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.intro {
  margin-top: var(--space-2);
}

.titulo {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text);
}

.subtitulo {
  margin: var(--space-1) 0 0;
  font-size: var(--text-lg);
  color: var(--text-soft);
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
  padding: var(--space-3);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

input::placeholder {
  color: var(--text-faint);
}

input:focus {
  outline: none;
  border-color: var(--accent);
}

.botao {
  padding: var(--space-3);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

.botao:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.esqueci {
  align-self: center;
  font-size: var(--text-base);
  color: var(--text-faint);
}

.esqueci:hover {
  color: var(--text-soft);
}
</style>
