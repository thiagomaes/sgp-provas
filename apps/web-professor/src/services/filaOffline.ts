import { ref } from 'vue'
import { registrarCorrecao, type CorrecaoLida } from './correcoes'
import { ErroApi } from './http'

/**
 * Correção offline (RF10): a prova confirmada sem internet fica guardada no
 * navegador e é enviada sozinha quando a conexão volta. Reenviar não
 * duplica, porque a API reconhece o mesmo clientCorrectionId.
 */

interface Pendente {
  aplicacaoId: string
  dados: CorrecaoLida
  /** Mensagem da API quando o envio foi recusado (conflito); não é reenviada. */
  erro?: string
}

const CHAVE = 'sgp:correcoes-pendentes'

function ler(): Pendente[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as Pendente[]
  } catch {
    return []
  }
}

/** Fila atual, para a tela mostrar pendentes e conflitos. */
export const fila = ref<Pendente[]>(ler())

function gravar(lista: Pendente[]) {
  localStorage.setItem(CHAVE, JSON.stringify(lista))
  fila.value = lista
}

const semConexao = (erro: unknown) =>
  erro instanceof ErroApi && (erro.status === 0 || erro.status === 401)

/** Envia a correção; sem internet, guarda na fila e devolve false. */
export async function registrarOuGuardar(
  aplicacaoId: string,
  dados: CorrecaoLida,
): Promise<boolean> {
  try {
    await registrarCorrecao(aplicacaoId, dados)
    return true
  } catch (erro) {
    if (!(erro instanceof ErroApi && erro.status === 0)) throw erro
    gravar([...ler(), { aplicacaoId, dados }])
    return false
  }
}

let enviando = false

/** Tenta enviar as pendentes; para na primeira falha de rede. */
export async function enviarPendentes() {
  if (enviando) return
  enviando = true
  try {
    for (const item of ler().filter((pendente) => !pendente.erro)) {
      const id = item.dados.clientCorrectionId
      try {
        await registrarCorrecao(item.aplicacaoId, item.dados)
        gravar(ler().filter((pendente) => pendente.dados.clientCorrectionId !== id))
      } catch (erro) {
        if (semConexao(erro)) break
        const mensagem = erro instanceof Error ? erro.message : 'Envio recusado.'
        gravar(
          ler().map((pendente) =>
            pendente.dados.clientCorrectionId === id ? { ...pendente, erro: mensagem } : pendente,
          ),
        )
      }
    }
  } finally {
    enviando = false
  }
}

/** Tira da fila uma correção em conflito, depois que o professor conferiu. */
export function descartar(clientCorrectionId: string) {
  gravar(ler().filter((pendente) => pendente.dados.clientCorrectionId !== clientCorrectionId))
}

window.addEventListener('online', () => void enviarPendentes())
