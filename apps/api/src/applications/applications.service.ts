import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { aplicacaoParaResposta, type AplicacaoResposta } from './aplicacao.mapper.js';
import { ApplicationsRepository } from './applications.repository.js';
import type { CreateAplicacaoDto, GerarVersoesDto } from './dto/aplicacao.dto.js';
import { questoesImpressas, type QuestaoImpressa } from './gabarito-versao.js';
import { dadosDoPdf } from './pdf/dados-do-pdf.js';
import { gerarPdfDaAplicacao } from './pdf/gerar-pdf-aplicacao.js';
import { montarLayout, payloadDoQrCode, type LayoutVersao, type Letra } from './versoes.js';

/** Uma versão como foi impressa, para a tela de correção ler e revisar o cartão. */
export interface VersaoComGabarito {
  numeroVersao: number;
  qrCodePayload: string;
  aluno: { id: string; nome: string; matricula: string } | null;
  questoes: QuestaoImpressa[];
}

export interface VersaoResposta {
  numeroVersao: number;
  qrCodePayload: string;
  aluno: { nome: string; matricula: string } | null;
}

/**
 * Aplicações (RF05, RF06, RF07): uma prova aplicada a uma turma, com a
 * geração das versões embaralhadas e do PDF com caderno e cartão-resposta.
 */
@Injectable()
export class ApplicationsService {
  constructor(private readonly repositorio: ApplicationsRepository) {}

  async listar(professorId: string): Promise<AplicacaoResposta[]> {
    return (await this.repositorio.listar(professorId)).map(aplicacaoParaResposta);
  }

  async buscar(professorId: string, id: string): Promise<AplicacaoResposta> {
    return aplicacaoParaResposta(await this.aplicacaoDoProfessor(professorId, id));
  }

  async criar(professorId: string, dto: CreateAplicacaoDto): Promise<AplicacaoResposta[]> {
    if (!(await this.repositorio.provaDoProfessor(professorId, dto.provaId))) {
      throw new BadRequestException('Prova não encontrada.');
    }
    const turmas = await this.repositorio.turmasDoProfessor(professorId, dto.turmaIds);
    if (turmas.length !== dto.turmaIds.length) {
      throw new BadRequestException('Turma não encontrada.');
    }
    const criadas = await this.repositorio.criarVarias(
      turmas.map((turma) => ({
        professorId,
        provaId: dto.provaId,
        turmaId: turma.id,
        data: new Date(`${dto.data}T00:00:00Z`),
        versoes: dto.versoes ?? versoesPadraoDaTurma(turma._count.alunos),
        embaralharQuestoes: dto.embaralharQuestoes ?? true,
        embaralharAlternativas: dto.embaralharAlternativas ?? true,
        identificarAluno: dto.identificarAluno ?? true,
        status: 'rascunho',
      })),
    );
    return criadas.map(aplicacaoParaResposta);
  }

  async excluir(professorId: string, id: string): Promise<void> {
    await this.aplicacaoDoProfessor(professorId, id);
    if ((await this.repositorio.contarCorrecoes(id)) > 0) {
      throw new ConflictException(
        'Esta aplicação já tem provas corrigidas e não pode ser excluída, para não perder as notas.',
      );
    }
    await this.repositorio.excluir(id);
  }

