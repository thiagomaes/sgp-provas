/**
 * Limite de tentativas de login (RNF04), sem banco: usado pelo AuthService e
 * pelos testes.
 */

export const LIMITE_POR_EMAIL = 5;
export const LIMITE_POR_IP = 20;
export const JANELA_MS = 15 * 60 * 1000;

export interface Tentativa {
  sucesso: boolean;
  criadaEm: Date;
}

export type ResultadoLimite = { bloqueado: false } | { bloqueado: true; segundos: number };

/**
 * Segundos até sobrar menos falhas que o limite na janela, ou 0 se não bloqueia.
 * O desbloqueio acontece quando vence a falha que completa as `limite` últimas.
 */
function segundosDeBloqueio(falhas: Tentativa[], limite: number, agora: Date): number {
  const naJanela = falhas
    .filter((tentativa) => agora.getTime() - tentativa.criadaEm.getTime() < JANELA_MS)
    .sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime());
  if (naJanela.length < limite) return 0;

  const liberaEm = naJanela[naJanela.length - limite].criadaEm.getTime() + JANELA_MS;
  return Math.ceil((liberaEm - agora.getTime()) / 1000);
}

/** Só contam as falhas depois do último login certo do e-mail. */
function falhasDesdeOUltimoAcerto(tentativas: Tentativa[]): Tentativa[] {
  const ultimoAcerto = Math.max(
    ...tentativas.filter((tentativa) => tentativa.sucesso).map((tentativa) => tentativa.criadaEm.getTime()),
    0,
  );
  return tentativas.filter((tentativa) => !tentativa.sucesso && tentativa.criadaEm.getTime() > ultimoAcerto);
}

/**
 * Bloqueia com 5 falhas do mesmo e-mail nos últimos 15 minutos, desde o último
 * login certo, ou com 20 falhas do mesmo IP nos últimos 15 minutos.
 */
export function verificarLimite(
  tentativasDoEmail: Tentativa[],
  tentativasDoIp: Tentativa[],
  agora: Date,
): ResultadoLimite {
  const segundos = Math.max(
    segundosDeBloqueio(falhasDesdeOUltimoAcerto(tentativasDoEmail), LIMITE_POR_EMAIL, agora),
    segundosDeBloqueio(tentativasDoIp.filter((tentativa) => !tentativa.sucesso), LIMITE_POR_IP, agora),
  );
  return segundos > 0 ? { bloqueado: true, segundos } : { bloqueado: false };
}

export function mensagemDeBloqueio(segundos: number): string {
  const minutos = Math.ceil(segundos / 60);
  return `Muitas tentativas de login. Tente de novo em ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`;
}
