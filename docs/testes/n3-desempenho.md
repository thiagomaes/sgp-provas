# Desempenho do sistema publicado (T25)

| | |
|---|---|
| **Data** | 27/11/2026, 20h26 (horário de Brasília) |
| **API** | https://sgp-provas-api.vercel.app |
| **Script** | `apps/api/scripts/medir-desempenho.mjs` (Node 22, `fetch`) |
| **De onde** | um computador em rede doméstica no Brasil. A Vercel atendeu pela borda de São Paulo (`gru1`), e a função da API roda em Washington (`iad1`), como mostra o cabeçalho `x-vercel-id` |
| **Conta** | a de demonstração do README (`ana.costa`), com os dados do seed |
| **O que faz** | um login e, para cada rota, 30 chamadas `GET` seguidas. Só leitura: nada é criado, editado ou apagado |

```
cd apps/api
SGP_EMAIL=<e-mail> SGP_SENHA=<senha> node scripts/medir-desempenho.mjs
```

## Resultado

**A primeira chamada** (`GET /health`, com a função e o banco acordando) levou
**3908 ms**. O login, logo depois, levou 2281 ms.

As estatísticas abaixo usam as chamadas 2 a 30 de cada rota. A 1ª vai na coluna
própria.

| Rota | 1ª chamada | p50 | p95 | Máximo | RNF02 (p95 até 300 ms) |
|---|---|---|---|---|---|
| `GET /health` (sem banco) | 179 ms | 190 ms | 338 ms | 361 ms | ❌ |
| `GET /classes` | 445 ms | 330 ms | 470 ms | 474 ms | ❌ |
| `GET /questions` | 457 ms | 330 ms | 429 ms | 449 ms | ❌ |
| `GET /exams` | 472 ms | 342 ms | 456 ms | 529 ms | ❌ |
| `GET /applications` | 333 ms | 326 ms | 493 ms | 832 ms | ❌ |
| `GET /applications/:id/report` | 1053 ms | 603 ms | 671 ms | 746 ms | ❌ |

## Comparação com o RNF02

O RNF02 pede **p95 de até 300 ms nas operações comuns**. Medido no cliente, a
partir do Brasil, **nenhuma rota atende**: o p95 ficou entre 338 ms e 671 ms.

O tempo medido aqui é o que o professor sente, mas boa parte dele é rede:

- **A rede pesa:** o `GET /health` não consulta o banco e já leva 190 ms no p50.
  É praticamente o custo da ida e volta entre São Paulo e a função em Washington,
  com a borda da Vercel no meio.
- **O tempo da API em si é bem menor:** descontando esse piso, as listagens
  (turmas, questões, provas e aplicações) ficam em cerca de **140 a 150 ms** no
  p50. O relatório fica em cerca de **410 ms**, porque monta as notas, as
  estatísticas e o acerto por questão de cada aluno. Isso é uma estimativa
  (p50 da rota menos p50 do `/health`), não uma medida feita no servidor.
- **A primeira chamada é lenta:** a função fria e o banco do plano gratuito do
  Aiven, que suspende sem uso, explicam os quase 4 segundos. Isso já está no
  [ADR-004](../adr/ADR-004-hospedagem-vercel-e-aiven.md) e no roteiro da
  apresentação (abrir o site antes).

## O que melhoraria, sem mudar nada agora

- **Rodar a função perto do professor:** configurar a região da função na Vercel
  (por exemplo, `gru1`, São Paulo) tiraria a maior parte da ida e volta. Isso
  também depende de onde fica o banco do Aiven: com a função longe do banco, cada
  consulta passaria a pagar a distância. A mudança precisa ser testada antes da
  entrega e não foi feita aqui.
- **Relatório mais leve:** o relatório poderia buscar no banco só o que a tela
  mostra primeiro, deixando o acerto por questão para uma segunda chamada.
- **Medir no servidor:** um tempo por requisição já sai no log de acesso novo
  (T23), sem a rede do cliente. Uma próxima medida pode usar esses números, da
  aba Logs da Vercel.