  /** Gera as versões embaralhadas e marca a aplicação como "PDF gerado". */
  async gerarVersoes(
    professorId: string,
    id: string,
    dto: GerarVersoesDto,
  ): Promise<{ aplicacao: AplicacaoResposta; versoes: VersaoResposta[] }> {
    const aplicacao = await this.aplicacaoDoProfessor(professorId, id);
    if (aplicacao.status === 'em-correcao' || aplicacao.status === 'concluida') {
      throw new ConflictException(
        'A correção desta aplicação já começou: gerar versões novas invalidaria as provas já lidas.',
      );
    }

    const prova = await this.repositorio.provaDoProfessor(professorId, aplicacao.provaId);
    if (!prova || prova.questoes.length === 0) {
      throw new BadRequestException('A prova desta aplicação não tem questões.');
    }

    const questoes = prova.questoes.map((item) => ({
      questaoId: item.questaoId,
      ordem: item.ordem,
      letras: item.questao.alternativas.map((alternativa) => alternativa.letra as Letra),
    }));
    const alunos = dto.identificarAluno ? await this.alunosParaIdentificar(aplicacao.turmaId) : [];
    const totalDeVersoes = dto.identificarAluno ? alunos.length : dto.versoes;
    const semente = randomUUID();
    const versoes = Array.from({ length: totalDeVersoes }, (_, indice) => {
      const numeroVersao = indice + 1;
      const aluno = alunos[indice];
      return {
        numeroVersao,
        alunoId: aluno?.id,
        layout: montarLayout(questoes, numeroVersao, dto, semente) as object,
        qrCodePayload: payloadDoQrCode(id, numeroVersao, randomUUID().slice(0, 8), aluno?.id),
      };
    });

    const atualizada = await this.repositorio.salvarVersoes(
      id,
      {
        versoes: totalDeVersoes,
        embaralharQuestoes: dto.embaralharQuestoes,
        embaralharAlternativas: dto.embaralharAlternativas,
        identificarAluno: dto.identificarAluno,
        status: 'pdf-gerado',
      },
      versoes,
    );

    return {
      aplicacao: aplicacaoParaResposta(atualizada),
      versoes: versoes.map(({ numeroVersao, qrCodePayload }, indice) => ({
        numeroVersao,
        qrCodePayload,
        aluno: alunos[indice] ? { nome: alunos[indice].nome, matricula: alunos[indice].matricula } : null,
      })),
    };
  }

  private async alunosParaIdentificar(turmaId: string) {
    const alunos = await this.repositorio.alunosDaTurma(turmaId);
    if (alunos.length === 0) {
      throw new BadRequestException('A turma não tem alunos: cadastre-os antes de identificar o aluno na prova.');
    }
    if (alunos.length > MAXIMO_DE_VERSOES) {
      throw new BadRequestException(`A prova identificada aceita até ${MAXIMO_DE_VERSOES} alunos por turma.`);
    }
    return alunos;
  }

  async gerarPdf(professorId: string, id: string): Promise<{ arquivo: Uint8Array; nome: string }> {
    const aplicacao = await this.repositorio.buscarParaPdf(professorId, id);
    if (!aplicacao) throw new NotFoundException('Aplicação não encontrada.');
    if (aplicacao.versoesProva.length === 0) {
      throw new ConflictException('Gere as versões da aplicação antes de baixar o PDF.');
    }
    const dados = dadosDoPdf(aplicacao);
    return {
      arquivo: await gerarPdfDaAplicacao(dados),
      nome: nomeDoArquivoPdf(dados.tituloDaProva, dados.nomeDaTurma),
    };
  }

  async listarVersoes(professorId: string, id: string): Promise<VersaoComGabarito[]> {
    const aplicacao = await this.repositorio.buscarVersoesComGabarito(professorId, id);
    if (!aplicacao) throw new NotFoundException('Aplicação não encontrada.');

    const questoes = aplicacao.prova.questoes.map((item) => ({
      questaoId: item.questaoId,
      tipo: item.questao.tipo as 'objetiva' | 'discursiva',
      pontuacao: item.pontuacao,
      letraCorreta: (item.questao.alternativas.find((alternativa) => alternativa.correta)?.letra ?? null) as Letra | null,
    }));
    return aplicacao.versoesProva.map((versao) => ({
      numeroVersao: versao.numeroVersao,
      qrCodePayload: versao.qrCodePayload,
      aluno: versao.aluno,
      questoes: questoesImpressas(versao.layout as unknown as LayoutVersao, questoes),
    }));
  }

  private async aplicacaoDoProfessor(professorId: string, id: string) {
    const aplicacao = await this.repositorio.buscar(professorId, id);
    if (!aplicacao) throw new NotFoundException('Aplicação não encontrada.');
    return aplicacao;
  }
}

function nomeDoArquivoPdf(tituloDaProva: string, nomeDaTurma: string): string {
  const base = `${tituloDaProva}-${nomeDaTurma}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base || 'aplicacao'}.pdf`;
}

const MAXIMO_DE_VERSOES = 200;

export function versoesPadraoDaTurma(totalAlunos: number): number {
  return Math.min(Math.max(totalAlunos, 1), MAXIMO_DE_VERSOES);
}
