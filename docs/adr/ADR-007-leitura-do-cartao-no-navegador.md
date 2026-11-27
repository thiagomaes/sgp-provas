# ADR-007: Leitura do cartão no navegador, sem servidor e sem OpenCV

- **Status:** aceita
- **Data:** 27/11/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

O RF08 pede que a câmera do celular leia o cartão-resposta e calcule a nota: o
QR Code diz a versão (e, na prova identificada, o aluno), e as bolinhas pintadas
dizem as respostas. A correção é uma tela da própria web, aberta no navegador do
celular ([ADR-001](ADR-001-web-responsiva-no-lugar-de-app-nativo.md)).

As restrições:

- **Offline:** o RF10 e o RNF06 pedem que a correção funcione sem internet. Uma
  leitura que depende do servidor para cada foto não atende isso.
- **A API é uma função serverless na Vercel**
  ([ADR-004](ADR-004-hospedagem-vercel-e-aiven.md)): sem biblioteca nativa de
  visão, com limite de tamanho de requisição e cobrando o tempo de cada chamada.
- **O cartão foi desenhado para ser lido:** a T02 definiu quatro marcas pretas
  de 10 mm nos cantos, o QR Code numa posição fixa e a grade de bolinhas em
  coordenadas em mm ([`cartao-resposta.md`](../arquitetura/cartao-resposta.md)).
  Com isso, não é preciso "achar" as bolinhas na foto: basta saber onde o
  cartão está.
- **Celular comum:** a leitura tem de ser rápida num aparelho intermediário e
  aguentar foto torta, inclinada, de cabeça para baixo e com luz desigual.

## Decisão

A leitura roda **toda no navegador**, em TypeScript, sem servidor e sem
biblioteca de visão computacional. O QR Code é lido pelo `BarcodeDetector` do
navegador ou, onde ele não existe (o iPhone, por exemplo), pelo `jsQR`. As
bolinhas são lidas por código próprio, em funções puras
(`apps/web-professor/src/correcao/leitura-cartao.ts`).

Na prática, conferido no código:

1. **Foto:** depois do QR Code válido, a tela tira uma foto na resolução máxima
   do sensor (`ImageCapture.takePhoto`, sem flash, onde o navegador deixa). Se
   ela não for lida, tenta os quadros do vídeo por até 2 segundos.
2. **Binarização adaptativa:** a foto vai para tons de cinza (reduzida a até
   2000 px no lado maior). Um pixel é escuro quando está 25% abaixo da média da
   vizinhança, o que aguenta sombra e luz desigual.
3. **Marcas:** entre as regiões escuras cheias e quase quadradas, ficam as 4 que
   formam o retângulo das marcas: áreas parecidas, quadrilátero convexo, lados
   na proporção do cartão e marca do tamanho certo para aquele quadrilátero. Sem
   as 4, a tela pede para enquadrar o cartão inteiro.
4. **Homografia:** com os 4 centros, um sistema 8x8 leva as coordenadas do
   cartão (mm) para os pixels da foto. Isso corrige a perspectiva sem precisar
   endireitar a imagem inteira. O lado de cima vem do centro do QR Code lido ou,
   sem ele, da região mais escura onde o QR Code deveria estar. Por isso o
   cartão pode estar girado 90, 180 ou 270 graus.
5. **Bolinhas:** cada centro em mm é levado para a foto. O preenchimento é a
   fração de pixels escuros num círculo de 2,4 mm. O preto vem das marcas e o
   branco do anel em volta de cada bolinha. O centro é ajustado procurando o
   contorno a até 1,5 mm. A média do quarto mais claro das bolinhas é o "vazio"
   do cartão (letra cinza, contorno, ruído) e é descontada de todas.
6. **Regras:** as da seção 10 do documento do cartão. A bolinha está marcada com
   50% ou mais de preenchimento e 20 pontos acima da segunda. Nenhuma acima de
   50% é questão em branco. Duas ou mais, ou uma acima de 50% mas muito perto da
   segunda, anulam a questão. Discursivas não são medidas.
