// Gera as fotos de teste da leitura do cartão a partir do exemplo preenchido
// (docs/arquitetura/cartao-resposta-exemplo-preenchido.svg), a 4 px por mm.
// Precisa do Playwright com o Chrome, que não é dependência do projeto:
//
//   NODE_PATH=<pasta node_modules com o playwright> node src/correcao/__fixtures__/gerar-fixtures.mjs
//
// O cartão do PDF real (cartao-pdf-*.png) é gerado à parte: ver o README.md.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { gravarPngCinza, lerPng } from './png.ts'

const { chromium } = createRequire(import.meta.url)('playwright')
const pasta = new URL('./', import.meta.url)
const svg = readFileSync(new URL('../../../../../docs/arquitetura/cartao-resposta-exemplo-preenchido.svg', import.meta.url))
const fonte = `data:image/svg+xml;base64,${svg.toString('base64')}`

/** Números pseudoaleatórios repetíveis (mulberry32). */
function sorteio(semente) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function transformar(imagem, largura, altura, origemDe, cor) {
  const data = new Uint8ClampedArray(largura * altura * 4)
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const [ox, oy] = origemDe(x, y)
      const i = (oy * imagem.width + ox) * 4
      const d = (y * largura + x) * 4
      const valor = cor(imagem.data[i], x, y)
      data[d] = data[d + 1] = data[d + 2] = valor
      data[d + 3] = 255
    }
  }
  return { data, width: largura, height: altura }
}

function salvar(nome, imagem) {
  const png = gravarPngCinza(imagem)
  writeFileSync(new URL(nome, pasta), png)
  console.log(nome, `${imagem.width}x${imagem.height}`, `${Math.round(png.length / 1024)} KB`)
}

const navegador = await chromium.launch({ channel: 'chrome' })
const pagina = await navegador.newPage({ viewport: { width: 840, height: 1188 } })
await pagina.setContent(`<body style="margin:0;background:#fff"><img src="${fonte}" style="display:block;width:840px;height:1188px"></body>`)
await pagina.waitForTimeout(300)
const base = lerPng(await pagina.screenshot())
const { width: w, height: h } = base

// 1. O cartão reto, como saiu do SVG.
salvar('exemplo.png', transformar(base, w, h, (x, y) => [x, y], (v) => v))

// 2. De cabeça para baixo.
salvar('exemplo-180.png', transformar(base, w, h, (x, y) => [w - 1 - x, h - 1 - y], (v) => v))

// 3. Foto inclinada sobre uma mesa: perspectiva e giro de 8 graus, pelo CSS 3D.
await pagina.setViewportSize({ width: 1100, height: 1400 })
await pagina.setContent(`<body style="margin:0;background:#6a6155;display:flex;align-items:center;justify-content:center;height:1400px">
  <img src="${fonte}" style="width:840px;height:1188px;transform:perspective(1800px) rotateX(20deg) rotateY(-10deg) rotateZ(8deg)"></body>`)
await pagina.waitForTimeout(300)
const inclinada = lerPng(await pagina.screenshot())
salvar('exemplo-inclinado.png', transformar(inclinada, inclinada.width, inclinada.height, (x, y) => [x, y], (v) => v))

// 4. Mais escuro e com luz desigual: escurece para a esquerda, com uma sombra redonda.
salvar(
  'exemplo-escuro.png',
  transformar(base, w, h, (x, y) => [x, y], (v, x, y) => {
    const sombra = Math.exp(-((x - 0.7 * w) ** 2 + (y - 0.45 * h) ** 2) / (2 * (0.18 * w) ** 2))
    return 25 + v * (0.35 + 0.45 * (x / w)) * (1 - 0.3 * sombra)
  }),
)

// 5. Com ruído, girado 90 graus no sentido horário e a 3 px por mm (foto de
// resolução mais baixa). O ruído sai em degraus de 12 para o arquivo ficar pequeno.
const aleatorio = sorteio(65)
const ruido = () => Math.sqrt(-2 * Math.log(1 - aleatorio())) * Math.cos(2 * Math.PI * aleatorio())
const [w3, h3] = [Math.round((w * 3) / 4), Math.round((h * 3) / 4)]
salvar(
  'exemplo-ruido-90.png',
  transformar(
    base,
    h3,
    w3,
    (x, y) => [Math.floor((y * 4) / 3), Math.floor(((h3 - 1 - x) * 4) / 3)],
    (v) => Math.round((10 + 0.85 * v + 18 * ruido()) / 12) * 12,
  ),
)

await navegador.close()
