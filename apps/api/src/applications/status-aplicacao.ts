export type StatusDaCorrecao = 'pdf-gerado' | 'em-correcao' | 'concluida';

export function statusPelasCorrecoes(corrigidas: number, totalAlunos: number): StatusDaCorrecao {
  if (totalAlunos > 0 && corrigidas >= totalAlunos) return 'concluida';
  return corrigidas > 0 ? 'em-correcao' : 'pdf-gerado';
}