7. **Revisão:** a tela abre com as respostas lidas e a nota calculada, uma
   miniatura da grade endireitada e, em amarelo, as questões em branco, anuladas
   ou com leitura fraca (confiança abaixo de 0,4). O professor confere e
   confirma; a API recalcula a nota com o gabarito
   ([ADR-002](ADR-002-mysql-com-prisma.md)).

**Medidas compartilhadas com a API.** A web tem uma cópia das medidas do cartão
(`src/correcao/medidas-cartao.ts`), igual à da API que desenha o PDF
([ADR-006](ADR-006-pdf-na-api-com-pdf-lib.md)). Um teste importa as duas e
compara, e também compara os centros com a tabela da seção 13 do documento: se
alguém mudar uma medida de um lado só, o `npm test` da web falha.

**Plano B:** se a leitura falhar, "Tentar de novo" volta para a câmera e
"Marcar à mão" abre a revisão em branco na versão e no aluno lidos. Sem câmera,
"Escolher a versão" faz o mesmo.

## Alternativas consideradas

**OpenCV.js.** Tem tudo pronto (contornos, perspectiva, limiar adaptativo), mas
o arquivo WebAssembly tem cerca de 8 MB. No celular, isso pesa no primeiro
acesso e no cache para o uso offline, e o tempo de iniciar o módulo atrasa a
primeira leitura. O SGP usa só uma fração do OpenCV, e essa fração, com um
cartão desenhado para ser lido, cabe em poucas centenas de linhas testáveis.

**Leitura no servidor (o "Vision Service" previsto no início da N3).** O celular
mandaria a foto e a API devolveria as respostas. Isso contraria o uso sem
internet. Também põe uma foto de alguns MB em cada correção, perto dos limites
da função na Vercel, com a espera da rede em cada prova. E leva a imagem da
prova do aluno para fora do aparelho sem necessidade.

**Endireitar a foto inteira e medir na imagem nova.** O documento do cartão
sugere gerar a imagem retificada a 4 px por mm. Funciona, mas cria uma imagem
de 840 x 1188 para cada tentativa. Levar só os pontos medidos para a foto pela
homografia dá o mesmo resultado com menos trabalho. A imagem endireitada só é
gerada, pequena, para a miniatura da revisão.

**Ficar só com a marcação à mão (o fluxo da T07).** Era o plano B se a leitura
não ficasse pronta. Continua existindo como "Marcar à mão", mas sozinho não
atende o RF08.

## Consequências

**Positivas**

- **Sem internet e sem servidor:** a leitura não depende de internet nem de
  servidor, e a foto do cartão não sai do celular.
- **Leve e rápida:** nenhuma dependência nova para as bolinhas. A leitura de uma
  foto levou de 35 a 55 ms nos testes, no computador.
- **Testada no `npm test`:** a lógica é testada com imagens de exemplo: cartão
  reto, de cabeça para baixo, inclinado, escuro, com ruído e um cartão de PDF
  real com bolinhas pintadas por código (`src/correcao/__fixtures__`).
- **Documentada:** a decisão está registrada no documento do cartão, nas medidas
  compartilhadas e nos testes.

**Negativas e riscos**

- **Limites heurísticos:** os limites (25% para binarizar, 50% e 20 pontos para
  marcar, 0,4 de confiança) são os do documento do cartão e foram testados com
  imagens geradas e com a câmera falsa do Chrome. Caneta clara ou bolinha só
  riscada fica perto do limite. A revisão destaca esses casos, mas os valores
  ainda precisam de mais fotos reais para ser calibrados.
- **Escala 100%:** a leitura depende do cartão impresso em escala 100%. Impresso
  com "ajustar à página", as bolinhas saem fora do lugar esperado.
- **Duas cópias das medidas:** o teste protege, mas mudar o layout exige mexer
  nos dois apps.
- **iPhone e celulares antigos:** no iPhone não há `ImageCapture`, então a foto é
  um quadro do vídeo (até 1920 x 1080). Celulares antigos levam mais tempo por
  foto.
