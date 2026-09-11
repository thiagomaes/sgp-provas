import type { Exam } from './types'

/**
 * Provas de exemplo (mockups aprovados).
 * A prova "Avaliação Bimestral 1" é a usada como exemplo principal nas telas.
 */
export const provas: Exam[] = [
  {
    id: 'prova-1',
    titulo: 'Avaliação Bimestral 1',
    disciplina: 'Matemática',
    questoes: [
      { questaoId: 'questao-1', ordem: 1, pontuacao: 2 },
      { questaoId: 'questao-2', ordem: 2, pontuacao: 2 },
      { questaoId: 'questao-3', ordem: 3, pontuacao: 1.5 },
      { questaoId: 'questao-4', ordem: 4, pontuacao: 1.5 },
      { questaoId: 'questao-6', ordem: 5, pontuacao: 1 },
      { questaoId: 'questao-5', ordem: 6, pontuacao: 2 },
    ],
    totalPontos: 10,
    criadaEm: '2026-03-02',
  },
  {
    id: 'prova-2',
    titulo: 'Recuperação — Matemática',
    disciplina: 'Matemática',
    questoes: [
      { questaoId: 'questao-1', ordem: 1, pontuacao: 3 },
      { questaoId: 'questao-4', ordem: 2, pontuacao: 3 },
      { questaoId: 'questao-6', ordem: 3, pontuacao: 4 },
    ],
    totalPontos: 10,
    criadaEm: '2026-03-20',
  },
  {
    id: 'prova-3',
    titulo: 'Avaliação Bimestral 1 — História',
    disciplina: 'História',
    questoes: [
      { questaoId: 'questao-7', ordem: 1, pontuacao: 5 },
      { questaoId: 'questao-8', ordem: 2, pontuacao: 5 },
    ],
    totalPontos: 10,
    criadaEm: '2026-03-05',
  },
  {
    id: 'prova-4',
    titulo: 'Simulado de Física',
    disciplina: 'Física',
    questoes: [
      { questaoId: 'questao-9', ordem: 1, pontuacao: 5 },
      { questaoId: 'questao-10', ordem: 2, pontuacao: 5 },
    ],
    totalPontos: 10,
    criadaEm: '2026-03-08',
  },
]

/** Prova usada como exemplo principal nos mockups. */
export const provaExemplo = provas[0]

export function buscarProvaPorId(id: string): Exam | undefined {
  return provas.find((prova) => prova.id === id)
}
