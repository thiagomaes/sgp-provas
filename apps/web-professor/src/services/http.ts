import router from '../router'
import type { Session } from '../types'
import { limparSessao, salvarTokens, tokenDeAcesso, tokenDeRenovacao } from './sessao'

/**
 * Cliente HTTP da API do SGP (apps/api). Todas as chamadas das telas
 * passam por aqui, através dos services de cada área.
 *
 * Em desenvolvimento (npm run dev) as chamadas vão para /api, que o Vite
 * repassa para o VITE_API_URL (ver vite.config.ts): a API publicada só
 * libera o CORS para o site publicado. No build, a URL é usada direto.
 */
const BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL ?? 'https://sgp-provas-api.vercel.app')

/** Erro devolvido pela API, com a mensagem dela pronta para a tela. */
export class ErroApi extends Error {
  readonly status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

/** Mensagem do erro para mostrar na tela, venha ele da API ou da rede. */
export function mensagemDeErro(erro: unknown, padrao = 'Algo deu errado. Tente de novo.'): string {
  return erro instanceof ErroApi ? erro.message : padrao
}

interface Opcoes {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Rotas abertas (login, refresh) não mandam o token nem tentam renovar. */
  publica?: boolean
}

/** Uma renovação por vez: vários 401 juntos esperam a mesma. */
let renovacaoEmAndamento: Promise<boolean> | null = null

async function renovarSessao(): Promise<boolean> {
  const refreshToken = tokenDeRenovacao()
  if (!refreshToken) return false

  try {
    const sessao = await enviar<Session>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      publica: true,
    })
    salvarTokens(sessao.accessToken, sessao.refreshToken)
    return true
  } catch {
    return false
  }
}

function encerrarSessao() {
  limparSessao()
  if (router.currentRoute.value.name !== 'login') {
    router.push('/login')
  }
}

/**
 * fetch com uma nova tentativa quando a rede falha num GET: a primeira
 * chamada pode pegar a função da API (ou o banco) ainda acordando.
 */
async function buscar(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (erro) {
    if (init.method && init.method !== 'GET') throw erro
    await new Promise((resolver) => setTimeout(resolver, 1500))
    return fetch(url, init)
  }
}

async function lerErro(resposta: Response): Promise<ErroApi> {
  let mensagem = `A API respondeu com erro ${resposta.status}.`
  try {
    const corpo = (await resposta.json()) as { message?: string | string[] }
    if (Array.isArray(corpo.message)) mensagem = corpo.message.join(' ')
    else if (corpo.message) mensagem = corpo.message
  } catch {
    // Corpo sem JSON: fica a mensagem genérica.
  }
  return new ErroApi(resposta.status, mensagem)
}

async function requisitar(caminho: string, opcoes: Opcoes, tentarRenovar = true): Promise<Response> {
  const headers: Record<string, string> = {}
  if (opcoes.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = opcoes.publica ? null : tokenDeAcesso()
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await buscar(`${BASE_URL}${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers,
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível falar com a API. Confira a conexão e tente de novo.')
  }

  if (resposta.status === 401 && !opcoes.publica) {
    if (tentarRenovar) {
      renovacaoEmAndamento ??= renovarSessao().finally(() => {
        renovacaoEmAndamento = null
      })
      if (await renovacaoEmAndamento) return requisitar(caminho, opcoes, false)
    }
    encerrarSessao()
  }

  if (!resposta.ok) throw await lerErro(resposta)
  return resposta
}

async function enviar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const resposta = await requisitar(caminho, opcoes)
  return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T)
}

export const http = {
  get: <T>(caminho: string) => enviar<T>(caminho),
  post: <T>(caminho: string, body?: unknown, publica = false) =>
    enviar<T>(caminho, { method: 'POST', body, publica }),
  patch: <T>(caminho: string, body: unknown) => enviar<T>(caminho, { method: 'PATCH', body }),
  delete: (caminho: string) => enviar<void>(caminho, { method: 'DELETE' }),
}

/**
 * Baixa um arquivo da API com o token (um link comum não manda o
 * Authorization) e salva com o nome que a API sugerir.
 */
export async function baixarArquivo(caminho: string, nomePadrao: string) {
  const resposta = await requisitar(caminho, {})
  const disposicao = resposta.headers.get('Content-Disposition') ?? ''
  const nome = /filename="([^"]+)"/.exec(disposicao)?.[1] ?? nomePadrao

  const url = URL.createObjectURL(await resposta.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
