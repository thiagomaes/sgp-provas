/**
 * Leitura das bolinhas do cartão-resposta numa foto (RF08, T08), toda no
 * navegador e sem biblioteca de visão computacional. Segue as seções 10 e 12
 * de docs/arquitetura/cartao-resposta.md:
 *
 * 1. tons de cinza e binarização com limiar adaptativo (média local), para
 *    aguentar luz desigual;
 * 2. as 4 marcas quadradas dos cantos, entre as regiões escuras da foto;
 * 3. a homografia de mm do cartão para pixels da foto, com o lado de cima dado
 *    pelo QR Code (o cartão pode estar girado 90, 180 ou 270 graus);
 * 4. o preenchimento de cada bolinha num círculo de raio 2,4 mm, com o preto
 *    medido nas marcas e o branco no anel em volta de cada bolinha;
 * 5. as regras de marcada, em branco e anulada.
 *
 * Funções puras: usadas pela tela de escanear e pelos testes.
 */
import type { OptionLetter, PrintedQuestion } from '../types'
import {
  CENTRO_DO_QR_CODE,
  CENTROS_DAS_MARCAS,
  centroDaBolinha,
  GRADE,
  MARCA_LADO_MM,
  QR_CODE,
  type Ponto,
} from './medidas-cartao.ts'
import { LETRAS_IMPRESSAS } from './respostas.ts'

/** O que a leitura usa de um ImageData: RGBA, 4 bytes por pixel. */
export interface Imagem {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

export type QuestaoParaLer = Pick<PrintedQuestion, 'ordem' | 'questaoId' | 'tipo' | 'alternativas'>

export type EstadoDaQuestao = 'marcada' | 'em-branco' | 'anulada'

export interface QuestaoLida {
  questaoId: string
  ordem: number
  estado: EstadoDaQuestao
  /** Letra impressa marcada; null em branco ou anulada. */
  letra: OptionLetter | null
  /** Por que foi anulada: duas bolinhas pintadas ou uma marcação fraca demais. */
  motivo: 'mais-de-uma' | 'duvidosa' | null
  /** De 0 a 1: quanto o preenchimento ficou longe dos limites das regras. */
  confianca: number
  /** Preenchimento de cada bolinha impressa, de 0 a 1, já descontado o papel. */
  preenchimentos: number[]
}

export type FalhaDaLeitura = 'marcas' | 'resolucao' | 'contraste'

export type ResultadoDoCartao =
  | {
      ok: true
      questoes: QuestaoLida[]
      /** Matriz 3x3 (por linhas) de mm do cartão para pixels da foto. */
      homografia: number[]
      pixelsPorMm: number
    }
  | { ok: false; falha: FalhaDaLeitura; mensagem: string }

export const MENSAGEM_DA_FALHA: Record<FalhaDaLeitura, string> = {
  marcas: 'Enquadre o cartão inteiro, com os 4 quadrados pretos',
  resolucao: 'Aproxime o celular: o cartão ficou pequeno na foto',
  contraste: 'Falta luz: os quadrados pretos não se destacam do papel',
}

/** Regras da seção 10. */
export const LIMITE_MARCADA = 0.5
export const DIFERENCA_MINIMA = 0.2

/** Raios da seção 12, em mm. */
const RAIO_DE_MEDIDA = 2.4
const ANEL_INTERNO = 3.5
const ANEL_EXTERNO = 4.3
/** Busca do contorno quando a bolinha sai do lugar esperado (seção 10, tolerâncias). */
const BUSCA_MAXIMA = 1.5
const PASSO_DA_BUSCA = 0.3

/** Lado maior da imagem trabalhada: fotos maiores são reduzidas antes. */
const LADO_MAXIMO = 2000
const MINIMO_PIXELS_POR_MM = 2.5

// ---------------------------------------------------------------- imagem

interface Cinza {
  valores: Uint8Array
  largura: number
  altura: number
  /** Pixels da foto original por pixel desta imagem. */
  reducao: number
}

/** Luminosidade de cada pixel, com a foto reduzida por média de blocos. */
export function tonsDeCinza(imagem: Imagem, ladoMaximo = LADO_MAXIMO): Cinza {
  const reducao = Math.max(1, Math.ceil(Math.max(imagem.width, imagem.height) / ladoMaximo))
  const largura = Math.floor(imagem.width / reducao)
  const altura = Math.floor(imagem.height / reducao)
  const valores = new Uint8Array(largura * altura)
  const porBloco = reducao * reducao
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let soma = 0
      for (let dy = 0; dy < reducao; dy++) {
        let i = ((y * reducao + dy) * imagem.width + x * reducao) * 4
        for (let dx = 0; dx < reducao; dx++, i += 4) {
          soma += 0.299 * imagem.data[i] + 0.587 * imagem.data[i + 1] + 0.114 * imagem.data[i + 2]
        }
      }
      valores[y * largura + x] = Math.round(soma / porBloco)
    }
  }
  return { valores, largura, altura, reducao }
}

