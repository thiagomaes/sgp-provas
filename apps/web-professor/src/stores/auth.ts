import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../services/http'
import { limparSessao, salvarTokens, tokenDeRenovacao } from '../services/sessao'
import type { Session, Teacher } from '../types'

/** Sessão do professor (RF01): login, logout e quem está logado. */
export const useAuthStore = defineStore('auth', () => {
  const professor = ref<Teacher | null>(null)

  async function entrar(email: string, senha: string) {
    const sessao = await http.post<Session>('/auth/login', { email, senha }, true)
    salvarTokens(sessao.accessToken, sessao.refreshToken)
    professor.value = sessao.professor
  }

  /** Busca o professor logado (GET /auth/me), ex.: depois de recarregar a página. */
  async function carregarProfessor() {
    professor.value = await http.get<Teacher>('/auth/me')
  }

  async function sair() {
    const refreshToken = tokenDeRenovacao()
    try {
      // Revoga o refresh token deste dispositivo. Se a API falhar, a sessão
      // local é encerrada do mesmo jeito.
      if (refreshToken) await http.post('/auth/logout', { refreshToken })
    } catch {
      // Segue para o logout local.
    } finally {
      limparSessao()
      professor.value = null
    }
  }

  return { professor, entrar, carregarProfessor, sair }
})
