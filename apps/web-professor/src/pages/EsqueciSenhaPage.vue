<script setup lang="ts">
import { ref } from 'vue'
import LogoSGP from '../components/LogoSGP.vue'
import { http, mensagemDeErro } from '../services/http'

/**
 * "Esqueci minha senha" (RF01) — fora do AppShell, mesmo layout do login.
 *
 * Chama POST /auth/forgot-password. A resposta é a mesma exista ou não o
 * e-mail, para a tela não revelar quem tem conta. O SGP ainda não envia
 * e-mail: o link de redefinição fica no log do servidor (ver README).
 */
const email = ref('')
const enviando = ref(false)
const enviado = ref(false)
const erro = ref('')

async function pedir() {
  erro.value = ''
  if (!email.value.trim()) {
    erro.value = 'Informe o e-mail da sua conta.'
    return
  }

  enviando.value = true
  try {
    await http.post('/auth/forgot-password', { email: email.value.trim() }, true)
    enviado.value = true
  } catch (falha) {
    erro.value = mensagemDeErro(falha, 'Não foi possível pedir a redefinição. Tente de novo.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="pagina">
    <div class="coluna">
      <LogoSGP :tamanho="48" />

      <div class="intro">
        <h1 class="titulo">Esqueci minha senha</h1>
        <p class="subtitulo">Peça um link para criar uma senha nova.</p>
      </div>

      <div v-if="enviado" class="aviso" role="status">
        <p>
          Se <strong>{{ email.trim() }}</strong> estiver cadastrado, um link de redefinição foi
          gerado. Ele vale por <strong>1 hora</strong> e só pode ser usado uma vez.
        </p>
        <p>
          O SGP ainda não envia e-mail: peça o link a quem administra o sistema.
        </p>
      </div>

      <form v-else class="formulario" novalidate @submit.prevent="pedir">
        <label class="campo">
          <span class="rotulo">E-mail</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="ana.professora@escola.edu.br"
          />
        </label>

        <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

        <button class="botao" type="submit" :disabled="enviando">
          {{ enviando ? 'Enviando...' : 'Pedir link de redefinição' }}
        </button>
      </form>

      <RouterLink class="voltar" to="/login">Voltar para o login</RouterLink>
    </div>
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

.coluna,
.formulario {
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

.aviso {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  color: var(--text);
  background: var(--accent-soft);
  border-radius: var(--radius-md);
}

.aviso p {
  margin: 0;
}

.aviso p + p {
  margin-top: var(--space-2);
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

.voltar {
  align-self: center;
  font-size: var(--text-base);
  color: var(--text-faint);
}

.voltar:hover {
  color: var(--text-soft);
}
</style>
