import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { dataIso } from '../common/formatos.js';
import type { CreateQuestaoDto, FiltroQuestoesDto, UpdateQuestaoDto } from './dto/questao.dto.js';
import { QuestionsRepository, type QuestaoComAlternativas } from './questions.repository.js';
import { validarQuestao } from './validacao-questao.js';

/** Mesmo formato do tipo Question da web. */
export interface QuestaoResposta {
  id: string;
  enunciado: string;
  tipo: 'objetiva' | 'discursiva';
  alternativas?: { letra: string; texto: string; correta: boolean }[];
  respostaEsperada?: string;
  pontuacaoMaxima?: number;
  disciplina: string;
  tags: string[];
  criadaEm: string;
}

/**
 * Banco de questões (RF02). Excluir é soft-delete: provas que já usam a
 * questão continuam com a referência.
 */
@Injectable()
export class QuestionsService {
  constructor(private readonly repositorio: QuestionsRepository) {}

  async listar(professorId: string, filtro: FiltroQuestoesDto): Promise<QuestaoResposta[]> {
    const busca = filtro.busca?.trim().toLowerCase();
    const tag = filtro.tag?.trim().toLowerCase();

    return (await this.repositorio.listar(professorId))
      .map(paraResposta)
      .filter((questao) => {
        const tags = questao.tags.map((item) => item.toLowerCase());
        if (tag && !tags.includes(tag)) return false;
        if (busca) {
          return questao.enunciado.toLowerCase().includes(busca) || tags.some((item) => item.includes(busca));
        }
        return true;
      });
  }

  async buscar(professorId: string, id: string): Promise<QuestaoResposta> {
    return paraResposta(await this.questaoDoProfessor(professorId, id));
  }

  async criar(professorId: string, dto: CreateQuestaoDto): Promise<QuestaoResposta> {
    exigirValida(dto);
    const objetiva = dto.tipo === 'objetiva';
    const criada = await this.repositorio.criar(
      professorId,
      {
        enunciado: dto.enunciado.trim(),
        tipo: dto.tipo,
        disciplina: dto.disciplina.trim(),
        tags: limparTags(dto.tags),
        respostaEsperada: objetiva ? null : (dto.respostaEsperada ?? null),
        pontuacaoMaxima: objetiva ? null : (dto.pontuacaoMaxima ?? null),
      },
      objetiva ? (dto.alternativas ?? []) : [],
    );
    return paraResposta(criada);
  }

  async atualizar(professorId: string, id: string, dto: UpdateQuestaoDto): Promise<QuestaoResposta> {
    const atual = await this.questaoDoProfessor(professorId, id);

    // Valida a questão como ela vai ficar: o que veio no PATCH sobre o que já existe.
    const tipo = dto.tipo ?? (atual.tipo as 'objetiva' | 'discursiva');
    const trocouTipo = tipo !== atual.tipo;
    const alternativas =
      dto.alternativas ?? (trocouTipo ? [] : atual.alternativas.map(({ letra, texto, correta }) => ({ letra, texto, correta })));
    const pontuacaoMaxima = dto.pontuacaoMaxima ?? (trocouTipo ? null : atual.pontuacaoMaxima);
    exigirValida({ tipo, alternativas, pontuacaoMaxima });

    const objetiva = tipo === 'objetiva';
    const atualizada = await this.repositorio.atualizar(
      id,
      {
        enunciado: dto.enunciado?.trim(),
        tipo,
        disciplina: dto.disciplina?.trim(),
        tags: dto.tags ? limparTags(dto.tags) : undefined,
        respostaEsperada: objetiva ? null : (dto.respostaEsperada ?? atual.respostaEsperada),
        pontuacaoMaxima: objetiva ? null : pontuacaoMaxima,
      },
      dto.alternativas || trocouTipo ? (objetiva ? alternativas : []) : undefined,
    );
    return paraResposta(atualizada);
  }

  async excluir(professorId: string, id: string): Promise<void> {
    await this.questaoDoProfessor(professorId, id);
    await this.repositorio.marcarComoExcluida(id);
  }

  private async questaoDoProfessor(professorId: string, id: string) {
    const questao = await this.repositorio.buscar(professorId, id);
    if (!questao) throw new NotFoundException('Questão não encontrada.');
    return questao;
  }
}

function exigirValida(questao: Parameters<typeof validarQuestao>[0]) {
  const erro = validarQuestao(questao);
  if (erro) throw new BadRequestException(erro);
}

function limparTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

function paraResposta(questao: QuestaoComAlternativas): QuestaoResposta {
  const resposta: QuestaoResposta = {
    id: questao.id,
    enunciado: questao.enunciado,
    tipo: questao.tipo as 'objetiva' | 'discursiva',
    disciplina: questao.disciplina,
    tags: (questao.tags as string[] | null) ?? [],
    criadaEm: dataIso(questao.criadaEm),
  };
  if (resposta.tipo === 'objetiva') {
    resposta.alternativas = questao.alternativas.map(({ letra, texto, correta }) => ({ letra, texto, correta }));
  } else {
    if (questao.respostaEsperada) resposta.respostaEsperada = questao.respostaEsperada;
    if (questao.pontuacaoMaxima !== null) resposta.pontuacaoMaxima = questao.pontuacaoMaxima;
  }
  return resposta;
}