/**
 * Escuro é o pixel 25% abaixo da média da vizinhança (janela de 1/8 do lado
 * menor, maior que uma marca). Uma sombra suave muda a média junto com o pixel.
 */
export function binarizar(cinza: Cinza): Uint8Array {
  const { valores, largura, altura } = cinza
  const integral = new Float64Array((largura + 1) * (altura + 1))
  for (let y = 0; y < altura; y++) {
    let linha = 0
    for (let x = 0; x < largura; x++) {
      linha += valores[y * largura + x]
      integral[(y + 1) * (largura + 1) + x + 1] = integral[y * (largura + 1) + x + 1] + linha
    }
  }
  const raio = Math.max(8, Math.round(Math.min(largura, altura) / 16))
  const escuro = new Uint8Array(largura * altura)
  for (let y = 0; y < altura; y++) {
    const y0 = Math.max(0, y - raio)
    const y1 = Math.min(altura, y + raio + 1)
    for (let x = 0; x < largura; x++) {
      const x0 = Math.max(0, x - raio)
      const x1 = Math.min(largura, x + raio + 1)
      const soma =
        integral[y1 * (largura + 1) + x1] -
        integral[y0 * (largura + 1) + x1] -
        integral[y1 * (largura + 1) + x0] +
        integral[y0 * (largura + 1) + x0]
      const media = soma / ((x1 - x0) * (y1 - y0))
      if (valores[y * largura + x] < media * 0.75) escuro[y * largura + x] = 1
    }
  }
  return escuro
}

// ---------------------------------------------------------------- marcas

interface Regiao {
  area: number
  centro: Ponto
}

/** Regiões escuras (vizinhança de 4) cheias e quase quadradas, candidatas a marca. */
export function regioesQuadradas(escuro: Uint8Array, largura: number, altura: number): Regiao[] {
  const total = largura * altura
  const areaMinima = Math.max(30, total * 0.00004)
  const areaMaxima = total * 0.01
  const visitado = new Uint8Array(total)
  const pilha = new Int32Array(total)
  const regioes: Regiao[] = []

  for (let inicio = 0; inicio < total; inicio++) {
    if (!escuro[inicio] || visitado[inicio]) continue
    let topo = 0
    pilha[topo++] = inicio
    visitado[inicio] = 1
    let area = 0
    let somaX = 0
    let somaY = 0
    let xMin = largura
    let xMax = 0
    let yMin = altura
    let yMax = 0
    while (topo > 0) {
      const i = pilha[--topo]
      const x = i % largura
      const y = (i - x) / largura
      area++
      somaX += x
      somaY += y
      if (x < xMin) xMin = x
      if (x > xMax) xMax = x
      if (y < yMin) yMin = y
      if (y > yMax) yMax = y
      if (x > 0 && escuro[i - 1] && !visitado[i - 1]) { visitado[i - 1] = 1; pilha[topo++] = i - 1 }
      if (x < largura - 1 && escuro[i + 1] && !visitado[i + 1]) { visitado[i + 1] = 1; pilha[topo++] = i + 1 }
      if (y > 0 && escuro[i - largura] && !visitado[i - largura]) { visitado[i - largura] = 1; pilha[topo++] = i - largura }
      if (y < altura - 1 && escuro[i + largura] && !visitado[i + largura]) { visitado[i + largura] = 1; pilha[topo++] = i + largura }
    }

    if (area < areaMinima || area > areaMaxima) continue
    if (xMin === 0 || yMin === 0 || xMax === largura - 1 || yMax === altura - 1) continue
    const larguraCaixa = xMax - xMin + 1
    const alturaCaixa = yMax - yMin + 1
    const proporcao = larguraCaixa / alturaCaixa
    // Um quadrado girado 15 graus ainda enche 67% da caixa; o anel do QR Code, menos de 50%.
    if (proporcao < 0.5 || proporcao > 2 || area / (larguraCaixa * alturaCaixa) < 0.6) continue
    regioes.push({ area, centro: { x: somaX / area, y: somaY / area } })
  }
  return regioes
}

