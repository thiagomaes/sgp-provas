/** Linha da planilha de alunos, já com nome e matrícula sem espaços nas pontas. */
export interface AlunoImportado {
  nome: string;
  matricula: string;
}

/** Limite por importação: uma turma real não passa disso. */
export const MAXIMO_ALUNOS_POR_IMPORTACAO = 500;

/**
 * Confere a lista antes de gravar (RF03): a matrícula não pode repetir dentro
 * da própria planilha nem bater com um aluno que já está na turma. Devolve as
 * mensagens de problema; lista vazia quer dizer que pode gravar.
 */
export function conferirImportacao(alunos: AlunoImportado[], matriculasDaTurma: string[]): string[] {
  const jaNaTurma = new Set(matriculasDaTurma);
  const vistas = new Set<string>();
  const repetidas = new Set<string>();
  const existentes = new Set<string>();

  for (const { matricula } of alunos) {
    if (vistas.has(matricula)) repetidas.add(matricula);
    vistas.add(matricula);
    if (jaNaTurma.has(matricula)) existentes.add(matricula);
  }

  const problemas: string[] = [];
  if (repetidas.size > 0) {
    problemas.push(`Matrícula repetida na planilha: ${[...repetidas].join(', ')}.`);
  }
  if (existentes.size > 0) {
    problemas.push(`Já existe aluno nesta turma com a matrícula: ${[...existentes].join(', ')}.`);
  }
  return problemas;
}
