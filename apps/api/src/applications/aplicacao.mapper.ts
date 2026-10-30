import type { Aplicacao } from '@prisma/client';
import { dataIso } from '../common/formatos.js';

/** Mesmo formato do tipo Application da web. */
export interface AplicacaoResposta {
  id: string;
  provaId: string;
  turmaId: string;
  data: string;
  versoes: number;
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
  identificarAluno: boolean;
  status: string;
  corrigidas: number;
  /** Calculado: quantidade de alunos da turma (não é coluna do banco). */
  totalProvas: number;
}

/** Include que traz o que o mapper precisa para calcular o totalProvas. */
export const incluirTotalDeAlunos = {
  turma: { select: { _count: { select: { alunos: true } } } },
} as const;

export type AplicacaoComTotal = Aplicacao & { turma: { _count: { alunos: number } } };

export function aplicacaoParaResposta(aplicacao: AplicacaoComTotal): AplicacaoResposta {
  return {
    id: aplicacao.id,
    provaId: aplicacao.provaId,
    turmaId: aplicacao.turmaId,
    data: dataIso(aplicacao.data),
    versoes: aplicacao.versoes,
    embaralharQuestoes: aplicacao.embaralharQuestoes,
    embaralharAlternativas: aplicacao.embaralharAlternativas,
    identificarAluno: aplicacao.identificarAluno,
    status: aplicacao.status,
    corrigidas: aplicacao.corrigidas,
    totalProvas: aplicacao.turma._count.alunos,
  };
}
