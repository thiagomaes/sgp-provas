import type { Class, Student, Teacher } from './types'

/**
 * Turmas e alunos de exemplo (dados dos mockups aprovados).
 * Use estes dados nas telas — não crie listas novas.
 */

/** Professora logada nos mockups. */
export const professoraLogada: Teacher = {
  id: 'prof-1',
  nome: 'Ana Costa',
  email: 'ana.costa@escola.edu.br',
}

/**
 * Gera os alunos da turma de Matemática (32 alunos, como no mockup).
 * Os 8 primeiros são os nomes que aparecem na tela de detalhe da turma;
 * o restante completa a lista para o total combinado.
 */
const nomesMatematica = [
  // Os cinco primeiros são exatamente os que aparecem nos mockups
  // 04-turma-detalhe.png e 12-notas-detalhe.png — não troque estes nomes.
  'Beatriz Almeida',
  'Carlos Eduardo Souza',
  'Daniela Ferreira',
  'Eduardo Lima',
  'Fernanda Ribeiro',
  'Gabriel Martins',
  'Helena Barbosa',
  'Igor Nascimento',
  'Juliana Prado',
  'Kaique Moreira',
  'Larissa Duarte',
  'Matheus Carvalho',
  'Natália Ribeiro',
  'Otávio Pereira',
  'Patrícia Gomes',
  'Quésia Andrade',
  'Rafael Teixeira',
  'Sabrina Lopes',
  'Thiago Correia',
  'Ursula Menezes',
  'Vinícius Braga',
  'Wagner Freitas',
  'Xênia Cardoso',
  'Yasmin Tavares',
  'Zeca Monteiro',
  'Alice Fontes',
  'Bruno Siqueira',
  'Carla Vasconcelos',
  'Diego Antunes',
  'Elisa Campos',
  'Felipe Guedes',
  'Giovana Peixoto',
]

const alunosMatematica: Student[] = nomesMatematica.map((nome, indice) => ({
  id: `aluno-${indice + 1}`,
  nome,
  // Matrículas sequenciais a partir de 2026001 (Beatriz Almeida).
  matricula: String(2026001 + indice),
}))

const alunosHistoria: Student[] = [
  'Amanda Ferraz',
  'Bruno Sales',
  'Camila Nogueira',
  'Douglas Pires',
  'Evelyn Castro',
  'Fábio Moura',
  'Gisele Ramos',
  'Henrique Pacheco',
  'Isabela Fontes',
  'João Vitor Alencar',
  'Karina Bastos',
  'Lucas Amorim',
  'Marina Godoy',
  'Nelson Aguiar',
  'Olívia Bandeira',
  'Pedro Henrique Cruz',
  'Renata Coelho',
  'Samuel Vieira',
  'Tatiane Moraes',
  'Victor Hugo Reis',
  'William Dias',
  'Yara Sampaio',
  'Alan Torres',
  'Bianca Queiroz',
  'Cristiano Baptista',
  'Débora Lins',
  'Emanuel Farias',
  'Flávia Leal',
].map((nome, indice) => ({
  id: `aluno-h-${indice + 1}`,
  nome,
  matricula: String(2026101 + indice),
}))

const alunosFisica: Student[] = [
  'Aline Portela',
  'Breno Cavalcante',
  'Clarice Dutra',
  'Danilo Assis',
  'Estela Marques',
  'Fabrício Neves',
  'Giovanni Salles',
  'Heloísa Xavier',
  'Ivan Bezerra',
  'Jéssica Paiva',
  'Kevin Rodrigues',
  'Lorena Brito',
  'Murilo Fagundes',
  'Nicole Serrano',
  'Otto Bernardes',
  'Priscila Camargo',
  'Renan Guimarães',
  'Sofia Estrela',
  'Tomás Vilela',
  'Valentina Rezende',
  'Wesley Pontes',
  'Zilda Marinho',
  'André Lacerda',
  'Bárbara Fialho',
  'César Aranha',
].map((nome, indice) => ({
  id: `aluno-f-${indice + 1}`,
  nome,
  matricula: String(2026201 + indice),
}))

const alunosMatematica2: Student[] = [
  'Alexandre Vilar',
  'Bruna Sanches',
  'Caio Ferreira',
  'Denise Macedo',
  'Emerson Rocha',
  'Fabiana Cordeiro',
  'Gustavo Pinheiro',
  'Heloá Bittencourt',
  'Ismael Drummond',
  'Joana Vasques',
  'Kelly Andrade',
  'Leandro Bastos',
  'Melissa Chaves',
  'Norberto Fialho',
  'Olga Trindade',
  'Paulo Sérgio Mota',
  'Raíssa Bezerra',
  'Sérgio Lombardi',
  'Talita Ferrari',
  'Uriel Santana',
  'Verônica Aquino',
  'Wanderson Lobo',
  'Yuri Salgado',
  'Zuleica Maciel',
  'Adriano Borges',
  'Bruna Valadares',
  'Célia Tavares',
  'Diogo Rangel',
  'Elaine Botelho',
  'Fernando Quintela',
].map((nome, indice) => ({
  id: `aluno-m2-${indice + 1}`,
  nome,
  matricula: String(2026301 + indice),
}))

export const turmas: Class[] = [
  {
    id: 'turma-1',
    nome: 'Matemática — 1º Ano',
    disciplina: 'Matemática',
    ano: '1º Ano',
    turno: 'Manhã',
    alunos: alunosMatematica,
  },
  {
    id: 'turma-2',
    nome: 'História — 2º Ano',
    disciplina: 'História',
    ano: '2º Ano',
    turno: 'Tarde',
    alunos: alunosHistoria,
  },
  {
    id: 'turma-3',
    nome: 'Física — 2º Ano',
    disciplina: 'Física',
    ano: '2º Ano',
    turno: 'Manhã',
    alunos: alunosFisica,
  },
  {
    id: 'turma-4',
    nome: 'Matemática — 2º Ano',
    disciplina: 'Matemática',
    ano: '2º Ano',
    turno: 'Tarde',
    alunos: alunosMatematica2,
  },
]

/** Turma usada como exemplo principal nos mockups (32 alunos). */
export const turmaExemplo = turmas[0]

/** Aluna usada como exemplo nos mockups de correção e relatório. */
export const alunaExemplo = alunosMatematica[0]

export function buscarTurmaPorId(id: string): Class | undefined {
  return turmas.find((turma) => turma.id === id)
}

export function buscarAlunoPorId(id: string): Student | undefined {
  for (const turma of turmas) {
    const aluno = turma.alunos.find((item) => item.id === id)
    if (aluno) return aluno
  }
  return undefined
}
