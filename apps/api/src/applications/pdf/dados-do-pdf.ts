import type { LayoutVersao } from '../versoes.js';
import type { DadosDoPdf } from './tipos-pdf.js';

export interface AplicacaoParaPdf {
  data: Date;
  turma: { nome: string };
  prova: {
    titulo: string;
    questoes: {
      questaoId: string;
      pontuacao: number;
      questao: { enunciado: string; alternativas: { letra: string; texto: string }[] };
    }[];
  };
  versoesProva: { numeroVersao: number; layout: unknown; qrCodePayload: string }[];
}

export function dadosDoPdf(aplicacao: AplicacaoParaPdf): DadosDoPdf {
  return {
    tituloDaProva: aplicacao.prova.titulo,
    nomeDaTurma: aplicacao.turma.nome,
    data: aplicacao.data.toISOString().slice(0, 10),
    questoes: new Map(
      aplicacao.prova.questoes.map((item) => [
        item.questaoId,
        {
          enunciado: item.questao.enunciado,
          pontuacao: item.pontuacao,
          textoDasAlternativas: Object.fromEntries(
            item.questao.alternativas.map((alternativa) => [alternativa.letra, alternativa.texto]),
          ),
        },
      ]),
    ),
    versoes: aplicacao.versoesProva.map((versao) => ({
      numeroVersao: versao.numeroVersao,
      layout: versao.layout as LayoutVersao,
      qrCodePayload: versao.qrCodePayload,
    })),
  };
}
