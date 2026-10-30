import { Injectable, NotFoundException } from '@nestjs/common';
import { aplicacaoParaResposta, type AplicacaoResposta } from '../applications/aplicacao.mapper.js';
import { correcaoParaResposta, type CorrecaoResposta } from '../corrections/correcao.mapper.js';
import { calcularEstatisticas, media, type Estatisticas } from './estatisticas.js';
import { ReportsRepository } from './reports.repository.js';

interface TurmaResumo {
  id: string;
  nome: string;
  disciplina: string;
  ano: string;
}

export interface ResumoDashboard {
  totais: { turmas: number; provas: number; aplicacoesRecentes: number };
  /** As 3 aplicações com PDF gerado mais recentes, da mais nova para a mais antiga. */
  ultimasAplicacoes: (AplicacaoResposta & { turma: TurmaResumo; prova: { id: string; titulo: string } })[];
  /** Média das notas de cada aplicação (null sem notas), para a lista de relatórios. */
  medias: Record<string, number | null>;
}

export interface RelatorioAplicacao {
  aplicacao: AplicacaoResposta;
  prova: { id: string; titulo: string; totalPontos: number };
  turma: TurmaResumo;
  estatisticas: Estatisticas | null;
  /** Um item por aluno da turma; correcao null = nota ainda não lançada. */
  notas: { aluno: { id: string; nome: string; matricula: string }; correcao: CorrecaoResposta | null }[];
  /** Provas lidas sem identificação que ainda não foram atribuídas a um aluno (RF09). */
  semAluno: CorrecaoResposta[];
}

type DadosRelatorio = NonNullable<Awaited<ReturnType<ReportsRepository['relatorio']>>>;

/** Relatórios de notas (RF12) e os números do dashboard. */
@Injectable()
export class ReportsService {
  constructor(private readonly repositorio: ReportsRepository) {}

  async resumo(professorId: string): Promise<ResumoDashboard> {
    const [turmas, provas, aplicacoes] = await Promise.all([
      this.repositorio.contarTurmas(professorId),
      this.repositorio.contarProvas(professorId),
      this.repositorio.aplicacoesComNotas(professorId),
    ]);
    const aplicadas = aplicacoes.filter((aplicacao) => aplicacao.status !== 'rascunho');

    return {
      totais: { turmas, provas, aplicacoesRecentes: aplicadas.length },
      ultimasAplicacoes: [...aplicadas]
        .sort((a, b) => b.data.getTime() - a.data.getTime())
        .slice(0, 3)
        .map((aplicacao) => ({
          ...aplicacaoParaResposta(aplicacao),
          turma: {
            id: aplicacao.turma.id,
            nome: aplicacao.turma.nome,
            disciplina: aplicacao.turma.disciplina,
            ano: aplicacao.turma.ano,
          },
          prova: aplicacao.prova,
        })),
      medias: Object.fromEntries(
        aplicacoes.map((aplicacao) => [aplicacao.id, media(aplicacao.correcoes.map((correcao) => correcao.nota))]),
      ),
    };
  }

  async relatorio(professorId: string, aplicacaoId: string): Promise<RelatorioAplicacao> {
    return montarRelatorio(await this.dados(professorId, aplicacaoId));
  }

  /** CSV das notas (separador ";" e vírgula decimal, como o Excel em português abre). */
  async csv(professorId: string, aplicacaoId: string): Promise<{ nomeArquivo: string; conteudo: string }> {
    const relatorio = montarRelatorio(await this.dados(professorId, aplicacaoId));
    const linhas = [
      ['Aluno', 'Matrícula', 'Nota', 'Origem'],
      ...relatorio.notas.map(({ aluno, correcao }) => [
        aluno.nome,
        aluno.matricula,
        correcao ? notaBr(correcao.nota) : '',
        correcao ? rotuloOrigem(correcao.origem) : 'Pendente',
      ]),
      ...relatorio.semAluno.map((correcao) => ['(não identificado)', '', notaBr(correcao.nota), rotuloOrigem(correcao.origem)]),
    ];
    // O BOM no início faz o Excel abrir os acentos certos.
    const conteudo = '﻿' + linhas.map((linha) => linha.map(celulaCsv).join(';')).join('\r\n') + '\r\n';
    const nome = `${relatorio.prova.titulo} ${relatorio.turma.nome}`;
    return { nomeArquivo: `notas-${paraNomeDeArquivo(nome)}.csv`, conteudo };
  }

  private async dados(professorId: string, aplicacaoId: string) {
    const dados = await this.repositorio.relatorio(professorId, aplicacaoId);
    if (!dados) throw new NotFoundException('Aplicação não encontrada.');
    return dados;
  }
}

function montarRelatorio(dados: DadosRelatorio): RelatorioAplicacao {
  const correcoes = dados.correcoes.map(correcaoParaResposta);
  return {
    aplicacao: aplicacaoParaResposta(dados),
    prova: dados.prova,
    turma: { id: dados.turma.id, nome: dados.turma.nome, disciplina: dados.turma.disciplina, ano: dados.turma.ano },
    estatisticas: calcularEstatisticas(correcoes.map((correcao) => correcao.nota)),
    notas: dados.turma.alunos.map((aluno) => ({
      aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula },
      correcao: correcoes.find((correcao) => correcao.alunoId === aluno.id) ?? null,
    })),
    semAluno: correcoes.filter((correcao) => correcao.alunoId === null),
  };
}

function notaBr(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}

function rotuloOrigem(origem: string): string {
  return origem === 'manual' ? 'Manual' : 'Automática';
}

function celulaCsv(valor: string): string {
  return /[";\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

function paraNomeDeArquivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
