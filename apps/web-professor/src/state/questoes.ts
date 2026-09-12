import { reactive } from 'vue'
import { questoes as questoesBase } from '../mocks/questoes'
import type { Question } from '../mocks/types'

export const questoesState = reactive<Question[]>(
  questoesBase.map((questao) => ({
    ...questao,
    tags: [...questao.tags],
    alternativas: questao.alternativas ? [...questao.alternativas] : undefined,
  })),
)
