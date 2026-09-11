# Como contribuir — SGP (Grupo 10)

> [!IMPORTANT]
> **Antes de começar sua tela, rode `git pull` e leia
> `apps/web-professor/src/mocks/` e `src/styles/tokens.css` — não crie dados mock
> nem cores novas, use os que já existem.**
>
> A paleta de `tokens.css` é a única aprovada pelo cliente e os mocks são a base
> comum de todo mundo. Se faltar um dado ou uma cor, avise o grupo e altere o
> arquivo central — nunca declare um `#hex` solto na sua tela nem monte um array
> de turmas/questões dentro do componente.

## Convenção de commit

```
tipo(escopo): descrição no imperativo em português
```

- **tipos:** `feat`, `fix`, `docs`, `refactor`, `chore`
- **escopos:** `api`, `web-professor`, `mobile`, `docs`, `infra`
- descrição em minúscula, no imperativo ("adiciona", não "adicionado"/"adicionando"), sem ponto final
- **um commit = uma coisa só.** Se a frase precisa de "e", provavelmente são dois commits.

Exemplos reais deste repositório:

```
chore(infra): cria estrutura de pastas do monorepo
feat(api): inicializa API NestJS com rota GET /health
feat(web-professor): adiciona design tokens do mockup aprovado
feat(web-professor): adiciona layout base AppShell com sidebar
docs: adiciona guia de contribuição e convenção de commits
```

Exemplos do que **não** fazer:

```
update                                  ← sem tipo, sem escopo, sem descrição
feat: varias coisas da tela de turmas   ← mais de uma mudança no mesmo commit
Feat(Web): Adicionado o AppShell.       ← maiúsculas, particípio e ponto final
```

## Fluxo de trabalho

1. **Uma branch por Issue.** Nome da branch: `tipo/numero-da-issue-resumo`
   (ex.: `feat/23-tela-turmas`). Nada é commitado direto na `main`.
2. **Pull antes de começar:** `git checkout main && git pull && git checkout -b feat/23-tela-turmas`.
3. Commits pequenos durante o trabalho, seguindo a convenção acima.
4. **Pull Request obrigatório**, com a Issue vinculada (`Closes #23`) e uma
   descrição do que foi feito. PR sem Issue não é revisado.
5. **Pelo menos 1 review aprovando antes do merge.** Quem revisa não é quem abriu
   o PR. O próprio autor não faz merge sem aprovação.
6. Após o merge, apague a branch e volte para a `main` com `git pull`.

### Escopo de cada um

Cada tela vive no seu próprio arquivo em `apps/web-professor/src/pages/`. Ao
implementar a sua, **mexa apenas no arquivo da sua página** — assim ninguém dá
conflito. O `router/index.ts`, o `AppShell.vue`, o `tokens.css` e os `mocks/` são
arquivos compartilhados: só altere se for realmente necessário e avise no grupo
antes de abrir o PR.

## PR reprovado / reenviado

Sempre que um PR for **reprovado em review** e depois reenviado, o autor registra
no **diário individual** (o documento de acompanhamento individual entregue na
disciplina):

- número e título do PR e da Issue;
- o que o revisor apontou;
- o que foi corrigido antes do reenvio;
- data da reprovação e data do merge.

O comentário do review fica no próprio PR (histórico no GitHub); o diário
individual é onde essa correção conta como evidência de trabalho.

## Estrutura do projeto

| Pasta | O que é |
| --- | --- |
| `apps/api` | API NestJS (`GET /health` já disponível) |
| `apps/web-professor` | Vite + Vue — telas do professor |
| `apps/mobile-professor` | Expo — leitura de QR Code e correção offline |
| `docs/` | UML, telas, arquitetura, ADRs, modelo de dados e contrato da API |

### Rodando localmente

Depois de clonar, instale as dependências do app em que você vai trabalhar
(`node_modules/` não vai no repositório — só os `package-lock.json`):

```bash
# API  → http://localhost:3000/health
cd apps/api && npm install --legacy-peer-deps && npm run start:dev

# Web  → http://localhost:5173
cd apps/web-professor && npm install && npm run dev

# Mobile
cd apps/mobile-professor && npm install && npx expo start
```

> [!NOTE]
> **Por que `--legacy-peer-deps` só na API:** o npm 10.9.x quebra com
> `Cannot read properties of null (reading 'edgesOut')` ao resolver os peers
> opcionais do vitest 4 (dependência do scaffold do NestJS). O flag contorna o
> bug e não altera nenhuma versão instalada. Web e mobile instalam normal.

> Fase atual: **N1** — telas navegáveis com dados mock, ainda sem banco real.
> Não adicione dependência de banco de dados (MySQL, Prisma, Redis): isso é
> escopo da N2.
