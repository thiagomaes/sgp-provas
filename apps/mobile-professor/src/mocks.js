/**
 * Dados de exemplo do app mobile (fase N1, sem API e sem banco).
 *
 * Espelham os mesmos dados da web (professora Ana Costa, turma
 * Matemática — 1º Ano com 32 alunos, aluna Beatriz Almeida 2026001) e os
 * mockups docs/telas/14-mobile-home-sync.png e 16-mobile-revisao.png.
 *
 * Quando a API existir (N2), isto some e vira chamada de rede + fila local
 * em SQLite.
 */

export const professora = {
  nome: 'Ana Costa',
  email: 'ana.costa@escola.edu.br',
}

/** Correções já feitas no aparelho, ainda não enviadas ao servidor (RF10). */
export const correcoesNaFila = 6

/** Gabaritos baixados para uso offline. */
export const gabaritos = [
  {
    id: 'gabarito-1',
    turma: 'Matemática — 1º Ano',
    prova: 'Avaliação Bimestral 1',
    alunos: 32,
    comIdentificacao: true,
  },
  {
    id: 'gabarito-2',
    turma: 'Física — 2º Ano',
    prova: 'Prova de Cinemática',
    alunos: 28,
    comIdentificacao: false,
  },
]

/**
 * Resultado da leitura do cartão-resposta. Na N1 é fixo: a câmera e o
 * reconhecimento entram na N2/N3.
 */
export const correcaoLida = {
  aluno: 'Beatriz Almeida',
  matricula: '2026001',
  nota: 8.5,
  questoes: [
    { numero: 1, correta: true },
    { numero: 2, correta: true },
    { numero: 3, correta: false },
    { numero: 4, correta: true },
  ],
}
