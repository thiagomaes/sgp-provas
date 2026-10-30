/**
 * Montagem das versões embaralhadas de uma prova (RF06, RF07).
 *
 * Funções puras, sem Prisma: são usadas pelo ApplicationsService (rota
 * POST /applications/:id/generate) e pelo seed, que cria as versões das
 * aplicações que já estavam com o PDF gerado nos mocks.
 */

export type Letra = 'A' | 'B' | 'C' | 'D' | 'E';

/** Questão da prova com as letras originais das alternativas. */
export interface QuestaoParaVersao {
  questaoId: string;
  ordem: number;
  /** Letras originais das alternativas; vazio nas discursivas. */
  letras: Letra[];
}

/** Como uma questão aparece impressa numa versão. */
export interface QuestaoNoLayout {
  questaoId: string;
  /** Posição da questão nesta versão (1, 2, 3...). */
  ordem: number;
  /**
   * Letra original de cada alternativa, na ordem em que foi impressa.
   * Ex.: ['C', 'A', 'B'] quer dizer que a alternativa impressa como "A" é a
   * original "C".
   */
  alternativas: Letra[];
}

export interface LayoutVersao {
  questoes: QuestaoNoLayout[];
}

export interface OpcoesEmbaralhamento {
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
}

/** Gerador pseudoaleatório (mulberry32) a partir de um texto. */
function geradorDeSemente(semente: string): () => number {
  let h = 1779033703 ^ semente.length;
  for (let i = 0; i < semente.length; i++) {
    h = Math.imul(h ^ semente.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar<T>(lista: T[], aleatorio: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Monta o layout de uma versão. A mesma semente sempre gera o mesmo layout,
 * o que deixa o seed e os testes previsíveis. A versão 1 sempre sai na ordem
 * original, que serve de referência para o professor.
 */
export function montarLayout(
  questoes: QuestaoParaVersao[],
  numeroVersao: number,
  opcoes: OpcoesEmbaralhamento,
  semente: string,
): LayoutVersao {
  const emOrdem = [...questoes].sort((a, b) => a.ordem - b.ordem);
  const aleatorio = geradorDeSemente(`${semente}:${numeroVersao}`);
  const original = numeroVersao === 1;

  const ordemDasQuestoes =
    opcoes.embaralharQuestoes && !original ? embaralhar(emOrdem, aleatorio) : emOrdem;

  return {
    questoes: ordemDasQuestoes.map((questao, indice) => ({
      questaoId: questao.questaoId,
      ordem: indice + 1,
      alternativas:
        opcoes.embaralharAlternativas && !original
          ? embaralhar(questao.letras, aleatorio)
          : [...questao.letras],
    })),
  };
}
