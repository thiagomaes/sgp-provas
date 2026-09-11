/**
 * SGP — Entidades do domínio (fase N1, ainda sem banco real).
 *
 * Estes tipos seguem os modelos descritos no README e são a referência
 * única para todas as telas. Se sua tela precisa de um campo que não
 * existe aqui, adicione o campo neste arquivo (e avise o grupo) em vez
 * de criar um tipo paralelo dentro da tela.
 */

/** Professor — único usuário com login no sistema (RF01). */
export interface Teacher {
  id: string
  nome: string
  email: string
}

/**
 * Aluno — registro simples dentro de uma turma (RF03).
 * O aluno NÃO tem login, conta nem tela: é só nome + matrícula.
 */
export interface Student {
  id: string
  nome: string
  matricula: string
}

/** Turma do professor, com a lista de alunos cadastrados. */
export interface Class {
  id: string
  nome: string
  disciplina: string
  ano: string
  /** Turno em que a turma tem aula. */
  turno: 'Manhã' | 'Tarde' | 'Noite'
  alunos: Student[]
}

export type QuestionType = 'objetiva' | 'discursiva'

/** Alternativa de uma questão objetiva (2 a 5 por questão — RF02). */
export interface QuestionOption {
  /** Letra exibida na prova antes do embaralhamento. */
  letra: 'A' | 'B' | 'C' | 'D' | 'E'
  texto: string
  correta: boolean
}

/** Questão do banco do professor (RF02). */
export interface Question {
  id: string
  enunciado: string
  tipo: QuestionType
  /** Preenchido apenas quando tipo === 'objetiva'. */
  alternativas?: QuestionOption[]
  /** Espelho de resposta usado nas discursivas na devolutiva. */
  respostaEsperada?: string
  disciplina: string
  tags: string[]
  criadaEm: string
}

/** Questão dentro de uma prova, com sua pontuação própria (RF04). */
export interface ExamQuestion {
  questaoId: string
  ordem: number
  pontuacao: number
}

/** Prova reutilizável, com até 20 questões (RF04). */
export interface Exam {
  id: string
  titulo: string
  disciplina: string
  questoes: ExamQuestion[]
  /** Soma das pontuações das questões. */
  totalPontos: number
  criadaEm: string
}

export type ApplicationStatus =
  | 'rascunho'
  | 'pdf-gerado'
  | 'em-correcao'
  | 'concluida'

/** Aplicação de uma prova a uma turma (RF05, RF06, RF07). */
export interface Application {
  id: string
  provaId: string
  turmaId: string
  /** Data prevista/realizada da aplicação (ISO, AAAA-MM-DD). */
  data: string
  /** Quantidade de versões embaralhadas geradas no PDF. */
  versoes: number
  embaralharQuestoes: boolean
  embaralharAlternativas: boolean
  /**
   * Quando true, o PDF sai identificado por aluno e a nota é atribuída
   * automaticamente na correção; quando false, o lançamento é manual (RF09).
   */
  identificarAluno: boolean
  status: ApplicationStatus
  /** Quantas provas da turma já foram corrigidas. */
  corrigidas: number
  totalProvas: number
}

/** Resposta marcada pelo aluno em uma questão, lida pelo app mobile. */
export interface CorrectionAnswer {
  questaoId: string
  /** Alternativa marcada no cartão-resposta; null quando em branco. */
  marcada: 'A' | 'B' | 'C' | 'D' | 'E' | null
  correta: boolean
  pontuacao: number
}

export type CorrectionOrigin = 'mobile' | 'manual'
export type CorrectionSyncStatus = 'sincronizada' | 'pendente' | 'conflito'

/** Correção de uma prova (RF08, RF09, RF10). */
export interface Correction {
  id: string
  aplicacaoId: string
  /** Null quando a prova foi gerada sem identificação do aluno. */
  alunoId: string | null
  /** Versão embaralhada lida no QR Code. */
  versao: number
  nota: number
  respostas: CorrectionAnswer[]
  origem: CorrectionOrigin
  /** Id gerado no app para deduplicação na sincronização (RF10). */
  clientCorrectionId: string
  statusSync: CorrectionSyncStatus
  corrigidaEm: string
}
