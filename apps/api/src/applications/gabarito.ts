import type { LayoutVersao } from './versoes.js';

const LETRAS_IMPRESSAS = ['A', 'B', 'C', 'D', 'E'];

export interface AplicacaoParaGabarito {
  data: Date;
  turma: { nome: string };
  prova: {
    titulo: string;
    questoes: {
      questaoId: string;
      pontuacao: number;
      questao: {
        tipo: string;
        respostaEsperada: string | null;
        alternativas: { letra: string; correta: boolean }[];
      };
    }[];
  };
  versoesProva: {
    numeroVersao: number;
    layout: unknown;
    aluno: { nome: string; matricula: string } | null;
  }[];
}

export interface ItemDoGabarito {
  ordem: number;
  tipo: 'objetiva' | 'discursiva';
  letraCorreta: string | null;
  respostaEsperada: string | null;
  pontuacao: number;
}

export interface VersaoDoGabarito {
  numeroVersao: number;
  aluno: { nome: string; matricula: string } | null;
  questoes: ItemDoGabarito[];
}

export interface GabaritoResposta {
  tituloDaProva: string;
  nomeDaTurma: string;
  data: string;
  versoes: VersaoDoGabarito[];
}

export function montarGabarito(aplicacao: AplicacaoParaGabarito): GabaritoResposta {
  const questoesPorId = new Map(aplicacao.prova.questoes.map((item) => [item.questaoId, item]));

  return {
    tituloDaProva: aplicacao.prova.titulo,
    nomeDaTurma: aplicacao.turma.nome,
    data: aplicacao.data.toISOString().slice(0, 10),
    versoes: aplicacao.versoesProva.map((versao) => ({
      numeroVersao: versao.numeroVersao,
      aluno: versao.aluno,
      questoes: (versao.layout as LayoutVersao).questoes.flatMap((noLayout) => {
        const item = questoesPorId.get(noLayout.questaoId);
        return item ? [itemDoGabarito(noLayout.ordem, noLayout.alternativas, item)] : [];
      }),
    })),
  };
}

function itemDoGabarito(
  ordem: number,
  letrasOriginaisNaOrdemImpressa: string[],
  item: AplicacaoParaGabarito['prova']['questoes'][number],
): ItemDoGabarito {
  const objetiva = item.questao.tipo === 'objetiva';
  return {
    ordem,
    tipo: objetiva ? 'objetiva' : 'discursiva',
    letraCorreta: objetiva ? letraImpressaDaCorreta(letrasOriginaisNaOrdemImpressa, item.questao.alternativas) : null,
    respostaEsperada: objetiva ? null : item.questao.respostaEsperada,
    pontuacao: item.pontuacao,
  };
}

function letraImpressaDaCorreta(
  letrasOriginaisNaOrdemImpressa: string[],
  alternativas: { letra: string; correta: boolean }[],
): string | null {
  const letraOriginal = alternativas.find((alternativa) => alternativa.correta)?.letra;
  const posicao = letrasOriginaisNaOrdemImpressa.findIndex((letra) => letra === letraOriginal);
  return posicao === -1 ? null : LETRAS_IMPRESSAS[posicao];
}
