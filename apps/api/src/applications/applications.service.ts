import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { aplicacaoParaResposta, type AplicacaoResposta } from './aplicacao.mapper.js';
import { ApplicationsRepository } from './applications.repository.js';
import type { CreateAplicacaoDto, GerarVersoesDto } from './dto/aplicacao.dto.js';
import { montarLayout, type Letra } from './versoes.js';

export interface VersaoResposta {
  numeroVersao: number;
  qrCodePayload: string;
}

/**
 * Aplicações (RF05, RF06, RF07): uma prova aplicada a uma turma, com a
 * geração das versões embaralhadas. O PDF de verdade fica para a próxima fase.
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

  async criar(professorId: string, dto: CreateAplicacaoDto): Promise<AplicacaoResposta> {
    if (!(await this.repositorio.provaDoProfessor(professorId, dto.provaId))) {
      throw new BadRequestException('Prova não encontrada.');
    }
    if (!(await this.repositorio.turmaDoProfessor(professorId, dto.turmaId))) {
      throw new BadRequestException('Turma não encontrada.');
    }
    const criada = await this.repositorio.criar({
      professorId,
      provaId: dto.provaId,
      turmaId: dto.turmaId,
      data: new Date(`${dto.data}T00:00:00Z`),
      versoes: dto.versoes ?? 1,
      embaralharQuestoes: dto.embaralharQuestoes ?? true,
      embaralharAlternativas: dto.embaralharAlternativas ?? true,
      identificarAluno: dto.identificarAluno ?? true,
      status: 'rascunho',
    });
    return aplicacaoParaResposta(criada);
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
    const semente = randomUUID();
    const versoes = Array.from({ length: dto.versoes }, (_, indice) => {
      const numeroVersao = indice + 1;
      return {
        numeroVersao,
        layout: montarLayout(questoes, numeroVersao, dto, semente) as object,
        // O conteúdo do QR Code impresso em cada versão; único no banco.
        qrCodePayload: `sgp:${id}:v${numeroVersao}:${randomUUID().slice(0, 8)}`,
      };
    });

    const atualizada = await this.repositorio.salvarVersoes(
      id,
      {
        versoes: dto.versoes,
        embaralharQuestoes: dto.embaralharQuestoes,
        embaralharAlternativas: dto.embaralharAlternativas,
        identificarAluno: dto.identificarAluno,
        status: 'pdf-gerado',
      },
      versoes,
    );
    return {
      aplicacao: aplicacaoParaResposta(atualizada),
      versoes: versoes.map(({ numeroVersao, qrCodePayload }) => ({ numeroVersao, qrCodePayload })),
    };
  }

  private async aplicacaoDoProfessor(professorId: string, id: string) {
    const aplicacao = await this.repositorio.buscar(professorId, id);
    if (!aplicacao) throw new NotFoundException('Aplicação não encontrada.');
    return aplicacao;
  }
}
