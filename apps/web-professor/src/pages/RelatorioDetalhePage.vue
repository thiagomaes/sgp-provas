<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EstadoTela from '../components/EstadoTela.vue'
import AppShell from '../layouts/AppShell.vue'
import { atualizarCorrecao, novoIdDeCorrecao, registrarCorrecao } from '../services/correcoes'
import { ErroApi, mensagemDeErro } from '../services/http'
import { baixarCsv, buscarRelatorio } from '../services/relatorios'
import type { ApplicationReport, Correction } from '../types'

/**
 * Notas da aplicação (RF09, RF12) — fiel ao protótipo
 * docs/telas/12-notas-detalhe.png.
 *
 * Aluno sem correção lida pela câmera aparece como "— lançar —": é o
 * lançamento manual da RF09, gravado como correção de origem 'manual'.
 * Uma nota já lançada pode ser editada, e as provas lidas sem
 * identificação são atribuídas aqui a um aluno da turma.
 */

const route = useRoute()
const aplicacaoId = route.params.id as string

const relatorio = ref<ApplicationReport | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

async function carregar(mostrarCarregando = true) {
  if (mostrarCarregando) carregando.value = true
  erroCarga.value = ''
  try {
    relatorio.value = await buscarRelatorio(aplicacaoId)
  } catch (erro) {
    if (!(erro instanceof ErroApi && erro.status === 404)) {
      erroCarga.value = mensagemDeErro(erro, 'Não foi possível carregar as notas.')
    }
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const totalPontos = computed(() => relatorio.value?.prova.totalPontos ?? 10)

/** Alunos ainda sem nota: candidatos a receber uma prova sem identificação. */
const alunosSemNota = computed(
  () => relatorio.value?.notas.filter((linha) => !linha.correcao).map((linha) => linha.aluno) ?? [],
)

function formatarNota(valor: number): string {
  return valor.toFixed(1).replace('.', ',')
}

/** Aluno cuja nota está sendo lançada ou editada agora. */
const editandoAluno = ref<string | null>(null)
const notaDigitada = ref<number | null>(null)
const salvando = ref(false)
const erroNota = ref('')

function abrirLancamento(alunoId: string, correcao: Correction | null) {
  editandoAluno.value = alunoId
  notaDigitada.value = correcao ? correcao.nota : null
  erroNota.value = ''
}

async function salvarNota(alunoId: string, correcao: Correction | null) {
  const nota = notaDigitada.value
  if (nota === null || Number.isNaN(nota) || nota < 0 || nota > totalPontos.value) {
    erroNota.value = `Digite uma nota entre 0 e ${formatarNota(totalPontos.value)}.`
    return
  }

  salvando.value = true
  erroNota.value = ''
  try {
    if (correcao) {
      await atualizarCorrecao(aplicacaoId, correcao.id, { nota })
    } else {
      await registrarCorrecao(aplicacaoId, {
        clientCorrectionId: novoIdDeCorrecao(),
        origem: 'manual',
        alunoId,
        nota,
      })
    }
    editandoAluno.value = null
    await carregar(false)
  } catch (falha) {
    erroNota.value = mensagemDeErro(falha, 'Não foi possível salvar a nota.')
  } finally {
    salvando.value = false
  }
}

/** Aluno escolhido para cada prova lida sem identificação, pelo id da correção. */
const alunoEscolhido = ref<Record<string, string>>({})
const atribuindo = ref<string | null>(null)
const erroAtribuicao = ref('')

async function atribuir(correcao: Correction) {
  const alunoId = alunoEscolhido.value[correcao.id]
  if (!alunoId) {
    erroAtribuicao.value = 'Escolha o aluno pelo nome e matrícula escritos na folha.'
    return
  }

  atribuindo.value = correcao.id
  erroAtribuicao.value = ''
  try {
    await atualizarCorrecao(aplicacaoId, correcao.id, { alunoId })
    await carregar(false)
  } catch (falha) {
    erroAtribuicao.value = mensagemDeErro(falha, 'Não foi possível atribuir a prova ao aluno.')
  } finally {
    atribuindo.value = null
  }
}

const exportando = ref(false)
const erroExportacao = ref('')

async function exportarCsv() {
  exportando.value = true
  erroExportacao.value = ''
  try {
    await baixarCsv(aplicacaoId)
  } catch (falha) {
    erroExportacao.value = mensagemDeErro(falha, 'Não foi possível baixar o CSV.')
  } finally {
    exportando.value = false
  }
}
</script>

<template>
  <AppShell>
    <template #caminho>
      <RouterLink to="/relatorios">Relatórios</RouterLink> /
      {{ relatorio?.prova.titulo ?? '' }} — {{ relatorio?.turma.nome ?? '' }}
    </template>
    <template #titulo>Notas</template>
    <template v-if="relatorio" #acoes>
      <span class="acoes">
        <button
          class="botao-secundario"
          type="button"
          :disabled="exportando"
          @click="exportarCsv"
        >
          {{ exportando ? 'Baixando...' : 'Exportar CSV' }}
        </button>
      </span>
    </template>

    <EstadoTela v-if="carregando" tipo="carregando">Carregando notas...</EstadoTela>
    <EstadoTela v-else-if="erroCarga" tipo="erro" @tentar="carregar">{{ erroCarga }}</EstadoTela>
    <EstadoTela v-else-if="!relatorio" tipo="vazio">
      Nenhuma aplicação encontrada com este id.
      <RouterLink to="/relatorios">Voltar para os relatórios</RouterLink>
    </EstadoTela>

    <template v-else>
      <p v-if="erroExportacao" class="erro" role="alert">{{ erroExportacao }}</p>

      <p v-if="relatorio.estatisticas" class="aviso">
        {{ relatorio.estatisticas.quantidade }}
        {{ relatorio.estatisticas.quantidade === 1 ? 'nota' : 'notas' }} ·
        média {{ formatarNota(relatorio.estatisticas.media) }} ·
        mediana {{ formatarNota(relatorio.estatisticas.mediana) }} ·
        desvio padrão {{ relatorio.estatisticas.desvioPadrao.toFixed(2).replace('.', ',') }} ·
        de {{ formatarNota(relatorio.estatisticas.menor) }} a
        {{ formatarNota(relatorio.estatisticas.maior) }}
      </p>

      <EstadoTela v-if="relatorio.notas.length === 0" tipo="vazio">
        A turma desta aplicação não tem alunos cadastrados.
      </EstadoTela>

      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Nota</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="linha in relatorio.notas" :key="linha.aluno.id">
            <tr>
              <td>{{ linha.aluno.nome }}</td>
              <td>{{ linha.aluno.matricula }}</td>

              <td>
                <span v-if="editandoAluno === linha.aluno.id" class="lancamento">
                  <input
                    v-model.number="notaDigitada"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    :max="totalPontos"
                    step="0.5"
                    :aria-label="`Nota de ${linha.aluno.nome}`"
                    @keyup.enter="salvarNota(linha.aluno.id, linha.correcao)"
                  />
                  <button
                    class="botao"
                    type="button"
                    :disabled="salvando"
                    @click="salvarNota(linha.aluno.id, linha.correcao)"
                  >
                    {{ salvando ? 'Salvando...' : 'Salvar' }}
                  </button>
                  <button class="link-cancelar" type="button" @click="editandoAluno = null">
                    Cancelar
                  </button>
                </span>

                <span v-else-if="linha.correcao" class="nota-lancada">
                  {{ formatarNota(linha.correcao.nota) }}
                  <button
                    class="link-editar"
                    type="button"
                    @click="abrirLancamento(linha.aluno.id, linha.correcao)"
                  >
                    editar
                  </button>
                </span>

                <button
                  v-else
                  class="link-lancar"
                  type="button"
                  @click="abrirLancamento(linha.aluno.id, null)"
                >
                  — lançar —
                </button>
              </td>

              <td>
                <span
                  class="selo"
                  :class="linha.correcao?.origem === 'mobile' ? 'ok' : 'atencao'"
                >
                  {{
                    linha.correcao
                      ? linha.correcao.origem === 'mobile'
                        ? 'Automática'
                        : 'Manual'
                      : 'Manual pendente'
                  }}
                </span>
              </td>
            </tr>
            <tr v-if="editandoAluno === linha.aluno.id && erroNota">
              <td colspan="4"><p class="erro" role="alert">{{ erroNota }}</p></td>
            </tr>
          </template>
        </tbody>
      </table>

      <section v-if="relatorio.semAluno.length" class="sem-aluno">
        <h2 class="secao-titulo">Provas lidas sem identificação</h2>
        <p class="secao-desc">
          Escolha o aluno pelo nome e matrícula escritos na folha para lançar a nota.
        </p>

        <p v-if="erroAtribuicao" class="erro" role="alert">{{ erroAtribuicao }}</p>

        <ul class="lista-sem-aluno">
          <li v-for="correcao in relatorio.semAluno" :key="correcao.id" class="item-sem-aluno">
            <span class="item-nota">
              Versão {{ correcao.versao }} · nota {{ formatarNota(correcao.nota) }}
            </span>
            <select
              v-model="alunoEscolhido[correcao.id]"
              :aria-label="`Aluno da prova com nota ${formatarNota(correcao.nota)}`"
            >
              <option value="">Escolha o aluno</option>
              <option v-for="aluno in alunosSemNota" :key="aluno.id" :value="aluno.id">
                {{ aluno.nome }} · {{ aluno.matricula }}
              </option>
            </select>
            <button
              class="botao"
              type="button"
              :disabled="atribuindo === correcao.id"
              @click="atribuir(correcao)"
            >
              {{ atribuindo === correcao.id ? 'Atribuindo...' : 'Atribuir' }}
            </button>
          </li>
        </ul>
      </section>
    </template>
  </AppShell>
</template>

<style scoped>
.acoes {
  display: flex;
  gap: var(--space-2);
}

.botao-secundario {
  padding: var(--space-2) var(--space-4);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
}

.botao-secundario:hover {
  background: var(--bg);
}

.botao {
  padding: var(--space-1) var(--space-3);
  color: var(--surface);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.botao:disabled,
.botao-secundario:disabled {
  opacity: 0.7;
  cursor: wait;
}

.erro {
  margin: 0 0 var(--space-4);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: var(--radius-sm);
}

.tabela .erro {
  margin: 0;
}

.nota-lancada {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
}

.link-editar,
.link-cancelar {
  padding: 0;
  color: var(--text-faint);
  background: none;
  border: none;
  font-size: var(--text-sm);
  cursor: pointer;
}

.link-editar:hover,
.link-cancelar:hover {
  color: var(--accent-dark);
}

.sem-aluno {
  margin-top: var(--space-6);
}

.secao-titulo {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text);
}

.secao-desc {
  margin: var(--space-1) 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-soft);
}

.lista-sem-aluno {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.item-sem-aluno {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.item-sem-aluno:last-child {
  border-bottom: none;
}

.item-nota {
  flex: 1;
  min-width: 160px;
  font-weight: 600;
  color: var(--text);
}

.item-sem-aluno select {
  min-width: 0;
  max-width: 100%;
  padding: var(--space-1) var(--space-2);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.aviso {
  margin: 0 0 var(--space-4);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--accent-dark);
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
}

.lancamento {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lancamento input {
  width: 72px;
  padding: var(--space-1) var(--space-2);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
}

.link-lancar {
  padding: 0;
  color: var(--warn);
  background: none;
  border: none;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabela th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-faint);
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.tabela td {
  padding: var(--space-4);
  font-size: var(--text-base);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.tabela tbody tr:last-child td {
  border-bottom: none;
}

.selo {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.selo.ok {
  color: var(--accent-dark);
  background: var(--accent-soft);
}

.selo.atencao {
  color: var(--warn);
  background: var(--warn-soft);
}

.vazio {
  color: var(--text-soft);
}
</style>
