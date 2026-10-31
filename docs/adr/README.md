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
  Registra os preços dessa escolha: o banco suspenso por inatividade, a primeira
  requisição lenta e a conexão TLS sem verificação do certificado.

## Decisões da N2 registradas aqui

Os ADRs 002, 003 e 004 documentam as decisões tomadas na integração com banco da
N2, implementadas no PR
[#16](https://github.com/thiagomaes/sgp-provas/pull/16). O contexto da entrega e
a divisão de tarefas estão em
[`docs/arquitetura/plano-n2.md`](../arquitetura/plano-n2.md).

| ADR | Integrante | PR |
| --- | --- | --- |
| ADR-001 | Thiago Luís Lombardi Maes | [#10](https://github.com/thiagomaes/sgp-provas/pull/10) |
| ADR-002, ADR-003 e ADR-004 | Amanda Zimmermann | [#18](https://github.com/thiagomaes/sgp-provas/pull/18) |
