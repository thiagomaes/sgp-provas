/**
 * SGP — Entidades do domínio, no formato que a API (apps/api) devolve.
 *
 * Estes tipos são a referência única para todas as telas e para os
 * services de src/services. Se sua tela precisa de um campo que não
 * existe aqui, confira primeiro se a API devolve esse campo e adicione
 * neste arquivo (e avise o grupo) em vez de criar um tipo paralelo
 * dentro da tela.
 */

/** Professor — único usuário com login no sistema (RF01). */
export interface Teacher {
  id: string
  nome: string
  email: string
}

/** Resposta de POST /auth/login e POST /auth/refresh. */
export interface Session {
  accessToken: string
  refreshToken: string
  professor: Teacher
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

export type Shift = 'Manhã' | 'Tarde' | 'Noite'

/** Turma do professor, com a lista de alunos cadastrados. */
export interface Class {
  id: string
  nome: string
  disciplina: string
  ano: string
  /** Turno em que a turma tem aula. */
  turno: Shift
  alunos: Student[]
}

export type QuestionType = 'objetiva' | 'discursiva'

export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E'

/** Alternativa de uma questão objetiva (2 a 5 por questão — RF02). */
export interface QuestionOption {
  /** Letra exibida na prova antes do embaralhamento. */
  letra: OptionLetter
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
  /** Pontuação máxima para questões discursivas. */
  pontuacaoMaxima?: number
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
  /** Soma das pontuações das questões, calculada pela API. */
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
  /** Quantidade de versões embaralhadas geradas. */
  versoes: number
  embaralharQuestoes: boolean
  embaralharAlternativas: boolean
  /**
   * Quando true, a prova sai identificada por aluno e a nota é atribuída
   * automaticamente na correção; quando false, o lançamento é manual (RF09).
   */
  identificarAluno: boolean
  status: ApplicationStatus
  /** Quantas provas da turma já foram corrigidas. */
  corrigidas: number
  /** Quantidade de alunos da turma, calculada pela API. */
  totalProvas: number
}

/** Uma versão gerada em POST /applications/:id/generate. */
export interface ApplicationVersion {
  numeroVersao: number
  /** Conteúdo do QR Code impresso nesta versão. */
  qrCodePayload: string
}

/** Resposta marcada pelo aluno em uma questão, lida pela câmera. */
export interface CorrectionAnswer {
  questaoId: string
  /** Alternativa marcada no cartão-resposta; null quando em branco. */
  marcada: OptionLetter | null
  correta: boolean
  pontuacao: number
}

/** 'mobile' = lida pela câmera do celular; 'manual' = nota lançada à mão. */
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
  /** Vazio no lançamento manual, que não passa pelo cartão-resposta. */
  respostas: CorrectionAnswer[]
  origem: CorrectionOrigin
  /** Id gerado pela tela para deduplicação no envio (RF10). */
  clientCorrectionId: string
  statusSync: CorrectionSyncStatus
  corrigidaEm: string
}

/** Turma resumida, como vem no dashboard e nos relatórios. */
export interface ClassSummary {
  id: string
  nome: string
  disciplina: string
  ano: string
}

/** Resposta de GET /reports/summary. */
export interface DashboardSummary {
  totais: { turmas: number; provas: number; aplicacoesRecentes: number }
  /** As 3 aplicações com PDF gerado mais recentes. */
  ultimasAplicacoes: (Application & {
    turma: ClassSummary
    prova: { id: string; titulo: string }
  })[]
  /** Média das notas de cada aplicação (null sem notas), pelo id. */
  medias: Record<string, number | null>
}

export interface Statistics {
  quantidade: number
  media: number
  mediana: number
  desvioPadrao: number
  maior: number
  menor: number
}

/** Resposta de GET /applications/:id/report. */
export interface ApplicationReport {
  aplicacao: Application
  prova: { id: string; titulo: string; totalPontos: number }
  turma: ClassSummary
  /** null enquanto não há nenhuma nota. */
  estatisticas: Statistics | null
  /** Um item por aluno da turma; correcao null = nota ainda não lançada. */
  notas: { aluno: Student; correcao: Correction | null }[]
  /** Provas lidas sem identificação que ainda não têm aluno (RF09). */
  semAluno: Correction[]
}
