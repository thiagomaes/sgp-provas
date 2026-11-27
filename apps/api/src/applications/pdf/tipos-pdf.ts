import type { PDFFont } from 'pdf-lib';
import type { LayoutVersao } from '../versoes.js';

export interface QuestaoImpressa {
  enunciado: string;
  pontuacao: number;
  textoDasAlternativas: Record<string, string>;
}

export interface AlunoImpresso {
  nome: string;
  matricula: string;
}

export interface VersaoImpressa {
  numeroVersao: number;
  layout: LayoutVersao;
  qrCodePayload: string;
  aluno?: AlunoImpresso;
}

export interface DadosDoPdf {
  tituloDaProva: string;
  nomeDaTurma: string;
  data: string;
  questoes: Map<string, QuestaoImpressa>;
  versoes: VersaoImpressa[];
}

export interface FontesDoPdf {
  normal: PDFFont;
  negrito: PDFFont;
}
