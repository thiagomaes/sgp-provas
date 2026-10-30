import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Correcao } from '@prisma/client';
import { dataIso, umaCasa } from '../common/formatos.js';
import { calcularNota, type Letra, type QuestaoDoGabarito } from './calculo-nota.js';
import { CorrectionsRepository } from './corrections.repository.js';
import type { CreateCorrecaoDto, UpdateCorrecaoDto } from './dto/correcao.dto.js';

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

type AplicacaoComGabarito = NonNullable<Awaited<ReturnType<CorrectionsRepository['aplicacaoComGabarito']>>>;

/**
 * Correções (RF08, RF09, RF10). A nota da prova lida pela câmera é calculada
 * aqui, com o gabarito do banco: a tela não decide a nota sozinha.
 */
@Injectable()
export class CorrectionsService {
  constructor(private readonly repositorio: CorrectionsRepository) {}

  async listar(professorId: string, aplicacaoId: string, somenteSemAluno: boolean): Promise<CorrecaoResposta[]> {
    await this.aplicacaoDoProfessor(professorId, aplicacaoId);
    return (await this.repositorio.listar(aplicacaoId, somenteSemAluno)).map(paraResposta);
  }

  async criar(professorId: string, aplicacaoId: string, dto: CreateCorrecaoDto): Promise<CorrecaoResposta> {
    const aplicacao = await this.aplicacaoDoProfessor(professorId, aplicacaoId);

    // Reenvio da mesma correção (ex.: a tela perdeu a conexão no meio): devolve
    // a que já existe, sem contar de novo.
    const existente = await this.repositorio.buscarPorClientId(dto.clientCorrectionId);
    if (existente) return this.reenvio(existente, aplicacaoId);

    if (aplicacao.status === 'rascunho') {
      throw new ConflictException('Gere o PDF desta aplicação antes de corrigir as provas.');
    }
    if (aplicacao.status === 'concluida') {
      throw new ConflictException('Esta aplicação já foi concluída e não recebe novas correções.');
    }

    const origem = dto.origem ?? 'mobile';
    const alunoId = dto.alunoId ?? null;
    if (alunoId) await this.validarAluno(aplicacao, alunoId);

    const totalPontos = aplicacao.prova.totalPontos;
    let versao: number;
    let respostas: unknown[] = [];
    let nota: number;

    if (origem === 'manual') {
      if (!alunoId) throw new BadRequestException('No lançamento manual, informe o aluno.');
      if (dto.nota === undefined) throw new BadRequestException('No lançamento manual, informe a nota.');
      versao = dto.versao ?? 1;
      nota = dto.nota;
    } else {
      if (!dto.versao) throw new BadRequestException('Informe a versão da prova lida no QR Code.');
      if (!aplicacao.versoesProva.some((item) => item.numeroVersao === dto.versao)) {
        throw new BadRequestException(`A versão ${dto.versao} não existe nesta aplicação.`);
      }
      if (!dto.respostas) throw new BadRequestException('Informe as respostas lidas no cartão-resposta.');

      const resultado = calcularNota(gabaritoDa(aplicacao), dto.respostas);
      if (!resultado.ok) throw new BadRequestException(resultado.erro);
      versao = dto.versao;
      respostas = resultado.respostas;
      // "Ajustar nota" na revisão: vale a nota do professor.
      nota = dto.nota ?? resultado.nota;
    }
    exigirNotaValida(nota, totalPontos);

    try {
      const criada = await this.repositorio.criar(
        {
          aplicacaoId,
          alunoId,
          versao,
          nota: umaCasa(nota),
          respostas: respostas as Prisma.InputJsonValue,
          origem,
          clientCorrectionId: dto.clientCorrectionId,
          statusSync: 'sincronizada',
        },
        aplicacao.status,
      );
      return paraResposta(criada);
    } catch (erro) {
      // Dois envios iguais ao mesmo tempo: o segundo bate no @unique.
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        const salva = await this.repositorio.buscarPorClientId(dto.clientCorrectionId);
        if (salva) return this.reenvio(salva, aplicacaoId);
      }
      throw erro;
    }
  }

  async atualizar(
    professorId: string,
    aplicacaoId: string,
    correcaoId: string,
    dto: UpdateCorrecaoDto,
  ): Promise<CorrecaoResposta> {
    if (dto.alunoId === undefined && dto.nota === undefined) {
      throw new BadRequestException('Informe o aluno e/ou a nota.');
    }
    const aplicacao = await this.aplicacaoDoProfessor(professorId, aplicacaoId);
    const correcao = await this.repositorio.buscar(aplicacaoId, correcaoId);
    if (!correcao) throw new NotFoundException('Correção não encontrada nesta aplicação.');

    if (dto.alunoId) await this.validarAluno(aplicacao, dto.alunoId, correcaoId);
    if (dto.nota !== undefined) exigirNotaValida(dto.nota, aplicacao.prova.totalPontos);

    const notaMudou = dto.nota !== undefined && umaCasa(dto.nota) !== correcao.nota;
    const atualizada = await this.repositorio.atualizar(correcaoId, {
      alunoId: dto.alunoId,
      nota: dto.nota === undefined ? undefined : umaCasa(dto.nota),
      // Nota alterada à mão deixa de ser "automática" no relatório.
      origem: notaMudou ? 'manual' : undefined,
    });
    return paraResposta(atualizada);
  }

  private reenvio(existente: Correcao, aplicacaoId: string): CorrecaoResposta {
    if (existente.aplicacaoId !== aplicacaoId) {
      throw new ConflictException('Este clientCorrectionId já foi usado em outra aplicação.');
    }
    return paraResposta(existente);
  }

  private async validarAluno(aplicacao: AplicacaoComGabarito, alunoId: string, exceto?: string) {
    if (!aplicacao.turma.alunos.some((aluno) => aluno.id === alunoId)) {
      throw new BadRequestException('O aluno informado não é desta turma.');
    }
    if (await this.repositorio.correcaoDoAluno(aplicacao.id, alunoId, exceto)) {
      throw new ConflictException('Este aluno já tem uma correção nesta aplicação.');
    }
  }

  private async aplicacaoDoProfessor(professorId: string, aplicacaoId: string) {
    const aplicacao = await this.repositorio.aplicacaoComGabarito(professorId, aplicacaoId);
    if (!aplicacao) throw new NotFoundException('Aplicação não encontrada.');
    return aplicacao;
  }
}

function gabaritoDa(aplicacao: AplicacaoComGabarito): QuestaoDoGabarito[] {
  return aplicacao.prova.questoes.map((item) => ({
    questaoId: item.questaoId,
    pontuacao: item.pontuacao,
    tipo: item.questao.tipo as 'objetiva' | 'discursiva',
    letraCorreta: (item.questao.alternativas.find((alternativa) => alternativa.correta)?.letra ?? null) as Letra | null,
  }));
}

function exigirNotaValida(nota: number, totalPontos: number) {
  if (nota < 0 || nota > totalPontos) {
    throw new BadRequestException(`A nota deve ficar entre 0 e ${totalPontos}.`);
  }
}

function paraResposta(correcao: Correcao): CorrecaoResposta {
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
