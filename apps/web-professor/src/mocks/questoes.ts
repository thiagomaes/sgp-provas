import type { Question } from './types'

/**
 * Banco de questões de exemplo (mockups aprovados).
 * As questões objetivas têm de 2 a 5 alternativas, com exatamente uma correta.
 */
export const questoes: Question[] = [
  {
    id: 'questao-1',
    enunciado:
      'Qual é o valor de x na equação 2x + 6 = 20?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: '5', correta: false },
      { letra: 'B', texto: '7', correta: true },
      { letra: 'C', texto: '10', correta: false },
      { letra: 'D', texto: '13', correta: false },
    ],
    disciplina: 'Matemática',
    tags: ['equação do 1º grau', 'álgebra'],
    criadaEm: '2026-02-10',
  },
  {
    id: 'questao-2',
    enunciado:
      'Um triângulo retângulo tem catetos de 3 cm e 4 cm. Qual o comprimento da hipotenusa?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: '5 cm', correta: true },
      { letra: 'B', texto: '6 cm', correta: false },
      { letra: 'C', texto: '7 cm', correta: false },
      { letra: 'D', texto: '12 cm', correta: false },
      { letra: 'E', texto: '25 cm', correta: false },
    ],
    disciplina: 'Matemática',
    tags: ['geometria', 'teorema de Pitágoras'],
    criadaEm: '2026-02-10',
  },
  {
    id: 'questao-3',
    enunciado: 'A função f(x) = 2x - 3 é crescente ou decrescente?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: 'Crescente, pois o coeficiente angular é positivo', correta: true },
      { letra: 'B', texto: 'Decrescente, pois o termo independente é negativo', correta: false },
      { letra: 'C', texto: 'Constante', correta: false },
    ],
    disciplina: 'Matemática',
    tags: ['função afim', 'álgebra'],
    criadaEm: '2026-02-12',
  },
  {
    id: 'questao-4',
    enunciado:
      'Calcule a porcentagem: 15% de 240 corresponde a qual valor?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: '24', correta: false },
      { letra: 'B', texto: '36', correta: true },
      { letra: 'C', texto: '45', correta: false },
      { letra: 'D', texto: '60', correta: false },
    ],
    disciplina: 'Matemática',
    tags: ['porcentagem', 'aritmética'],
    criadaEm: '2026-02-12',
  },
  {
    id: 'questao-5',
    enunciado:
      'Explique com suas palavras a diferença entre média e mediana, dando um exemplo em que os dois valores são diferentes.',
    tipo: 'discursiva',
    respostaEsperada:
      'A média soma todos os valores e divide pela quantidade; a mediana é o valor central do conjunto ordenado. Em {2, 3, 100} a média é 35 e a mediana é 3.',
    disciplina: 'Matemática',
    tags: ['estatística'],
    criadaEm: '2026-02-14',
  },
  {
    id: 'questao-6',
    enunciado: 'Qual o resultado de (-8) + (+3) - (-5)?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: '0', correta: true },
      { letra: 'B', texto: '-10', correta: false },
      { letra: 'C', texto: '-6', correta: false },
      { letra: 'D', texto: '16', correta: false },
    ],
    disciplina: 'Matemática',
    tags: ['números inteiros', 'aritmética'],
    criadaEm: '2026-02-15',
  },
  {
    id: 'questao-7',
    enunciado:
      'Em que ano teve início a Revolução Industrial na Inglaterra, segundo a periodização mais aceita?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: 'Meados do século XVIII', correta: true },
      { letra: 'B', texto: 'Início do século XVI', correta: false },
      { letra: 'C', texto: 'Fim do século XIX', correta: false },
      { letra: 'D', texto: 'Início do século XX', correta: false },
    ],
    disciplina: 'História',
    tags: ['revolução industrial', 'idade moderna'],
    criadaEm: '2026-02-18',
  },
  {
    id: 'questao-8',
    enunciado:
      'Descreva dois impactos sociais da Revolução Industrial nas cidades europeias.',
    tipo: 'discursiva',
    respostaEsperada:
      'Êxodo rural com crescimento desordenado das cidades e formação da classe operária, com jornadas extensas e péssimas condições de moradia.',
    disciplina: 'História',
    tags: ['revolução industrial', 'sociedade'],
    criadaEm: '2026-02-18',
  },
  {
    id: 'questao-9',
    enunciado:
      'Um corpo em queda livre, desprezando a resistência do ar, tem qual aceleração aproximada?',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: '9,8 m/s²', correta: true },
      { letra: 'B', texto: '1,0 m/s²', correta: false },
      { letra: 'C', texto: '98 m/s²', correta: false },
      { letra: 'D', texto: '0 m/s²', correta: false },
    ],
    disciplina: 'Física',
    tags: ['cinemática', 'queda livre'],
    criadaEm: '2026-02-20',
  },
  {
    id: 'questao-10',
    enunciado: 'A unidade de força no Sistema Internacional é:',
    tipo: 'objetiva',
    alternativas: [
      { letra: 'A', texto: 'Newton (N)', correta: true },
      { letra: 'B', texto: 'Joule (J)', correta: false },
      { letra: 'C', texto: 'Watt (W)', correta: false },
      { letra: 'D', texto: 'Pascal (Pa)', correta: false },
    ],
    disciplina: 'Física',
    tags: ['dinâmica', 'unidades'],
    criadaEm: '2026-02-20',
  },
]

export function buscarQuestaoPorId(id: string): Question | undefined {
  return questoes.find((questao) => questao.id === id)
}
