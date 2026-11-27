import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

/** Acesso ao banco da recuperação de senha. */
@Injectable()
export class RecuperacaoSenhaRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarProfessorPorEmail(email: string) {
    return this.prisma.professor.findUnique({ where: { email } });
  }

  /** Cria o pedido novo e invalida os anteriores ainda não usados: só o último link vale. */
  async criar(professorId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.$transaction([
      this.prisma.recuperacaoSenha.updateMany({
        where: { professorId, usadoEm: null },
        data: { usadoEm: new Date() },
      }),
      this.prisma.recuperacaoSenha.create({ data: { professorId, tokenHash, expiresAt } }),
    ]);
  }

  buscar(tokenHash: string) {
    return this.prisma.recuperacaoSenha.findUnique({
      where: { tokenHash },
      include: { professor: { select: { anonymizedAt: true } } },
    });
  }

  /**
   * Troca a senha só se o token ainda não foi usado, e encerra as sessões
   * abertas (quem pediu a troca pode estar com a conta invadida). Devolve
   * false se outro pedido usou o mesmo token antes.
   */
  async trocarSenha(recuperacaoId: string, professorId: string, passwordHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.recuperacaoSenha.updateMany({
        where: { id: recuperacaoId, usadoEm: null },
        data: { usadoEm: new Date() },
      });
      if (count === 0) return false;

      await tx.professor.update({ where: { id: professorId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { professorId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return true;
    });
  }
}