function areaDoPoligono(pontos: Ponto[]): number {
  let soma = 0
  for (let i = 0; i < pontos.length; i++) {
    const a = pontos[i]
    const b = pontos[(i + 1) % pontos.length]
    soma += a.x * b.y - b.x * a.y
  }
  return Math.abs(soma) / 2
}

function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Ordena os pontos em volta do centro deles: sentido horário na tela (y para baixo). */
function emSentidoHorario(pontos: Ponto[]): Ponto[] {
  const cx = pontos.reduce((soma, p) => soma + p.x, 0) / pontos.length
  const cy = pontos.reduce((soma, p) => soma + p.y, 0) / pontos.length
  return [...pontos].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
}

function convexo(pontos: Ponto[]): boolean {
  let sinal = 0
  for (let i = 0; i < 4; i++) {
    const a = pontos[i]
    const b = pontos[(i + 1) % 4]
    const c = pontos[(i + 2) % 4]
    const giro = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    if (giro === 0) return false
    if (sinal === 0) sinal = Math.sign(giro)
    else if (Math.sign(giro) !== sinal) return false
  }
  return true
}

/**
 * Escolhe as 4 regiões que formam o retângulo das marcas: áreas parecidas,
 * quadrilátero convexo, lados na proporção do cartão e marcas do tamanho certo
 * para esse quadrilátero. Entre as combinações válidas, a de maior área total.
 */
export function acharMarcas(regioes: Regiao[]): Ponto[] | null {
  const maiores = [...regioes].sort((a, b) => b.area - a.area).slice(0, 12)
  let melhor: { pontos: Ponto[]; area: number } | null = null
  const n = maiores.length
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        for (let d = c + 1; d < n; d++) {
          const grupo = [maiores[a], maiores[b], maiores[c], maiores[d]]
          const areas = grupo.map((regiao) => regiao.area)
          if (Math.max(...areas) / Math.min(...areas) > 2.5) continue
          const pontos = emSentidoHorario(grupo.map((regiao) => regiao.centro))
          if (!convexo(pontos)) continue
          const lados = [0, 1, 2, 3].map((i) => distancia(pontos[i], pontos[(i + 1) % 4]))
          const par = (lados[0] + lados[2]) / 2
          const impar = (lados[1] + lados[3]) / 2
          const proporcao = Math.min(par, impar) / Math.max(par, impar)
          if (proporcao < 0.45 || proporcao > 0.95) continue
          // Marca de 10 x 10 mm num retângulo de 180 x 267 mm: 0,21% da área.
          const mediaDasMarcas = areas.reduce((soma, area) => soma + area, 0) / 4
          const fracao = mediaDasMarcas / areaDoPoligono(pontos)
          if (fracao < 0.0008 || fracao > 0.006) continue
          const total = areas.reduce((soma, area) => soma + area, 0)
          if (!melhor || total > melhor.area) melhor = { pontos, area: total }
        }
      }
    }
  }
  return melhor?.pontos ?? null
}

// ---------------------------------------------------------------- homografia

/** Homografia que leva cada ponto de `origem` ao ponto de mesmo índice em `destino`. */
export function calcularHomografia(origem: readonly Ponto[], destino: readonly Ponto[]): number[] {
  // Sistema 8x8 para h0..h7, com h8 = 1.
  const linhas: number[][] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = origem[i]
    const { x: u, y: v } = destino[i]
    linhas.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    linhas.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  for (let coluna = 0; coluna < 8; coluna++) {
    let pivo = coluna
    for (let linha = coluna + 1; linha < 8; linha++) {
      if (Math.abs(linhas[linha][coluna]) > Math.abs(linhas[pivo][coluna])) pivo = linha
    }
    ;[linhas[coluna], linhas[pivo]] = [linhas[pivo], linhas[coluna]]
    const valor = linhas[coluna][coluna]
    if (Math.abs(valor) < 1e-12) throw new Error('Pontos alinhados: não há homografia.')
    for (let k = coluna; k < 9; k++) linhas[coluna][k] /= valor
    for (let linha = 0; linha < 8; linha++) {
      if (linha === coluna) continue
      const fator = linhas[linha][coluna]
      if (fator === 0) continue
      for (let k = coluna; k < 9; k++) linhas[linha][k] -= fator * linhas[coluna][k]
    }
  }
  return [...linhas.map((linha) => linha[8]), 1]
}

