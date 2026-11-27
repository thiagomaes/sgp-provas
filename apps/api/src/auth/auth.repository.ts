import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

/** Acesso ao banco do módulo de autenticação. */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmail(email: string) {
    return this.prisma.professor.findUnique({ where: { email } });
  }

  buscarPorId(id: string) {
    return this.prisma.professor.findUnique({ where: { id } });
  }

  criarProfessor(dados: { nome: string; email: string; passwordHash: string }) {
    return this.prisma.professor.create({ data: dados });
  }

  salvarRefreshToken(professorId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({ data: { professorId, tokenHash, expiresAt } });
  }

  buscarRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  tentativasDoEmail(email: string, desde: Date) {
    return this.prisma.tentativaLogin.findMany({
      where: { email, criadaEm: { gte: desde } },
      select: { sucesso: true, criadaEm: true },
    });
  }

  tentativasDoIp(ip: string, desde: Date) {
    return this.prisma.tentativaLogin.findMany({
      where: { ip, sucesso: false, criadaEm: { gte: desde } },
      select: { sucesso: true, criadaEm: true },
    });
  }

  /** Grava a tentativa e apaga as antigas, para a tabela não crescer. */
  async registrarTentativa(email: string, ip: string, sucesso: boolean, apagarAntesDe: Date) {
    await this.prisma.tentativaLogin.create({ data: { email, ip, sucesso } });
    await this.prisma.tentativaLogin.deleteMany({ where: { criadaEm: { lt: apagarAntesDe } } });
  }

  /**
   * Anonimização da conta (RF13), tudo numa transação: troca os dados do
   * professor, troca nome e matrícula dos alunos das turmas dele, encerra as
   * sessões abertas e apaga as tentativas de login com o e-mail antigo.
   * Turmas, provas, aplicações, correções e notas ficam como estão.
   */
  async anonimizar(
    professorId: string,
    emailAntigo: string,
    dados: { nome: string; email: string; passwordHash: string },
    nomeAluno: string,
  ) {
    const agora = new Date();
    await this.prisma.$transaction([
      this.prisma.professor.update({
        where: { id: professorId },
        data: { ...dados, anonymizedAt: agora },
      }),
      // Uma instrução só para todos os alunos; a matrícula nova usa o id do
      // aluno para continuar única dentro da turma (a coluna tem 30 caracteres).
      this.prisma.$executeRaw`
        UPDATE \`Aluno\` a
        JOIN \`Turma\` t ON t.id = a.turmaId
        SET a.nome = ${nomeAluno}, a.matricula = LEFT(CONCAT('anon-', a.id), 30)
        WHERE t.professorId = ${professorId}`,
      this.prisma.refreshToken.updateMany({
        where: { professorId, revokedAt: null },
        data: { revokedAt: agora },
      }),
      this.prisma.tentativaLogin.deleteMany({ where: { email: emailAntigo } }),
    ]);
  }

  /** Revoga só se ainda estiver ativo; devolve quantos foram revogados (0 ou 1). */
  async revogarRefreshToken(tokenHash: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }
}
