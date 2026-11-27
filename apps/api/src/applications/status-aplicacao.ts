export type StatusDaCorrecao = 'pdf-gerado' | 'em-correcao' | 'concluida';

export interface ContagemDeCorrecoes {
  correcoes: number;
  alunosCorrigidos: number;
  totalAlunos: number;
}

export function statusPelasCorrecoes({ correcoes, alunosCorrigidos, totalAlunos }: ContagemDeCorrecoes): StatusDaCorrecao {
  if (totalAlunos > 0 && alunosCorrigidos >= totalAlunos) return 'concluida';
  return correcoes > 0 ? 'em-correcao' : 'pdf-gerado';
}
