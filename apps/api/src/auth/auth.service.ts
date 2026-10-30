import { createHash, randomUUID } from 'node:crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Professor } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { PayloadAcesso } from '../common/jwt-auth.guard.js';
import { AuthRepository } from './auth.repository.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

/** Mesmo formato do tipo Teacher da web. */
export interface ProfessorResposta {
  id: string;
  nome: string;
  email: string;
}

export interface SessaoResposta {
  accessToken: string;
  refreshToken: string;
  professor: ProfessorResposta;
}

const VALIDADE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Autenticação do professor (RF01, RNF04): access token JWT de 1h e refresh
 * token de 7 dias. O refresh token é guardado só como hash e é trocado a cada
 * uso (o antigo é revogado), então um token roubado só serve uma vez.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly repositorio: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registrar(dto: RegisterDto): Promise<SessaoResposta> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repositorio.buscarPorEmail(email)) {
      throw new ConflictException('Já existe um professor cadastrado com este e-mail.');
    }
    const passwordHash = await bcrypt.hash(dto.senha, 10);
    const professor = await this.repositorio.criarProfessor({
      nome: dto.nome.trim(),
      email,
      passwordHash,
    });
    return this.abrirSessao(professor);
  }

  async login(dto: LoginDto): Promise<SessaoResposta> {
    const professor = await this.repositorio.buscarPorEmail(dto.email.trim().toLowerCase());
    // Mesma mensagem para e-mail e senha errados: não revela quais e-mails existem.
    const senhaConfere = professor ? await bcrypt.compare(dto.senha, professor.passwordHash) : false;
    if (!professor || !senhaConfere || professor.anonymizedAt) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return this.abrirSessao(professor);
  }

  async renovar(refreshToken: string): Promise<SessaoResposta> {
    let payload: PayloadAcesso;
    try {
      payload = await this.jwt.verifyAsync<PayloadAcesso>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login de novo.');
    }

    const tokenHash = hashDoToken(refreshToken);
    const salvo = await this.repositorio.buscarRefreshToken(tokenHash);
    if (!salvo || salvo.revokedAt || salvo.expiresAt < new Date() || salvo.professorId !== payload.sub) {
      throw new UnauthorizedException('Sessão expirada. Faça login de novo.');
    }
    // Revoga antes de emitir o novo: se dois pedidos usarem o mesmo token ao
    // mesmo tempo, só um consegue.
    if ((await this.repositorio.revogarRefreshToken(tokenHash)) === 0) {
      throw new UnauthorizedException('Sessão expirada. Faça login de novo.');
    }

    const professor = await this.repositorio.buscarPorId(payload.sub);
    if (!professor || professor.anonymizedAt) {
      throw new UnauthorizedException('Sessão expirada. Faça login de novo.');
    }
    return this.abrirSessao(professor);
  }

  /** Revoga o refresh token deste dispositivo. Só aceita token do próprio professor. */
  async sair(professorId: string, refreshToken: string): Promise<void> {
    const tokenHash = hashDoToken(refreshToken);
    const salvo = await this.repositorio.buscarRefreshToken(tokenHash);
    if (salvo && salvo.professorId === professorId) {
      await this.repositorio.revogarRefreshToken(tokenHash);
    }
  }

  async eu(professorId: string): Promise<ProfessorResposta> {
    const professor = await this.repositorio.buscarPorId(professorId);
    if (!professor || professor.anonymizedAt) {
      throw new UnauthorizedException('Faça login para acessar o sistema.');
    }
    return paraResposta(professor);
  }

  private async abrirSessao(professor: Professor): Promise<SessaoResposta> {
    const payload: PayloadAcesso = { sub: professor.id, email: professor.email };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      // jti deixa cada refresh token único, mesmo emitido no mesmo segundo.
      { ...payload, jti: randomUUID() },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
    await this.repositorio.salvarRefreshToken(
      professor.id,
      hashDoToken(refreshToken),
      new Date(Date.now() + VALIDADE_REFRESH_MS),
    );
    return { accessToken, refreshToken, professor: paraResposta(professor) };
  }
}

function paraResposta(professor: Professor): ProfessorResposta {
  return { id: professor.id, nome: professor.nome, email: professor.email };
}
