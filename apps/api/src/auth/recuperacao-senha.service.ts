import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { RecuperacaoSenhaRepository } from './recuperacao-senha.repository.js';

const VALIDADE_MS = 60 * 60 * 1000;
const LINK_INVALIDO = 'Este link de redefinição é inválido ou expirou. Peça um novo em "Esqueci minha senha".';

function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * "Esqueci minha senha" (RF01). O professor pede um link de redefinição com um
 * token aleatório de uso único, válido por 1 hora; o banco guarda só o hash.
 *
 * Limitação: o SGP ainda não tem serviço de e-mail, então o link é escrito no
 * log do servidor (Vercel > Logs) e quem administra o sistema repassa ao
 * professor. Está documentado no README.
 */
@Injectable()
export class RecuperacaoSenhaService {
  private readonly logger = new Logger(RecuperacaoSenhaService.name);

  constructor(
    private readonly repositorio: RecuperacaoSenhaRepository,
    private readonly config: ConfigService,
  ) {}

  /** Não diz se o e-mail existe: a resposta é a mesma nos dois casos. */
  async pedir(email: string): Promise<void> {
    const professor = await this.repositorio.buscarProfessorPorEmail(email.trim().toLowerCase());
    if (!professor || professor.anonymizedAt) return;

    const token = randomBytes(32).toString('hex');
    await this.repositorio.criar(professor.id, hashDoToken(token), new Date(Date.now() + VALIDADE_MS));

    const web = this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173';
    // O id, e não o e-mail, para o log não guardar dado pessoal além do necessário.
    this.logger.log(
      `Link de redefinição de senha do professor ${professor.id} (vale 1 hora): ${web}/redefinir-senha?token=${token}`,
    );
  }

  async redefinir(token: string, senha: string): Promise<void> {
    const salvo = await this.repositorio.buscar(hashDoToken(token));
    if (!salvo || salvo.usadoEm || salvo.expiresAt < new Date() || salvo.professor.anonymizedAt) {
      throw new BadRequestException(LINK_INVALIDO);
    }

    const passwordHash = await bcrypt.hash(senha, 10);
    if (!(await this.repositorio.trocarSenha(salvo.id, salvo.professorId, passwordHash))) {
      throw new BadRequestException(LINK_INVALIDO);
    }
  }
}
