# npm audit (T25)

| | |
|---|---|
| **Data** | 27/11/2026 |
| **Comandos** | `npm audit`, depois `npm audit fix` sem `--force` (na API, com `--legacy-peer-deps`, pelo mesmo erro do npm `edgesOut` da instalação) |

## Resultado

| Pasta | Antes | Depois do `npm audit fix` |
|---|---|---|
| `apps/web-professor` | 2 altas | **0** |
| `apps/api` | 20: 1 crítica, 10 altas e 9 moderadas | **6: 4 altas e 2 moderadas**, todas sem correção dentro da mesma major |

O `npm audit fix` só atualizou o `package-lock.json`; nenhum `package.json`
mudou. Entre outras, foram atualizadas:

- **Web:** `vite` (para 8.4.0) e `source-map-js` (para 1.2.4).
- **API:**
  - `proxy-addr` (a crítica, para 2.0.8);
  - `multer` (2.5.0) e `body-parser` (2.4.0);
  - `qs` (6.17.1);
  - `@nestjs/platform-express` (12.6.3) e `@nestjs/cli` (12.0.15);
  - `vitest` (4.1.12) e `vite` (8.4.0);
  - `brace-expansion`, `minimatch` e `fast-uri`.

Depois da atualização passaram:

- **API:** `npm test` (178), `npm run test:e2e` (56) e `npm run build`.
- **Web:** `npm test` (32) e `npm run build`.

## O que sobrou, e por quê

| Pacote | Gravidade | Aviso | Por que ficou |
|---|---|---|---|
| `prisma` (CLI), via `@prisma/config` → `effect` e `deepmerge-ts` | alta | ReDoS no `Schema.TemplateLiteral` do `effect` ([GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw)); estouro de pilha ao mesclar objetos recursivos no `deepmerge-ts` ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)) | Ver abaixo |
| `exceljs` → `uuid` | moderada | Falta de checagem de limite no `uuid` v3/v5/v6 quando se passa um `buf` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)) | Ver abaixo |

**O `prisma` continuou na 6.**

- **Escopo do aviso:** o `prisma` 6.19.3 já é a última versão da major 6, e todas
  as 6.13 em diante têm esses avisos. O pacote está em `devDependencies`: é a
  linha de comando usada para gerar o cliente e rodar as migrations, e não vai
  para a função da API. O cliente que roda na Vercel (`@prisma/client`) não
  depende do `effect` nem do `deepmerge-ts`.
- **Por que não a major 7:** a correção é o Prisma 7, uma major nova que muda a
  forma de conectar (adaptador de driver para o MySQL e `prisma.config.ts`) e o
  gerador do cliente. O [ADR-002](../adr/ADR-002-mysql-com-prisma.md) explica por
  que o projeto ficou na 6. Os testes da API usam repositórios falsos, então
  passar no `npm test` não provaria que a migração funciona com o banco. Não
  tentei a 7 nesta entrega.

**O `exceljs` não voltou para a 3.4.0.**

- **O que o npm propõe:** voltar para a 3.4.0, uma major antiga, porque a 4.4.0
  já é a última e depende do `uuid` 8.
- **Por que o aviso não se aplica:** o `exceljs` só usa o `uuid.v4()` (conferido
  em `node_modules/exceljs/lib`), e a falha é nas versões v3, v5 e v6 com `buf`.
- **Por que não forçar o `uuid` 11:** forçar com um `overrides` trocaria a major
  de uma dependência interna do `exceljs`, que é o tipo de override que a tarefa
  pede para evitar.
