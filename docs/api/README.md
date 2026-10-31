# API do SGP

A especificação das rotas (método, caminho, o que cada uma faz e se é pública)
está na seção
[Especificação da API](../../README.md#9-especificação-da-api) do README da raiz.
A API publicada responde em https://sgp-provas-api.vercel.app.

As rotas são definidas nos controllers de `apps/api/src/`:

| Controller | Rotas |
| --- | --- |
| [`common/health.controller.ts`](../../apps/api/src/common/health.controller.ts) | `/health` |
| [`auth/auth.controller.ts`](../../apps/api/src/auth/auth.controller.ts) | `/auth` (cadastro, login, refresh, logout e professor logado) |
| [`classes/classes.controller.ts`](../../apps/api/src/classes/classes.controller.ts) | `/classes` (turmas e alunos) |
| [`questions/questions.controller.ts`](../../apps/api/src/questions/questions.controller.ts) | `/questions` (banco de questões) |
| [`exams/exams.controller.ts`](../../apps/api/src/exams/exams.controller.ts) | `/exams` (provas) |
| [`applications/applications.controller.ts`](../../apps/api/src/applications/applications.controller.ts) | `/applications` (aplicações e geração das versões) |
| [`corrections/corrections.controller.ts`](../../apps/api/src/corrections/corrections.controller.ts) | `/applications/:id/corrections` (correções e lançamento manual) |
| [`reports/reports.controller.ts`](../../apps/api/src/reports/reports.controller.ts) | `/reports` e `/applications/:id/report` (resumo, relatório e CSVs) |

Cada controller só recebe a requisição e valida o corpo com os DTOs da pasta
`dto/` do módulo; as regras ficam no service e o acesso ao banco, no repository.
Se uma rota mudar, atualize também a tabela do README da raiz.
