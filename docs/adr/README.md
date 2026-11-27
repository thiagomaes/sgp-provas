# Decisões Arquiteturais (ADRs) do SGP

Um **ADR** (*Architecture Decision Record*) é um registro curto de uma decisão
de arquitetura: o que foi decidido, em que situação, o que mais foi avaliado e o
que isso custou. Serve para quem pega o projeto depois entender **por que** o
sistema é assim, sem ter que reconstruir a discussão a partir do código.

Cada decisão fica num arquivo próprio, numerado em ordem de tomada, e **não é
reescrito depois**: se uma decisão for substituída, entra um ADR novo marcando a
anterior como superada.

## Formato

Todos os ADRs deste repositório seguem a mesma estrutura, definida pelo ADR-001:

| Seção | O que traz |
| --- | --- |
| Cabeçalho | status, data e de quem é a decisão |
| **Contexto** | a situação e as restrições que forçaram a escolha |
| **Decisão** | o que foi decidido, no detalhe que o código reflete |
| **Alternativas consideradas** | o que mais foi avaliado e por que não foi escolhido |
| **Consequências** | o que se ganhou e o que se passou a conviver (riscos e pendências) |

## Índice

| ADR | Decisão | Data | Status |
| --- | --- | --- | --- |
| [ADR-001](ADR-001-web-responsiva-no-lugar-de-app-nativo.md) | Web responsiva no lugar de app nativo | 09/10/2026 | aceita |
| [ADR-002](ADR-002-mysql-com-prisma.md) | MySQL com Prisma 6 na API NestJS | 30/10/2026 | aceita |
| [ADR-003](ADR-003-autenticacao-jwt.md) | Autenticação JWT só do professor | 30/10/2026 | aceita |
| [ADR-004](ADR-004-hospedagem-vercel-e-aiven.md) | Hospedagem na Vercel com banco MySQL no Aiven | 30/10/2026 | aceita |
| [ADR-005](ADR-005-soft-delete-questao.md) | Soft-delete de questões | 30/10/2026 | aceita |
| [ADR-006](ADR-006-pdf-na-api-com-pdf-lib.md) | PDF gerado na API com pdf-lib e qrcode | 27/11/2026 | aceita |
| [ADR-007](ADR-007-leitura-do-cartao-no-navegador.md) | Leitura do cartão no navegador, sem servidor e sem OpenCV | 27/11/2026 | aceita |
| [ADR-008](ADR-008-correcao-offline-com-fila.md) | Correção offline com fila no localStorage e clientCorrectionId | 27/11/2026 | aceita |

## Resumo de cada um

- **ADR-001 — Web responsiva no lugar de app nativo.** O app React Native /
  Expo foi removido e a correção virou tela da própria web, usada no celular:
  um sistema, um link, uma stack. Tomada na N1, depois do feedback de que a
  correção não aparecia no sistema publicado.
- **ADR-002 — MySQL com Prisma 6 na API NestJS.** O `schema.prisma` é a fonte
  única do modelo, com migrations versionadas e seed reprodutível; a API fica em
  camadas (controller → service → repository) e só o repository fala com o
  banco. Explica também por que a versão 6, e não a 7.
- **ADR-003 — Autenticação JWT só do professor.** Access token de 1h, refresh de
  7 dias guardado apenas como hash e rotacionado a cada uso, senhas com
  `bcryptjs`, guard JWT global (rota nova nasce protegida) e isolamento dos
  dados pelo `professorId` que vem do token.
- **ADR-004 — Hospedagem na Vercel com banco MySQL no Aiven.** Web e API na
  Vercel, a API como função serverless, e MySQL 8.4 no plano gratuito do Aiven.
  Registra os preços dessa escolha, como o banco suspenso por inatividade e a
  primeira requisição lenta, e como a conexão verifica o certificado do Aiven.
- **ADR-005: soft-delete de questões.** Excluir uma questão só preenche o
  `deletedAt`: ela some do banco do professor e não entra em prova nova, mas as
  provas que já a usam continuam com ela, inclusive no gabarito da correção.
  Registra por que não foi exclusão física em cascata nem cópia da questão
  dentro da prova.
- **ADR-006: PDF gerado na API com pdf-lib e qrcode.** O caderno e o
  cartão-resposta são desenhados na hora do download, em coordenadas de
  milímetro, com bibliotecas só de JavaScript que rodam na função da Vercel sem
  Chrome nem arquivo de fonte. Registra por que não foi HTML com Puppeteer,
  `pdfkit`, `pdfmake` ou geração no navegador.
- **ADR-007: leitura do cartão no navegador, sem servidor e sem OpenCV.** A
  câmera lê o QR Code e as bolinhas no próprio celular: acha as 4 marcas, calcula
  a homografia de mm para a foto e mede cada bolinha com as regras do documento
  do cartão. As medidas são uma cópia das da API, conferida por teste. Registra
  por que não foi OpenCV.js nem leitura no servidor.
- **ADR-008: correção offline com fila no localStorage e clientCorrectionId.** A
  correção confirmada sem internet fica numa fila no navegador e é enviada
  quando a conexão volta, sem duplicar a nota. Registra por que a web ainda não
  é uma PWA completa e o que isso deixa de fora (as telas precisam de internet
  para abrir).

## Decisões da N2 registradas aqui

Os ADRs 002, 003 e 004 documentam as decisões tomadas na integração com banco da
N2, implementadas no PR
[#16](https://github.com/thiagomaes/sgp-provas/pull/16). O ADR-005 registra a
exclusão de questões do banco de questões, implementada no PR
[#19](https://github.com/thiagomaes/sgp-provas/pull/19). O contexto da entrega e
a divisão de tarefas estão em
[`docs/arquitetura/plano-n2.md`](../arquitetura/plano-n2.md).

| ADR | Integrante | PR |
| --- | --- | --- |
| ADR-001 | Thiago Luís Lombardi Maes | [#10](https://github.com/thiagomaes/sgp-provas/pull/10) |
| ADR-002, ADR-003 e ADR-004 | Amanda Zimmermann | [#18](https://github.com/thiagomaes/sgp-provas/pull/18) |
| ADR-005 | Hellen Cristina de Oliveira | [#19](https://github.com/thiagomaes/sgp-provas/pull/19) |

## Decisões da N3 registradas aqui

Os ADRs 006, 007 e 008 registram as decisões da N3, escritos no fechamento da
entrega, depois que as partes estavam na `main`. O plano da entrega está em
[`docs/arquitetura/plano-n3.md`](../arquitetura/plano-n3.md).

| ADR | Decisão implementada por | PR |
| --- | --- | --- |
| ADR-006 | Iago Henrique Pinto Bogler (PDF e prova identificada) | [#86](https://github.com/thiagomaes/sgp-provas/pull/86), [#87](https://github.com/thiagomaes/sgp-provas/pull/87) |
| ADR-007 | Thiago Luís Lombardi Maes (leitura do QR Code e do cartão) | [#97](https://github.com/thiagomaes/sgp-provas/pull/97), [#102](https://github.com/thiagomaes/sgp-provas/pull/102) |
| ADR-008 | Marceu Lago Pontes Schmidt (correção offline) | [#106](https://github.com/thiagomaes/sgp-provas/pull/106) |
