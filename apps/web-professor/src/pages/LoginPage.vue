<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoSGP from '../components/LogoSGP.vue'
import { ErroApi, mensagemDeErro } from '../services/http'
import { useAuthStore } from '../stores/auth'

/**
 * Login do professor (RF01) — não usa o AppShell.
 * Layout fiel ao protótipo docs/telas/01-login-web.png: coluna centralizada
 * sobre fundo branco, sem card com borda.
 *
 * Chama POST /auth/login; os tokens ficam guardados pela store de
 * autenticação e a guarda de rota libera as telas internas.
 */
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const senha = ref('')
const entrando = ref(false)
const erro = ref('')

async function entrar() {
  erro.value = ''
  if (!email.value.trim() || !senha.value) {
    erro.value = 'Informe o e-mail e a senha.'
    return
  }

  entrando.value = true
  try {
    await auth.entrar(email.value.trim(), senha.value)
    router.push('/dashboard')
  } catch (falha) {
    erro.value =
      falha instanceof ErroApi && falha.status === 401
        ? 'E-mail ou senha incorretos.'
        : mensagemDeErro(falha, 'Não foi possível entrar. Tente de novo.')
  } finally {
    entrando.value = false
  }
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

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="botao" type="submit" :disabled="entrando">
        {{ entrando ? 'Entrando...' : 'Entrar' }}
      </button>

      <!-- Ainda sem ação: recuperação de senha não faz parte da N2. -->
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

.erro {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
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

.botao:disabled {
  opacity: 0.7;
  cursor: wait;
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
