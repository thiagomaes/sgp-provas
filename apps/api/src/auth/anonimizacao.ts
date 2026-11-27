/**
 * Valores que substituem os dados pessoais na anonimização da conta (RF13).
 * As notas, correções, provas e turmas continuam no banco; só o que identifica
 * uma pessoa (nome e e-mail do professor, nome e matrícula dos alunos) é trocado.
 */
export const NOME_PROFESSOR_ANONIMO = 'Professor anonimizado';
export const NOME_ALUNO_ANONIMO = 'Aluno anonimizado';

/**
 * E-mail único por professor, porque a coluna é @unique. O domínio .invalid é
 * reservado e nunca recebe mensagem, então ninguém consegue usar este e-mail.
 */
export function emailAnonimo(professorId: string): string {
  return `anonimizado-${professorId}@sgp.invalid`;
}