export function aplicarHomografia(h: readonly number[], p: Ponto): Ponto {
  const w = h[6] * p.x + h[7] * p.y + h[8]
  return { x: (h[0] * p.x + h[1] * p.y + h[2]) / w, y: (h[3] * p.x + h[4] * p.y + h[5]) / w }
}

// ---------------------------------------------------------------- amostras

/** Luminosidade no ponto, com interpolação bilinear; fora da imagem é branco. */
function amostrar(cinza: Cinza, p: Ponto): number {
  const { valores, largura, altura } = cinza
  const x = p.x - 0.5
  const y = p.y - 0.5
  if (x < 0 || y < 0 || x >= largura - 1 || y >= altura - 1) return 255
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const i = y0 * largura + x0
  const cima = valores[i] * (1 - fx) + valores[i + 1] * fx
  const baixo = valores[i + largura] * (1 - fx) + valores[i + largura + 1] * fx
  return cima * (1 - fy) + baixo * fy
}

function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2
}

/** Pontos de um círculo cheio de raio r (mm), numa grade de 0,25 mm. */
function pontosDoCirculo(raio: number): Ponto[] {
  const pontos: Ponto[] = []
  for (let y = -raio; y <= raio + 1e-9; y += 0.25) {
    for (let x = -raio; x <= raio + 1e-9; x += 0.25) {
      if (x * x + y * y <= raio * raio) pontos.push({ x, y })
    }
  }
  return pontos
}

function pontosDoAnel(raios: number[], quantos: number): Ponto[] {
  return raios.flatMap((raio) =>
    Array.from({ length: quantos }, (_, i) => {
      const angulo = (2 * Math.PI * i) / quantos
      return { x: raio * Math.cos(angulo), y: raio * Math.sin(angulo) }
    }),
  )
}

const DISCO = pontosDoCirculo(RAIO_DE_MEDIDA)
const ANEL_DO_BRANCO = pontosDoAnel([ANEL_INTERNO, (ANEL_INTERNO + ANEL_EXTERNO) / 2, ANEL_EXTERNO], 48)
const CONTORNO = pontosDoAnel([GRADE.raioBolinha], 36)
const FORA_DO_CONTORNO = pontosDoAnel([4.2], 36)

function amostrasEm(cinza: Cinza, h: number[], centro: Ponto, pontos: Ponto[]): number[] {
  return pontos.map((p) => amostrar(cinza, aplicarHomografia(h, { x: centro.x + p.x, y: centro.y + p.y })))
}

/**
 * Corrige o centro da bolinha procurando o contorno a até 1,5 mm do lugar
 * esperado: vale onde o círculo de 3 mm fica mais escuro que o anel de fora.
 */
function centroAjustado(cinza: Cinza, h: number[], esperado: Ponto, preto: number, branco: number): Ponto {
  const escuridao = (valores: number[]) =>
    valores.reduce((soma, valor) => soma + Math.min(1, Math.max(0, (branco - valor) / (branco - preto))), 0) /
    valores.length
  let melhor = esperado
  let melhorNota = -Infinity
  for (let dy = -BUSCA_MAXIMA; dy <= BUSCA_MAXIMA + 1e-9; dy += PASSO_DA_BUSCA) {
    for (let dx = -BUSCA_MAXIMA; dx <= BUSCA_MAXIMA + 1e-9; dx += PASSO_DA_BUSCA) {
      const centro = { x: esperado.x + dx, y: esperado.y + dy }
      const nota =
        escuridao(amostrasEm(cinza, h, centro, CONTORNO)) -
        escuridao(amostrasEm(cinza, h, centro, FORA_DO_CONTORNO)) -
        0.02 * Math.hypot(dx, dy)
      if (nota > melhorNota) {
        melhorNota = nota
        melhor = centro
      }
    }
  }
  return melhor
}

/** Fração de pixels mais escuros que (P + B) / 2 no círculo de 2,4 mm (seção 12). */
function preenchimentoBruto(cinza: Cinza, h: number[], esperado: Ponto, preto: number): number {
  const brancoPerto = mediana(amostrasEm(cinza, h, esperado, ANEL_DO_BRANCO))
  const centro = centroAjustado(cinza, h, esperado, preto, brancoPerto)
  const branco = mediana(amostrasEm(cinza, h, centro, ANEL_DO_BRANCO))
  const corte = (preto + branco) / 2
  const disco = amostrasEm(cinza, h, centro, DISCO)
  return disco.filter((valor) => valor < corte).length / disco.length
}

