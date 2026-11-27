# Fotos de teste da leitura do cartão

Imagens em tons de cinza usadas por `leitura-cartao.test.ts` (`npm test`). A leitura
só usa a luminosidade, então o cinza basta e deixa os arquivos pequenos.

| Arquivo | O que é |
|---|---|
| `exemplo.png` | `docs/arquitetura/cartao-resposta-exemplo-preenchido.svg` a 4 px por mm |
| `exemplo-180.png` | o mesmo, de cabeça para baixo |
| `exemplo-inclinado.png` | foto sobre uma mesa, com perspectiva (CSS 3D) e giro de 8 graus |
| `exemplo-escuro.png` | mais escuro, com a luz caindo para a esquerda e uma sombra redonda |
| `exemplo-ruido-90.png` | com ruído, girado 90 graus e a 3 px por mm |
| `cartao-pdf.png` | cartão da versão 2 de um PDF real da rota `GET /applications/:id/pdf`, com bolinhas pintadas por código |
| `cartao-pdf-270.png` | o mesmo cartão girado 270 graus, com perspectiva, mais escuro e desfocado |
| `cartao-pdf.json` | leitura esperada do cartão do PDF, o conteúdo do QR Code e o centro dele em cada foto (lido com o jsQR) |

As cinco primeiras saem de `gerar-fixtures.mjs`, que precisa do Playwright (não é
dependência do projeto):

```
NODE_PATH=<pasta node_modules com o playwright> node src/correcao/__fixtures__/gerar-fixtures.mjs
```

O cartão do PDF veio de uma aplicação de teste com 5 questões, criada pela API local:
3 objetivas de 4 alternativas, uma de 3 (questão 2) e uma discursiva (questão 4), com
as alternativas embaralhadas. A página do cartão foi renderizada com o pdf.js e, por
código, recebeu estas marcações:

| Questão | Pintado | Leitura esperada |
|---|---|---|
| 1 | C em azul, com 5 falhas brancas de caneta | C |
| 2 | A em preto (questão de 3 alternativas) | A |
| 3 | B em azul e D em preto | anulada |
| 4 | nada (discursiva, não é medida) | |
| 5 | B rabiscada e apagada (cinza claro) e D em azul, com 3 falhas | D |
