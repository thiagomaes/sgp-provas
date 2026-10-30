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

  /** Revoga só se ainda estiver ativo; devolve quantos foram revogados (0 ou 1). */
  async revogarRefreshToken(tokenHash: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }
}