// ---------------------------------------------------------------- regras

/** Regras da seção 10 para uma linha, com os preenchimentos já calibrados. */
export function classificarLinha(preenchimentos: number[]): Pick<QuestaoLida, 'estado' | 'letra' | 'motivo' | 'confianca'> {
  const ordem = preenchimentos.map((valor, indice) => ({ valor, indice })).sort((a, b) => b.valor - a.valor)
  const primeira = ordem[0]?.valor ?? 0
  const segunda = ordem[1]?.valor ?? 0
  const diferenca = primeira - segunda
  const confianca = (margem: number) => Math.round(Math.min(1, Math.max(0, margem / 0.3)) * 100) / 100

  if (primeira < LIMITE_MARCADA) {
    return { estado: 'em-branco', letra: null, motivo: null, confianca: confianca(LIMITE_MARCADA - primeira) }
  }
  if (diferenca >= DIFERENCA_MINIMA) {
    return {
      estado: 'marcada',
      letra: LETRAS_IMPRESSAS[ordem[0].indice],
      motivo: null,
      confianca: confianca(Math.min(primeira - LIMITE_MARCADA, diferenca - DIFERENCA_MINIMA)),
    }
  }
  if (segunda >= LIMITE_MARCADA) {
    return {
      estado: 'anulada',
      letra: null,
      motivo: 'mais-de-uma',
      confianca: confianca(Math.min(segunda - LIMITE_MARCADA, DIFERENCA_MINIMA - diferenca)),
    }
  }
  return {
    estado: 'anulada',
    letra: null,
    motivo: 'duvidosa',
    confianca: confianca(Math.min(primeira - LIMITE_MARCADA, DIFERENCA_MINIMA - diferenca)),
  }
}

// ---------------------------------------------------------------- leitura

export interface OpcoesDaLeitura {
  /** Centro do QR Code na foto, em pixels da foto (o leitor de QR Code devolve os cantos). */
  centroDoQr?: Ponto | null
}

/**
 * Das 4 formas de casar as marcas achadas com as do cartão, fica a que põe o
 * lado de 180 mm na horizontal do cartão e o QR Code no canto certo: perto do
 * QR Code lido ou, sem ele, na região mais escura onde o QR Code deveria estar.
 */
function orientar(cinza: Cinza, marcas: Ponto[], centroDoQr: Ponto | null): number[] {
  const opcoes = [0, 1, 2, 3].map((giro) => {
    const destino = [0, 1, 2, 3].map((i) => marcas[(i + giro) % 4])
    const h = calcularHomografia(CENTROS_DAS_MARCAS, destino)
    const horizontal = distancia(destino[0], destino[1]) + distancia(destino[3], destino[2])
    const vertical = distancia(destino[1], destino[2]) + distancia(destino[0], destino[3])
    return { h, emPe: horizontal < vertical }
  })
  const emPe = opcoes.filter((opcao) => opcao.emPe)
  const candidatas = emPe.length ? emPe : opcoes

  const nota = (h: number[]) => {
    if (centroDoQr) return -distancia(aplicarHomografia(h, CENTRO_DO_QR_CODE), centroDoQr)
    const pontos: Ponto[] = []
    for (let y = QR_CODE.y + 1; y < QR_CODE.y + QR_CODE.lado; y += 1.5) {
      for (let x = QR_CODE.x + 1; x < QR_CODE.x + QR_CODE.lado; x += 1.5) pontos.push({ x, y })
    }
    return -pontos.reduce((soma, p) => soma + amostrar(cinza, aplicarHomografia(h, p)), 0) / pontos.length
  }
  return candidatas.reduce((melhor, opcao) => (nota(opcao.h) > nota(melhor.h) ? opcao : melhor)).h
}

