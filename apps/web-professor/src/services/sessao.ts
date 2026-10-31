/**
 * Tokens da sessão do professor, guardados no localStorage para o login
 * sobreviver a um recarregamento da página. Só o cliente HTTP, a store de
 * autenticação e a guarda de rota mexem aqui.
 */

const CHAVE_ACESSO = 'sgp.accessToken'
const CHAVE_RENOVACAO = 'sgp.refreshToken'

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function tokenDeAcesso(): string | null {
  return ler(CHAVE_ACESSO)
}

export function tokenDeRenovacao(): string | null {
  return ler(CHAVE_RENOVACAO)
}

export function temSessao(): boolean {
  return !!tokenDeAcesso() && !!tokenDeRenovacao()
}

export function salvarTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(CHAVE_ACESSO, accessToken)
  localStorage.setItem(CHAVE_RENOVACAO, refreshToken)
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_ACESSO)
  localStorage.removeItem(CHAVE_RENOVACAO)
}
