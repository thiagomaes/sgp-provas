import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { dataIso } from '../common/formatos.js';
import type { CreateProvaDto, ItemProvaDto, UpdateProvaDto } from './dto/prova.dto.js';
import { ExamsRepository, type ProvaComQuestoes } from './exams.repository.js';
import { calcularTotalPontos, normalizarOrdem, validarItensDaProva } from './regras-prova.js';

/** Mesmo formato do tipo Exam da web. */
export interface ProvaResposta {
  id: string;
  titulo: string;
  disciplina: string;
  questoes: { questaoId: string; ordem: number; pontuacao: number }[];
  totalPontos: number;
  criadaEm: string;
}

/**
 * Provas reutilizáveis (RF04): até 20 questões do banco do próprio professor,
 * com pontuação por questão. O totalPontos é sempre calculado aqui.
 */
@Injectable()
export class ExamsService {
  constructor(private readonly repositorio: ExamsRepository) {}

  async listar(professorId: string): Promise<ProvaResposta[]> {
    return (await this.repositorio.listar(professorId)).map(paraResposta);
  }

  async buscar(professorId: string, id: string): Promise<ProvaResposta> {
    return paraResposta(await this.provaDoProfessor(professorId, id));
  }

  async criar(professorId: string, dto: CreateProvaDto): Promise<ProvaResposta> {
    const itens = await this.itensValidos(professorId, dto.questoes);
    const criada = await this.repositorio.criar(
      professorId,
      { titulo: dto.titulo.trim(), disciplina: dto.disciplina.trim(), totalPontos: calcularTotalPontos(itens) },
      itens,
    );
    return paraResposta(criada);
  }

  async atualizar(professorId: string, id: string, dto: UpdateProvaDto): Promise<ProvaResposta> {
    await this.provaDoProfessor(professorId, id);

    let itens: Awaited<ReturnType<ExamsService['itensValidos']>> | undefined;
    if (dto.questoes) {
      // As versões impressas e as notas lançadas dependem das questões.
      if ((await this.repositorio.contarAplicacoesComPdf(id)) > 0) {
        throw new ConflictException(
          'Esta prova já tem PDF gerado em alguma aplicação: as questões não podem mudar. Crie uma prova nova.',
        );
      }
      itens = await this.itensValidos(professorId, dto.questoes);
    }

    const atualizada = await this.repositorio.atualizar(
      id,
      {
        titulo: dto.titulo?.trim(),
        disciplina: dto.disciplina?.trim(),
        totalPontos: itens ? calcularTotalPontos(itens) : undefined,
      },
      itens,
    );
    return paraResposta(atualizada);
  }

  /** Soft-delete: aplicações antigas continuam apontando para a prova. */
  async excluir(professorId: string, id: string): Promise<void> {
    await this.provaDoProfessor(professorId, id);
    await this.repositorio.marcarComoExcluida(id);
  }

  private async itensValidos(professorId: string, questoes: ItemProvaDto[]) {
    const erro = validarItensDaProva(questoes);
    if (erro) throw new BadRequestException(erro);

    const ids = questoes.map((item) => item.questaoId);
    const encontrados = new Set(
      (await this.repositorio.idsDeQuestoesDoProfessor(professorId, ids)).map((questao) => questao.id),
    );
    const faltando = ids.filter((id) => !encontrados.has(id));
    if (faltando.length > 0) {
      throw new BadRequestException(`Questões não encontradas no seu banco: ${faltando.join(', ')}.`);
    }

    return normalizarOrdem(questoes).map(({ questaoId, ordem, pontuacao }) => ({ questaoId, ordem, pontuacao }));
  }

  private async provaDoProfessor(professorId: string, id: string) {
    const prova = await this.repositorio.buscar(professorId, id);
    if (!prova) throw new NotFoundException('Prova não encontrada.');
    return prova;
  }
}

function paraResposta(prova: ProvaComQuestoes): ProvaResposta {
  return {
    id: prova.id,
    titulo: prova.titulo,
    disciplina: prova.disciplina,
    questoes: prova.questoes.map(({ questaoId, ordem, pontuacao }) => ({ questaoId, ordem, pontuacao })),
    totalPontos: prova.totalPontos,
    criadaEm: dataIso(prova.criadaEm),
  };
}
