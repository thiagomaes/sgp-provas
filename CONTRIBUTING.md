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

1. **Cada um trabalha na sua branch.** As branches de feature já estão criadas no
   repositório (tabela abaixo) — ninguém commita direto na `main`.
2. **Pull antes de começar:**
   ```bash
   git checkout main && git pull
   git checkout feature/turmas     # a sua branch
   git pull
   ```
3. Commits pequenos durante o trabalho, seguindo a convenção acima.
4. **Pull Request obrigatório** da sua branch para a `main`, com a Issue vinculada
   (`Closes #23`) e uma descrição do que foi feito. PR sem Issue não é revisado.
5. **Pelo menos 1 review aprovando antes do merge.** Quem revisa não é quem abriu
   o PR. O próprio autor não faz merge sem aprovação.
6. Após o merge, volte para a `main` com `git pull`. Se for pegar outra tarefa,
   crie uma branch nova a partir da `main` (`feature/nome-da-tarefa`).

### Branch de cada integrante

| Integrante | Branch | Telas |
| --- | --- | --- |
| Thiago | `feature/login-dashboard` | Login, Dashboard |
| Amanda | `feature/turmas` | Lista de turmas, Detalhe da turma |
| Hellen | `feature/questoes` | Banco de questões, Editor de questão |
| Iago | `feature/provas-aplicacoes` | Lista/montagem de provas, Aplicações, Exportação de PDF |
| Marceu | `feature/relatorios-mobile` | Relatórios, Notas, 4 telas do app mobile |

Todas saíram do mesmo commit da `main`, então ninguém começa atrasado em relação
aos outros.

### Escopo de cada um

Cada tela vive no seu próprio arquivo em `apps/web-professor/src/pages/`. Ao
implementar a sua, **mexa apenas no arquivo da sua página** — assim ninguém dá
conflito. O `router/index.ts`, o `AppShell.vue`, o `tokens.css` e os `mocks/` são
arquivos compartilhados: só altere se for realmente necessário e avise no grupo
antes de abrir o PR.

Como as branches foram criadas antes de qualquer tela existir, quem for mexer num
arquivo compartilhado deve rodar `git pull origin main` na sua branch antes, para
não sobrescrever mudança de colega.

### Estado das telas na N1 (padrão do projeto)

Nesta fase não há banco nem API: quando a tela precisa **criar, editar ou remover**
algo (nova turma, novo aluno, nova questão), o padrão do projeto é envolver o array
do mock num `ref` e alterá-lo direto — o dado vive em memória enquanto a sessão
durar.

```ts
import { ref } from 'vue'
import { turmas } from '../mocks/turmas'
import type { Class } from '../mocks/types'

const listaTurmas = ref<Class[]>(turmas)

function criarTurma() {
  listaTurmas.value.push({ id: `turma-${Date.now()}`, /* ... */ })
}
```

Combinado no grupo: é o jeito mais simples para a entrega da N1 e não exige store
nem camada extra. Duas consequências que são esperadas, não bugs:

- o dado criado **persiste ao navegar entre telas** (o array do mock é o mesmo
  módulo para todo mundo), e some ao recarregar a página (F5);
- alterar uma turma em `/turmas` reflete no contador do Dashboard, por exemplo.

Regras que continuam valendo: **não edite os arquivos de `src/mocks/` para incluir
dados da sua tela** (o array inicial é base comum de todos) e **não crie tipo novo**
— se faltar campo, adicione o campo em `mocks/types.ts` como opcional e avise o
grupo.

> Exceção conhecida: `src/state/questoes.ts` foi escrito antes desta decisão e faz
> uma cópia reativa do mock. Funciona e pode ficar como está; para código novo, use
> o padrão acima.

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
