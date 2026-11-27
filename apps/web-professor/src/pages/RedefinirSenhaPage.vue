<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import LogoSGP from '../components/LogoSGP.vue'
import { http, mensagemDeErro } from '../services/http'

/**
 * Redefinição de senha (RF01), aberta pelo link /redefinir-senha?token=...
 * gerado em "Esqueci minha senha". Chama POST /auth/reset-password; o token
 * só vale uma vez e por 1 hora. Trocar a senha encerra as sessões abertas.
 */
const SENHA_MINIMA = 6

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''

const senha = ref('')
const confirmacao = ref('')
const salvando = ref(false)
const concluido = ref(false)
const erro = ref('')

async function redefinir() {
  erro.value = ''
  if (senha.value.length < SENHA_MINIMA) {
    erro.value = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
    return
  }
  if (senha.value !== confirmacao.value) {
    erro.value = 'As senhas não conferem.'
    return
  }

  salvando.value = true
  try {
    await http.post('/auth/reset-password', { token, senha: senha.value }, true)
    concluido.value = true
  } catch (falha) {
    // 400: link usado, expirado ou substituído por um pedido mais novo.
    erro.value = mensagemDeErro(falha, 'Não foi possível trocar a senha. Tente de novo.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="pagina">
    <div class="coluna">
      <LogoSGP :tamanho="48" />

      <div class="intro">
        <h1 class="titulo">Criar senha nova</h1>
        <p class="subtitulo">Escolha a nova senha da sua conta.</p>
      </div>

      <div v-if="!token" class="erro" role="alert">
        Este link está incompleto. Peça um novo em
        <RouterLink to="/esqueci-senha">Esqueci minha senha</RouterLink>.
      </div>

      <div v-else-if="concluido" class="aviso" role="status">
        Senha trocada. Entre com a senha nova.
      </div>

      <form v-else class="formulario" novalidate @submit.prevent="redefinir">
        <label class="campo">
          <span class="rotulo">Senha nova</span>
          <input
            v-model="senha"
            type="password"
            autocomplete="new-password"
            :placeholder="`Pelo menos ${SENHA_MINIMA} caracteres`"
          />
        </label>

        <label class="campo">
          <span class="rotulo">Confirme a senha nova</span>
          <input v-model="confirmacao" type="password" autocomplete="new-password" />
        </label>

        <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

        <button class="botao" type="submit" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar senha nova' }}
        </button>
      </form>

      <RouterLink class="voltar" to="/login">Ir para o login</RouterLink>
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

.erro {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.erro a {
  color: var(--warn);
  font-weight: 600;
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
