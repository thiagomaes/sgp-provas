# ADR-006: PDF gerado na API com pdf-lib e qrcode

- **Status:** aceita
- **Data:** 27/11/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

O RF06 pede o PDF consolidado da aplicação: para cada versão, o caderno com as
questões na ordem sorteada e o cartão-resposta. Na N2 a aplicação já gerava as
versões embaralhadas, mas não havia PDF.

O PDF não é só um documento para imprimir. O cartão-resposta é lido depois pela
câmera do celular (RF08), então as marcas dos cantos, o QR Code e as bolinhas
precisam sair **exatamente** nas posições em milímetros de
[`docs/arquitetura/cartao-resposta.md`](../arquitetura/cartao-resposta.md), em
escala 100%. Um desvio de 1 mm já tira a bolinha do círculo que a leitura mede.

As restrições:

- **A API roda como função serverless na Vercel**
  ([ADR-004](ADR-004-hospedagem-vercel-e-aiven.md)). Não há um Chrome instalado,
  o pacote da função tem limite de tamanho e a primeira requisição já paga o
  tempo de subir a função. A resposta da função também tem limite de tamanho
  (4,5 MB).
- **O empacotamento da Vercel só leva os arquivos que o código importa.** Na T10
  isso já tinha dado problema com o certificado do Aiven, que só entrou no pacote
  quando passou a ser referenciado com `new URL(..., import.meta.url)`. Uma
  biblioteca que lê arquivos do disco em tempo de execução corre o mesmo risco.
- **O texto vem do professor:** títulos, enunciados e nomes com acento, que
  precisam sair legíveis.

## Decisão

O PDF é gerado na API, na hora do download, com duas bibliotecas só de
JavaScript: **`pdf-lib`** para o documento e **`qrcode`** para a matriz do QR
Code.

Na prática, conferido em `apps/api/src/applications/pdf`:

- **Rota:** `GET /applications/:id/pdf` monta o arquivo a partir das versões já
  gravadas (`VersaoProva.layout`) e devolve com `Content-Disposition` e o nome
  `<prova>-<turma>.pdf`. Responde 409 se as versões ainda não foram geradas. O
  PDF não é guardado: cada download gera de novo.
- **Medidas num lugar só:** `medidas-cartao.ts` tem as posições das marcas, do QR
  Code e da grade, em mm, e `unidades.ts` converte para pontos do PDF
  (1 mm = 2,8346 pt, com o y invertido). A web tem uma cópia dessas medidas para
  a leitura, comparada com esta por teste
  ([ADR-007](ADR-007-leitura-do-cartao-no-navegador.md)).
- **Tudo vetorial:** as marcas são retângulos pretos, e o QR Code é desenhado
  módulo a módulo como retângulos (nível M, sem margem, 35 x 35 mm). Nada é
  imagem redimensionada, então a impressão sai nítida em qualquer impressora.
- **Fontes padrão do PDF:** Helvetica e Helvetica Bold (`StandardFonts`), que
  não precisam de arquivo de fonte. Um caractere que essas fontes não têm vira
  `?` (`textoSeguro`), em vez de derrubar a geração.
- **Caderno sem cortar questão:** uma questão só começa numa página se couber
  inteira nela. A exceção é uma questão sozinha maior que uma folha.
- **Cartão em folha própria** depois do caderno de cada versão, sem número de
  página nem rodapé.

## Alternativas consideradas

**HTML convertido em PDF por um Chrome sem tela (Puppeteer).** O layout seria
feito em HTML e CSS, que o grupo conhece melhor. Foi descartada por três
motivos. O Chrome não existe na função da Vercel e teria de ir no pacote, com
dezenas de MB, perto do limite. A primeira geração ficaria vários segundos mais
lenta. E o CSS trabalha em pixels de tela, então acertar as marcas e as bolinhas
em milímetros exatos dependeria das margens e da escala da impressão do Chrome.

**`pdfkit` ou `pdfmake`, sugeridos no plano da N3.** Também são JavaScript.
O `pdfmake` monta o documento como um fluxo de blocos, bom para relatório, mas
ruim para posicionar cada bolinha numa coordenada fixa. O `pdfkit` posiciona por
coordenada, mas carrega as métricas das fontes padrão de arquivos `.afm` lidos
do disco, o mesmo tipo de arquivo que o empacotamento da Vercel deixa para trás.
O `pdf-lib` traz as métricas dentro do código e desenha por coordenada.

**Gerar o PDF no navegador (por exemplo, com `jsPDF`).** Tiraria o trabalho da
API, mas o layout do cartão passaria a morar na web, e a API, que guarda as
versões e calcula a nota, deixaria de ser a dona do que foi impresso. Também
deixaria a geração dependente do celular ou do computador do professor.

**Gerar uma vez e guardar o arquivo num object storage.** Economizaria a geração
a cada download, mas exigiria mais um serviço e o cuidado de apagar o arquivo
quando as versões fossem geradas de novo. Com o volume do SGP, gerar na hora é
rápido o bastante.

## Consequências

**Positivas**

- A geração roda na função da Vercel sem binário extra nem arquivo de fonte.
- As marcas, o QR Code e as bolinhas saem nas posições do documento do cartão. O
  teste da leitura usa um PDF real desta rota como imagem de exemplo.
- O PDF sempre reflete as versões gravadas no banco: não há arquivo velho
  guardado.

**Negativas e riscos**

- **Caracteres fora da fonte:** os caracteres que a Helvetica padrão não tem
  (emoji, alguns símbolos matemáticos) saem como `?`. Para resolver, seria
  preciso embutir uma fonte, e com ela voltaria o cuidado com o empacotamento.
- **Tamanho da turma:** turmas muito grandes podem passar do limite de tamanho
  da resposta da função. O manual orienta dividir a turma em duas aplicações. A
  prova identificada já limita a turma a 200 alunos.
- **Gerar a cada download:** cada download gasta processamento da função de
  novo.
- **Sem imagens:** as questões são só texto. Imagens no enunciado precisariam
  de upload e de espaço no layout do caderno.
