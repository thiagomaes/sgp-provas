# npm audit (T25)

| | |
|---|---|
| **Data** | 27/11/2026 |
| **Comandos** | `npm audit fix` sem `--force`. Na API, `npm audit fix --omit=dev` em cima do lock da `main`, seguido de `rm -rf node_modules && npm ci`, que terminou sem erro |

## Resultado

| Pasta | Antes (lock da `main`) | Depois |
|---|---|---|
| `apps/web-professor` | 2 altas | **0** |
| `apps/api`, `npm audit --omit=dev` (o que vai para a função) | 7: 1 crítica, 3 altas e 3 moderadas | **6: 4 altas e 2 moderadas**, nenhuma crítica |
| `apps/api`, `npm audit` (com as de desenvolvimento) | 20: 1 crítica, 10 altas e 9 moderadas | 15: 7 altas e 8 moderadas |

**Só os locks mudaram:** o `npm audit fix` mexeu apenas no `package-lock.json`,
e nenhum `package.json` mudou.

**Atualizado na API:**

- `proxy-addr` (a crítica, para 2.0.8);
- `multer` (2.5.0) e `body-parser` (2.4.0);
- `qs` (6.17.1);
- `@nestjs/platform-express` (12.6.3).

**Atualizado na web:** `vite` (8.4.0) e `source-map-js` (1.2.4).

**Passaram depois da atualização:**

- **API:** `npm ci`, `npx prisma generate`, `npm test` (178), `npm run test:e2e`
  (56) e `npm run build`.
- **Web:** `npm test` (32) e `npm run build`.

**Por que as altas subiram de 3 para 4 no `--omit=dev`:** a crítica e as altas
de antes (`proxy-addr`, `multer`, `body-parser` e `@nestjs/platform-express`)
foram corrigidas. As 4 de agora são do `prisma` (a linha de comando) e das
dependências dele. Ele continua em `devDependencies`, mas o lock novo registra
que o `@prisma/client` declara o `prisma` como dependência par opcional, e por
isso o pacote passou a ser marcado como `devOptional`. Com essa marca, o
`--omit=dev` também conta o `prisma`.

## O primeiro lock quebrava o `npm ci`

**O que aconteceu:** na primeira tentativa, o `npm audit fix` normal parou no
erro do npm `Cannot read properties of null (reading 'edgesOut')`. Rodado de
novo com `--legacy-peer-deps`, ele terminou e os testes passaram na máquina
local, que já tinha o `node_modules` montado. Mas o lock gerado assim ficou
inconsistente, e um `npm ci` do zero (como o da Vercel) falhava com o mesmo erro
`edgesOut`. Por isso o build da API no PR #108 quebrou.

**Como foi corrigido:**

1. Voltei o `apps/api/package-lock.json` ao da `main`.
2. Rodei `npm audit fix --omit=dev`, sem `--force` e sem `--legacy-peer-deps`.
3. Conferi com `rm -rf node_modules && npm ci`, que terminou sem erro.

**Lição:** depois de mexer no lock, conferir com um `npm ci` do zero, e não só
com os testes no `node_modules` que já existia.

## O que sobrou, e por quê

| Pacote | Gravidade | Aviso | Por que ficou |
|---|---|---|---|
| `prisma` (CLI), via `@prisma/config` → `effect` e `deepmerge-ts` | alta | ReDoS no `Schema.TemplateLiteral` do `effect` ([GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw)); estouro de pilha ao mesclar objetos recursivos no `deepmerge-ts` ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)) | Ver abaixo |
| `exceljs` → `uuid` | moderada | Falta de checagem de limite no `uuid` v3/v5/v6 quando se passa um `buf` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)) | Ver abaixo |

**O `prisma` continuou na 6.**

- **Escopo do aviso:** o `prisma` 6.19.3 já é a última versão da major 6, e todas
  as 6.13 em diante têm esses avisos. Ele é a linha de comando usada para gerar o
  cliente e rodar as migrations, e o `effect` e o `deepmerge-ts` só entram no
  carregamento da configuração dela. O cliente que atende as requisições
  (`@prisma/client`) não usa esses pacotes.
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
