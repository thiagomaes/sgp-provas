import type { Correcao } from '@prisma/client';
import { dataIso } from '../common/formatos.js';

/** Mesmo formato do tipo Correction da web. */
export interface CorrecaoResposta {
  id: string;
  aplicacaoId: string;
  alunoId: string | null;
  versao: number;
  nota: number;
  respostas: unknown;
  origem: string;
  clientCorrectionId: string;
  statusSync: string;
  corrigidaEm: string;
}

export function correcaoParaResposta(correcao: Correcao): CorrecaoResposta {
  return {
    id: correcao.id,
    aplicacaoId: correcao.aplicacaoId,
    alunoId: correcao.alunoId,
    versao: correcao.versao,
    nota: correcao.nota,
    respostas: correcao.respostas,
    origem: correcao.origem,
    clientCorrectionId: correcao.clientCorrectionId,
    statusSync: correcao.statusSync,
    corrigidaEm: dataIso(correcao.corrigidaEm),
  };
}
