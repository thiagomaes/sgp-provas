<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoSGP from '../components/LogoSGP.vue'
import { mensagemDeErro } from '../services/http'
import { useAuthStore } from '../stores/auth'

/**
 * Cadastro do professor (RF01) — não usa o AppShell, mesmo layout do login.
 *
 * Chama POST /auth/register, que já devolve a sessão: depois de criar a
 * conta o professor entra direto no dashboard. As regras de nome, e-mail e
 * senha são conferidas aqui antes de enviar, e a API confere de novo.
 */
const SENHA_MINIMA = 6

const router = useRouter()
const auth = useAuthStore()

const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmacao = ref('')
const enviando = ref(false)
const erro = ref('')

function validar(): string {
  if (nome.value.trim().length < 2) return 'Informe o seu nome.'
  if (!email.value.trim()) return 'Informe o e-mail.'
  if (senha.value.length < SENHA_MINIMA) {
    return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
  }
  if (senha.value !== confirmacao.value) return 'As senhas não conferem.'
  return ''
}

async function cadastrar() {
  erro.value = validar()
  if (erro.value) return

  enviando.value = true
  try {
    await auth.cadastrar(nome.value.trim(), email.value.trim(), senha.value)
    router.push('/dashboard')
  } catch (falha) {
    // E-mail repetido (409) ou inválido (400): a mensagem vem pronta da API.
    erro.value = mensagemDeErro(falha, 'Não foi possível criar a conta. Tente de novo.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="pagina">
    <form class="coluna" novalidate @submit.prevent="cadastrar">
      <LogoSGP :tamanho="48" />

      <div class="intro">
        <h1 class="titulo">Criar conta</h1>
        <p class="subtitulo">Cadastro exclusivo do professor.</p>
      </div>

      <label class="campo">
        <span class="rotulo">Nome</span>
        <input v-model="nome" type="text" maxlength="120" autocomplete="name" placeholder="Ana Costa" />
      </label>

      <label class="campo">
        <span class="rotulo">E-mail</span>
        <input
          v-model="email"
          type="email"
          maxlength="191"
          autocomplete="email"
          placeholder="ana.professora@escola.edu.br"
        />
      </label>

      <label class="campo">
        <span class="rotulo">Senha</span>
        <input
          v-model="senha"
          type="password"
          maxlength="72"
          autocomplete="new-password"
          :placeholder="`Pelo menos ${SENHA_MINIMA} caracteres`"
        />
      </label>

      <label class="campo">
        <span class="rotulo">Confirme a senha</span>
        <input v-model="confirmacao" type="password" maxlength="72" autocomplete="new-password" />
      </label>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="botao" type="submit" :disabled="enviando">
        {{ enviando ? 'Criando conta...' : 'Criar conta' }}
      </button>

      <p class="entrar">Já tem conta? <RouterLink to="/login">Entrar</RouterLink></p>
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

.entrar {
  margin: 0;
  text-align: center;
  font-size: var(--text-base);
  color: var(--text-soft);
}

.entrar a {
  font-weight: 600;
  color: var(--accent);
}

.entrar a:hover {
  color: var(--accent-dark);
}
</style>
