import { JANELA_MS, mensagemDeBloqueio, verificarLimite, type Tentativa } from './limite-login.js';

const agora = new Date('2026-11-06T12:00:00Z');
const minutosAtras = (minutos: number) => new Date(agora.getTime() - minutos * 60 * 1000);
const falha = (minutos: number): Tentativa => ({ sucesso: false, criadaEm: minutosAtras(minutos) });
const acerto = (minutos: number): Tentativa => ({ sucesso: true, criadaEm: minutosAtras(minutos) });

describe('verificarLimite', () => {
  it('libera sem nenhuma tentativa', () => {
    expect(verificarLimite([], [], agora)).toEqual({ bloqueado: false });
  });

  it('libera com 4 falhas do e-mail e bloqueia com 5', () => {
    expect(verificarLimite([falha(4), falha(3), falha(2), falha(1)], [], agora).bloqueado).toBe(false);
    expect(verificarLimite([falha(5), falha(4), falha(3), falha(2), falha(1)], [], agora).bloqueado).toBe(true);
  });

  it('desconsidera as falhas de antes do último login certo', () => {
    const tentativas = [falha(6), falha(5), falha(4), falha(3), falha(2), acerto(1)];
    expect(verificarLimite(tentativas, [], agora).bloqueado).toBe(false);
  });

  it('conta de novo as falhas feitas depois do login certo', () => {
    const tentativas = [acerto(6), falha(5), falha(4), falha(3), falha(2), falha(1)];
    expect(verificarLimite(tentativas, [], agora).bloqueado).toBe(true);
  });

  it('não conta falha com 15 minutos ou mais', () => {
    expect(verificarLimite([falha(15), falha(4), falha(3), falha(2), falha(1)], [], agora).bloqueado).toBe(false);
  });

  it('calcula os segundos até a falha mais antiga das últimas 5 vencer', () => {
    const resultado = verificarLimite([falha(10), falha(9), falha(8), falha(7), falha(6)], [], agora);
    expect(resultado).toEqual({ bloqueado: true, segundos: 5 * 60 });
  });

  it('com mais falhas que o limite, espera sobrarem menos de 5', () => {
    const falhas = [falha(14), falha(10), falha(9), falha(8), falha(7), falha(6)];
    expect(verificarLimite(falhas, [], agora)).toEqual({ bloqueado: true, segundos: 5 * 60 });
  });

  it('bloqueia com 20 falhas do mesmo IP, mesmo com e-mails diferentes', () => {
    const doIp = Array.from({ length: 19 }, (_, indice) => falha(indice / 2));
    expect(verificarLimite([], doIp, agora).bloqueado).toBe(false);
    expect(verificarLimite([], [...doIp, falha(10)], agora).bloqueado).toBe(true);
  });

  it('login certo não zera as falhas do IP', () => {
    const doIp = [...Array.from({ length: 20 }, (_, indice) => falha(indice / 2 + 1)), acerto(0)];
    expect(verificarLimite([], doIp, agora).bloqueado).toBe(true);
  });

  it('usa o maior tempo quando o e-mail e o IP bloqueiam', () => {
    const doEmail = [falha(14), falha(13), falha(12), falha(11), falha(10)];
    const doIp = Array.from({ length: 20 }, () => falha(1));
    expect(verificarLimite(doEmail, doIp, agora)).toEqual({ bloqueado: true, segundos: 14 * 60 });
  });

  it('a janela é de 15 minutos', () => {
    expect(JANELA_MS).toBe(900000);
  });
});

describe('mensagemDeBloqueio', () => {
  it('arredonda os minutos para cima', () => {
    expect(mensagemDeBloqueio(61)).toBe('Muitas tentativas de login. Tente de novo em 2 minutos.');
  });

  it('usa o singular em 1 minuto', () => {
    expect(mensagemDeBloqueio(30)).toBe('Muitas tentativas de login. Tente de novo em 1 minuto.');
  });
});