/** Lê as marcações do cartão na foto, só nas questões objetivas da versão. */
export function lerCartao(imagem: Imagem, questoes: QuestaoParaLer[], opcoes: OpcoesDaLeitura = {}): ResultadoDoCartao {
  const cinza = tonsDeCinza(imagem)
  const escuro = binarizar(cinza)
  const marcas = acharMarcas(regioesQuadradas(escuro, cinza.largura, cinza.altura))
  if (!marcas) return { ok: false, falha: 'marcas', mensagem: MENSAGEM_DA_FALHA.marcas }

  const centroDoQr = opcoes.centroDoQr
    ? { x: opcoes.centroDoQr.x / cinza.reducao, y: opcoes.centroDoQr.y / cinza.reducao }
    : null
  const h = orientar(cinza, marcas, centroDoQr)

  const [se, sd, id, ie] = CENTROS_DAS_MARCAS.map((p) => aplicarHomografia(h, p))
  const pixelsPorMm = Math.min(
    (distancia(se, sd) + distancia(ie, id)) / 2 / 180,
    (distancia(se, ie) + distancia(sd, id)) / 2 / 267,
  )
  if (pixelsPorMm < MINIMO_PIXELS_POR_MM) {
    return { ok: false, falha: 'resolucao', mensagem: MENSAGEM_DA_FALHA.resolucao }
  }

  // Preto: mediana do miolo das 4 marcas.
  const miolo: Ponto[] = []
  for (let y = -3; y <= 3; y += 1.5) for (let x = -3; x <= 3; x += 1.5) miolo.push({ x, y })
  const preto = mediana(CENTROS_DAS_MARCAS.flatMap((centro) => amostrasEm(cinza, h, centro, miolo)))
  const papel = mediana(amostrasEm(cinza, h, { x: 105, y: 235 }, pontosDoCirculo(MARCA_LADO_MM)))
  if (papel - preto < 40) return { ok: false, falha: 'contraste', mensagem: MENSAGEM_DA_FALHA.contraste }

  const objetivas = questoes.filter(
    (questao) => questao.tipo === 'objetiva' && questao.ordem >= 1 && questao.ordem <= GRADE.maximoDeQuestoes,
  )
  const brutos = objetivas.map((questao) =>
    questao.alternativas
      .slice(0, GRADE.maximoDeAlternativas)
      .map((_, indice) => preenchimentoBruto(cinza, h, centroDaBolinha(questao.ordem, indice), preto)),
  )

  // Calibração do cartão: a média do quarto mais claro das bolinhas é o "vazio"
  // (a letra cinza, o contorno e o ruído da foto), descontado de todas.
  const todos = brutos.flat().sort((a, b) => a - b)
  const claras = todos.slice(0, Math.max(1, Math.floor(todos.length / 4)))
  const vazio = Math.min(0.3, claras.reduce((soma, valor) => soma + valor, 0) / claras.length || 0)
  const calibrar = (valor: number) => Math.round(Math.max(0, (valor - vazio) / (1 - vazio)) * 1000) / 1000

  const lidas = objetivas.map((questao, i) => {
    const preenchimentos = brutos[i].map(calibrar)
    return { questaoId: questao.questaoId, ordem: questao.ordem, ...classificarLinha(preenchimentos), preenchimentos }
  })

  const r = cinza.reducao
  const naFoto = [h[0] * r, h[1] * r, h[2] * r, h[3] * r, h[4] * r, h[5] * r, h[6], h[7], h[8]]
  return { ok: true, questoes: lidas, homografia: naFoto, pixelsPorMm: pixelsPorMm * r }
}

/** Retângulo do cartão, em mm. */
export interface Recorte {
  x: number
  y: number
  largura: number
  altura: number
}

/**
 * Trecho do cartão endireitado a partir da foto, em `pixelsPorMm` (miniatura da
 * revisão). Devolve RGBA, pronto para um ImageData.
 */
export function endireitarCartao(
  imagem: Imagem,
  homografia: number[],
  pixelsPorMm: number,
  recorte: Recorte = { x: 0, y: 0, largura: 210, altura: 297 },
): Imagem {
  const largura = Math.round(recorte.largura * pixelsPorMm)
  const altura = Math.round(recorte.altura * pixelsPorMm)
  const data = new Uint8ClampedArray(largura * altura * 4)
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const p = aplicarHomografia(homografia, {
        x: recorte.x + (x + 0.5) / pixelsPorMm,
        y: recorte.y + (y + 0.5) / pixelsPorMm,
      })
      const fx = Math.floor(p.x)
      const fy = Math.floor(p.y)
      const destino = (y * largura + x) * 4
      if (fx < 0 || fy < 0 || fx >= imagem.width || fy >= imagem.height) {
        data.fill(255, destino, destino + 4)
        continue
      }
      const origem = (fy * imagem.width + fx) * 4
      data[destino] = imagem.data[origem]
      data[destino + 1] = imagem.data[origem + 1]
      data[destino + 2] = imagem.data[origem + 2]
      data[destino + 3] = 255
    }
  }
  return { data, width: largura, height: altura }
}
