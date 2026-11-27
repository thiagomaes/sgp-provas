/**
 * Leitura da planilha de alunos (RF03) para a importação na turma.
 *
 * Aceita CSV (separado por vírgula ou ponto e vírgula, como o Excel em
 * português salva) e Excel (.xlsx). A planilha precisa de uma coluna de nome
 * e uma de matrícula; se a primeira linha tiver os títulos "Nome" e
 * "Matrícula", as colunas são achadas por eles, em qualquer ordem. Sem
 * títulos, vale a coluna A para o nome e a B para a matrícula.
 *
 * Tudo acontece no navegador: a API só recebe a lista final, já conferida.
 */

/** Mesmos limites da API (CreateAlunoDto). */
const MAXIMO_NOME = 120
const MAXIMO_MATRICULA = 30
export const MAXIMO_ALUNOS_POR_IMPORTACAO = 500

export interface LinhaPrevia {
  /** Número da linha na planilha, como o professor vê no Excel. */
  linha: number
  nome: string
  matricula: string
  /** Motivo de a linha não poder ser importada; vazio quando está ok. */
  erro: string
}

/** Lê o arquivo e devolve as células como texto, linha por linha. */
export async function lerPlanilha(arquivo: File): Promise<string[][]> {
  const nome = arquivo.name.toLowerCase()
  if (nome.endsWith('.csv')) return lerCsv(await arquivo.text())
  if (nome.endsWith('.xlsx')) {
    // Carregada só quando alguém importa um Excel, para não pesar nas outras telas.
    const { readSheet } = await import('read-excel-file/browser')
    const linhas = await readSheet(arquivo)
    return linhas.map((linha) => linha.map(textoDaCelula))
  }
  throw new Error('Use um arquivo .csv ou .xlsx.')
}

function textoDaCelula(celula: unknown): string {
  if (celula === null || celula === undefined) return ''
  if (celula instanceof Date) return celula.toLocaleDateString('pt-BR')
  return String(celula)
}

/** CSV simples com aspas: "Silva, Ana" continua sendo uma célula só. */
export function lerCsv(texto: string): string[][] {
  const semBom = texto.replace(/^﻿/, '')
  const primeiraLinha = semBom.split(/\r?\n/, 1)[0] ?? ''
  const separador = primeiraLinha.split(';').length > primeiraLinha.split(',').length ? ';' : ','

  const linhas: string[][] = []
  let linha: string[] = []
  let celula = ''
  let entreAspas = false

  for (let i = 0; i < semBom.length; i++) {
    const caractere = semBom[i]
    if (entreAspas) {
      if (caractere === '"' && semBom[i + 1] === '"') {
        celula += '"'
        i++
      } else if (caractere === '"') {
        entreAspas = false
      } else {
        celula += caractere
      }
    } else if (caractere === '"') {
      entreAspas = true
    } else if (caractere === separador) {
      linha.push(celula)
      celula = ''
    } else if (caractere === '\n' || caractere === '\r') {
      if (caractere === '\r' && semBom[i + 1] === '\n') i++
      linha.push(celula)
      linhas.push(linha)
      linha = []
      celula = ''
    } else {
      celula += caractere
    }
  }
  if (celula || linha.length > 0) {
    linha.push(celula)
    linhas.push(linha)
  }
  return linhas
}

/** "Matrícula " → "matricula", para achar a coluna pelo título. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

/**
 * Monta a prévia: uma linha por aluno, com o erro de cada uma. Matrícula
 * repetida marca todas as linhas que a repetem, para o professor escolher qual
 * corrigir; matrícula que já está na turma também é erro.
 */
export function montarPrevia(linhas: string[][], matriculasDaTurma: string[]): LinhaPrevia[] {
  const titulos = (linhas[0] ?? []).map(normalizar)
  const colunaNome = titulos.findIndex((titulo) => titulo.startsWith('nome'))
  const colunaMatricula = titulos.findIndex((titulo) => titulo.startsWith('matricula'))
  const temTitulo = colunaNome >= 0 && colunaMatricula >= 0
  const inicio = temTitulo ? 1 : 0

  const previa: LinhaPrevia[] = []
  linhas.slice(inicio).forEach((celulas, indice) => {
    const nome = (celulas[temTitulo ? colunaNome : 0] ?? '').trim()
    const matricula = (celulas[temTitulo ? colunaMatricula : 1] ?? '').trim()
    // Linha totalmente vazia (comum no fim do arquivo) não entra na prévia.
    if (!nome && !matricula) return
    previa.push({ linha: inicio + indice + 1, nome, matricula, erro: '' })
  })

  const vezes = new Map<string, number>()
  for (const { matricula } of previa) vezes.set(matricula, (vezes.get(matricula) ?? 0) + 1)
  const jaNaTurma = new Set(matriculasDaTurma)

  for (const linha of previa) {
    if (!linha.nome) linha.erro = 'Sem nome.'
    else if (!linha.matricula) linha.erro = 'Sem matrícula.'
    else if (linha.nome.length > MAXIMO_NOME) linha.erro = `Nome com mais de ${MAXIMO_NOME} caracteres.`
    else if (linha.matricula.length > MAXIMO_MATRICULA) {
      linha.erro = `Matrícula com mais de ${MAXIMO_MATRICULA} caracteres.`
    } else if ((vezes.get(linha.matricula) ?? 0) > 1) linha.erro = 'Matrícula repetida na planilha.'
    else if (jaNaTurma.has(linha.matricula)) linha.erro = 'Matrícula já cadastrada nesta turma.'
  }
  return previa
}
