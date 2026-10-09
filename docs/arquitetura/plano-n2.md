# Plano da N2 — SGP (Grupo 10)

> Lido o repositório em 24/09/2026. Este documento parte do estado real do código
> (não do que deveria existir) e organiza o trabalho da N2 por pessoa, do mesmo jeito
> que fizemos na N1: um prompt pronto para colar no Claude Code por integrante.

> **Atualização (09/10/2026):** o SGP passou a ser **um sistema web só**, responsivo,
> usado também no celular. O app mobile (`apps/mobile-professor`) foi removido e a
> correção de provas virou 3 telas da própria web: `/correcao`,
> `/correcao/:id/escanear` (câmera do navegador) e `/correcao/:id/revisao`. Ver
> `docs/adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md`. Os prompts abaixo já
> foram ajustados a essa decisão: ninguém precisa mexer em app nativo.

## 1. Onde a N1 ficou (conferido no repositório)

| Item | Situação |
|---|---|
| Estrutura do monorepo, tokens, AppShell, rotas | ✅ completo |
| 12 telas web + 4 telas mobile | ✅ todas implementadas e navegáveis (depois da N1, as 4 telas mobile viraram as 3 telas de correção da web, ver ADR-001) |
| Deploy web | ✅ [sgp-provas.vercel.app](https://sgp-provas.vercel.app) |
| API | ⚠️ só `GET /health`, nenhum módulo de feature implementado |
| Banco de dados | ❌ não existe — tudo roda sobre `src/mocks/*.ts` |

**Autoria confirmada pelo histórico de commits:**

| Pessoa | O que entregou na N1 |
|---|---|
| Thiago | Estrutura do monorepo, tokens, AppShell, rotas, dados mock, Login, Dashboard, deploy — **e também** Provas/Aplicações/PDF (era do Iago) e Notas + as 4 telas mobile (parte do Marceu) |
| Amanda | Turmas — lista e detalhe ✅ |
| Hellen | Banco de questões — lista e editor ✅ |
| Marceu | Lista de relatórios ✅ (a tela de Notas e o app mobile acabaram indo para o Thiago) |
| **Iago** | **Nenhum commit no repositório.** |

Isso importa para a N2: o Diário Individual do Iago na N1 vai refletir a regra do
escopo ("PR nunca revisado/aprovado conta só parcialmente, pois não chegou a fazer
parte do sistema"). Para a N2, ele recebe uma tarefa de novo — mas se o padrão se
repetir, o time precisa remanejar **antes** da entrega, não na véspera.

## 2. O que a N2 exige (escopo da disciplina)

- Conectar o sistema a um banco real (MySQL), removendo os mocks das telas do N1.
- Modelar o banco (MER/DER) e documentar decisões de arquitetura (ADRs).
- Nenhum PR pendente ao final da fase.
- README v2 (diagramas UML, MER/DER, estado da integração).
- Republicar o sistema hospedado, agora com o backend conectado.
- Diário individual atualizado, **separando o que foi feito na N1 do que foi feito na N2.**

Critério que mais pesa: **C2 — Sistema Hospedado (com banco), 40%**. O professor vai
olhar o site publicado cadastrando/listando/editando/excluindo de verdade. Dado mock
sobrando em qualquer tela desconta nota. Por isso a prioridade abaixo é: primeiro o
**web-professor 100% conectado ao banco**, incluindo as telas de correção. A leitura
real do QR Code e o funcionamento offline ficam para depois, com o que der tempo.

## 3. Decisões de arquitetura para a N2

- **ORM:** Prisma (contrato tipado, migrations e seed prontos para times pequenos;
  se preferirem TypeORM, é só avisar antes do Thiago rodar o Prompt 0 — muda o
  prompt, não a divisão de trabalho).
- **Camadas na API:** dentro de cada módulo, `*.controller.ts` (rota) →
  `*.service.ts` (regra de negócio) → `*.repository.ts` (acesso ao Prisma) — o
  `rota → controle → serviço → repositório → model` do README vira pasta de verdade.
- **Hospedagem do banco + API:** qualquer serviço que ofereça MySQL gerenciado
  gratuito (ex.: Railway, Aiven) serve — **verifiquem o plano vigente antes de
  decidir**, condições de free tier mudam com frequência. O prompt de infra já deixa
  a `DATABASE_URL` como variável de ambiente, então trocar de provedor depois é só
  trocar a variável.
- **Nomes de campo:** o schema do banco replica exatamente os tipos que já existem em
  `apps/web-professor/src/mocks/types.ts` (`nome`, `disciplina`, `turno`,
  `identificarAluno`, etc.) — isso evita renomear tudo no frontend na hora de trocar
  mock por API de verdade.
- **Correção de provas (web no celular):** não existe mais app nativo (ADR-001). Na
  N2, as telas de correção passam a ler as aplicações da API e o "Confirmar" da
  revisão grava a correção no banco. A leitura real do QR Code e do cartão-resposta
  continua simulada pelo botão "Simular leitura", e o offline (PWA com service
  worker e fila em IndexedDB) fica como meta de N3. Isso está no prompt do Marceu.
- **Campos calculados:** `corrigidas` e `totalProvas` existem em `mocks/types.ts`
  (tipo `Application`) e são usados nas telas de Aplicações e de Correção, mas
  **não são colunas** do banco. A API calcula os dois ao listar aplicações:
  `corrigidas` = quantidade de `Correcao` da aplicação, `totalProvas` = quantidade
  de alunos da turma.

## 4. Ordem de execução

1. **Prompt 0 (Thiago)** — schema Prisma, migrations, seed, autenticação JWT. Precisa
   estar mergeado na `main` antes de qualquer outro prompt, porque todos os módulos
   dependem do Prisma Client gerado e do guard de autenticação.
2. **Prompts 1 a 4 (Amanda, Hellen, Iago, Marceu)** — em paralelo, cada um no seu
   módulo de API + a troca de mock por chamada real nas telas que já são suas desde a
   N1 (mesma pessoa, mesma tela — ninguém pega tela de N1 de outro colega). A única
   exceção são as 3 telas de correção (`/correcao`), que o Thiago criou depois da N1
   e ficam com o Marceu, junto com correções e notas.
3. **Depois que os 4 mergearem:** atualizar README v2, gerar o diagrama MER/DER (pode
   ser exportado do próprio `schema.prisma` com `prisma-erd-generator` ou desenhado à
   mão) e revisar que nenhuma tela ainda importa de `src/mocks/`.

### 4.1 Branches: cada um já tem a sua (não crie outra)

As 5 branches da N2 já foram criadas no GitHub a partir da `main`. As branches antigas
da N1 foram apagadas, então, na parte de código, não use nenhuma branch sem o
prefixo `n2`. A exceção é a N2 Parte 1 (diagramas UML), que vem antes desta e usa as
branches `docs/uml-*` descritas no `docs/arquitetura/plano-n2-parte1.md`.

| Pessoa | Branch | Quando começar |
|---|---|---|
| Thiago | `feature/n2-infra-auth` | agora |
| Amanda | `feature/n2-turmas` | depois que a `feature/n2-infra-auth` for mergeada na `main` |
| Hellen | `feature/n2-questoes` | depois que a `feature/n2-infra-auth` for mergeada na `main` |
| Iago | `feature/n2-provas-aplicacoes` | depois que a `feature/n2-infra-auth` for mergeada na `main` |
| Marceu | `feature/n2-relatorios-mobile` (o "mobile" no nome é da época do app; a branch é para relatórios, notas e correção na web) | depois que a `feature/n2-infra-auth` for mergeada na `main` |

**Para começar** (troque pelo nome da sua branch):

```
git fetch origin
git checkout feature/n2-turmas
git merge origin/main
```

O `git merge origin/main` é obrigatório para Amanda, Hellen, Iago e Marceu: as branches
foram criadas antes do Prompt 0, então elas ainda não têm o Prisma nem a autenticação.
Um `git pull` sozinho **não resolve**, porque ele só atualiza a sua própria branch e
não traz o que entrou na `main`. Para conferir que deu certo, o arquivo
`apps/api/prisma/schema.prisma` precisa existir depois do merge. Se não existir, a
base ainda não foi mergeada: espere o aviso do Thiago no grupo.

**Durante o trabalho:**

- Commite e dê push só na sua branch: `git push origin feature/n2-turmas`.
- Nunca commite direto na `main`. Tudo entra por PR, com pelo menos 1 review.
- **Antes de abrir o PR**, rode de novo `git fetch origin` e `git merge origin/main`
  na sua branch, para trazer o que os colegas já mergearam. Se der conflito, resolva
  na sua branch (ou peça ajuda no grupo) antes de abrir o PR.

---

## Prompt 0 — Thiago: banco de dados, autenticação e infraestrutura

```
Você está no repositório do SGP (apps/api, apps/web-professor). A N1 está completa:
15 telas web funcionam com dados mock em apps/web-professor/src/mocks/ (inclusive as 3
de correção, usadas no celular). Não existe app mobile: o SGP é uma web só (ADR-001).
Leia esses arquivos (especialmente types.ts) antes de criar o schema — os nomes de
campo do banco devem espelhar exatamente os tipos que já existem lá, para não
quebrar as telas na hora da integração.

Sua tarefa é a fundação da N2: banco de dados real + autenticação. As outras 4
pessoas do grupo vão implementar seus módulos (classes, exams, applications,
corrections/reports) em cima do que você criar aqui — então isso precisa estar
mergeado na main antes delas começarem.

PASSO 0 (antes de qualquer código): a branch feature/n2-infra-auth já existe no
GitHub, não crie outra. Rode:
  git fetch origin
  git checkout feature/n2-infra-auth
Confirme com `git branch --show-current` que está nela antes de continuar.

TAREFA 1 — Prisma + MySQL
Instale o Prisma em apps/api (`npm install prisma --save-dev --legacy-peer-deps` e
`npm install @prisma/client --legacy-peer-deps`) e rode `npx prisma init`. Configure
o datasource para MySQL lendo `DATABASE_URL` de uma variável de ambiente (crie
`.env.example` com um valor de exemplo, e garanta que `.env` está no .gitignore).

TAREFA 2 — Schema (apps/api/prisma/schema.prisma)
Modele estas entidades (nomes de campo batendo com mocks/types.ts):

- Professor: id, nome, email (único), passwordHash, createdAt, anonymizedAt?
- RefreshToken: id, professorId, tokenHash, deviceInfo?, issuedAt, expiresAt, revokedAt?
- Turma: id, professorId, nome, disciplina, ano, turno (string: 'Manhã'|'Tarde'|'Noite'), createdAt
- Aluno: id, turmaId, nome, matricula, createdAt — @@unique([turmaId, matricula])
- Questao: id, professorId, enunciado, tipo ('objetiva'|'discursiva'), respostaEsperada?,
  pontuacaoMaxima?, disciplina, tags (Json, array de strings), deletedAt?, createdAt
- Alternativa: id, questaoId, letra ('A'..'E'), texto, correta (boolean)
- Prova: id, professorId, titulo, disciplina, createdAt
- ProvaQuestao (join table): id, provaId, questaoId, ordem, pontuacao — @@unique([provaId, questaoId])
- Aplicacao: id, provaId, turmaId, professorId, data, versoes, embaralharQuestoes,
  embaralharAlternativas, identificarAluno, status ('rascunho'|'pdf-gerado'|
  'em-correcao'|'concluida'), pdfUrl?, createdAt
- VersaoProva: id, aplicacaoId, numeroVersao, layout (Json), codigoPublico (único),
  qrCodePayload (único), gabaritoPublicado, gabaritoPublicadoEm?, createdAt
- AtribuicaoProva: id, versaoProvaId, alunoId, qrCodePayload (único)
- Correcao: id, aplicacaoId, versaoProvaId, alunoId?, nomeInformado?,
  matriculaInformada?, respostas (Json), nota, origem ('mobile'|'manual'),
  clientCorrectionId? (único), statusSync ('sincronizada'|'pendente'|'conflito'),
  corrigidaEm
  (origem 'mobile' = lida pela câmera do celular na tela de correção da web; o nome
  vem da N1 e foi mantido para bater com mocks/types.ts)

ATENÇÃO: corrigidas e totalProvas, que aparecem no tipo Application de
mocks/types.ts, NÃO são colunas da Aplicacao. São calculados pela API (quantidade
de Correcao da aplicação e quantidade de alunos da turma).

Todas as relações de chave estrangeira correspondentes (Professor 1:N Turma, Turma
1:N Aluno, etc.) devem existir no schema. Rode `npx prisma migrate dev --name
init_schema` para gerar a primeira migration.

TAREFA 3 — Seed (apps/api/prisma/seed.ts)
Popule o banco com os MESMOS dados que já existem em
apps/web-professor/src/mocks/*.ts (professora Ana Costa, turma "Matemática — 1º Ano"
com os alunos nomeados no mock, prova "Avaliação Bimestral 1", etc.) — assim quando
as telas trocarem de mock para API, o conteúdo visível não muda. Configure o script
`"prisma": { "seed": "..." }` no package.json e rode `npx prisma db seed`.

TAREFA 4 — Autenticação (apps/api/src/auth/)
Estrutura em camadas: auth.controller.ts, auth.service.ts, auth.repository.ts.
- POST /auth/register — cria professor (nome, email, senha) com hash via bcrypt.
- POST /auth/login — valida credenciais, retorna access token JWT (15min) e refresh
  token (7 dias, salvo com hash em RefreshToken).
- POST /auth/refresh — troca um refresh token válido por um novo access token.
- POST /auth/logout — revoga o refresh token do dispositivo atual.
- Crie um JwtAuthGuard reutilizável em src/common/ e um decorator @CurrentProfessor()
  que extrai o id do professor logado do token — todos os outros módulos vão usar
  os dois.
- Rate limiting básico no login (ex.: @nestjs/throttler).

TAREFA 5 — Configuração compartilhada
- ConfigModule global lendo variáveis de ambiente (DATABASE_URL, JWT_SECRET,
  JWT_REFRESH_SECRET).
- PrismaService em src/common/ (conecta no onModuleInit, desconecta no
  onModuleDestroy), injetável em qualquer repository dos outros módulos.
- Registre AuthModule e o módulo comum em app.module.ts.

TAREFA 6 — Login real no web-professor
Troque apps/web-professor/src/pages/LoginPage.vue para chamar POST /auth/login de
verdade (crie apps/web-professor/src/services/http.ts com um cliente fetch/axios
básico lendo a URL da API de uma env var VITE_API_URL, e
apps/web-professor/src/services/auth.ts com a função de login). Guarde o access
token (Pinia store ou localStorage) e use-o nas próximas chamadas que os colegas
forem criar. Trate erro de credencial inválida na tela. Troque também o rodapé do
apps/web-professor/src/layouts/AppShell.vue, que hoje mostra professoraLogada de
mocks/turmas.ts, pelo nome do professor logado (crie GET /auth/me, se precisar).
Rotas internas sem token devem redirecionar para /login.

TAREFA 7 — Documentação
- docs/adr/ADR-002-orm-prisma.md: contexto, decisão, consequências de usar Prisma.
- docs/adr/ADR-003-autenticacao-jwt.md: idem para JWT + refresh token.
- docs/modelo-dados/mer-der.png (ou .md com o diagrama em Mermaid): a partir do
  schema.prisma final, depois que os outros 4 prompts também tiverem adicionado
  suas entidades (pode deixar como TAREFA pendente e voltar nela por último).

TAREFA 8 — Commits pequenos seguindo a convenção do CONTRIBUTING.md (ex.:
"feat(api): adiciona schema prisma e migration inicial",
"feat(api): implementa autenticação jwt com refresh token",
"feat(web-professor): conecta login à api real").

Branch: feature/n2-infra-auth (a mesma do PASSO 0). Abra PR para main assim que
tudo funcionar local (API subindo, migration aplicada, seed rodado, login real
funcionando). Depois do merge, avise no grupo que a base entrou na main: é a partir
desse aviso que as outras 4 pessoas rodam `git merge origin/main` nas branches delas
e começam.

Antes de começar, me mostre um plano rápido das tarefas na ordem de execução.
```

---

## Prompt 1 — Amanda: módulo de Turmas

```
Você está no repositório do SGP. A base da N2 (Prisma, autenticação JWT, PrismaService
em src/common/) já foi mergeada na main.

PASSO 0 (antes de qualquer código): a branch feature/n2-turmas já existe no GitHub,
não crie outra. Ela foi criada antes da base da N2, então você PRECISA trazer a main
para dentro dela. Rode exatamente:
  git fetch origin
  git checkout feature/n2-turmas
  git merge origin/main
(`git pull` sozinho não serve: ele não traz o que entrou na main.) Confira que o
arquivo apps/api/prisma/schema.prisma existe. Se não existir, a base ainda não foi
mergeada: pare e me avise, não continue. Depois leia o schema.prisma para ver os
modelos Turma e Aluno já criados.

Sua tarefa é implementar o módulo de turmas na API e conectar as telas que já são
suas desde a N1 (Lista de turmas e Detalhe da turma) ao banco real, removendo o mock.

TAREFA 1 — apps/api/src/classes/ (camadas: controller → service → repository)
- GET /classes — lista as turmas do professor autenticado (use @CurrentProfessor()),
  com contagem de alunos.
- POST /classes — cria turma (nome, disciplina, ano, turno).
- GET /classes/:id — detalhe da turma com a lista de alunos.
- PATCH /classes/:id — edita turma.
- POST /classes/:id/students — adiciona aluno (nome, matrícula) à turma.
- DELETE /classes/:id/students/:studentId — remove aluno da turma (sem apagar
  histórico de correções vinculadas a ele, se existirem).
Todas as rotas exigem o JwtAuthGuard e só retornam/alteram turmas do professor
logado (nunca de outro professor — teste isso).

TAREFA 2 — Wiring no web-professor
Em apps/web-professor/src/pages/TurmasPage.vue e TurmaDetalhePage.vue, troque o
import de `../mocks/turmas` por chamadas reais (crie
apps/web-professor/src/services/turmas.ts com as funções listarTurmas,
criarTurma, obterTurma, adicionarAluno, removerAluno, usando o cliente http já
criado pelo Thiago em services/http.ts). Mantenha o mesmo layout e comportamento
visual — só troca de onde o dado vem. Adicione um estado de loading simples
(ex.: "Carregando turmas...") enquanto a chamada não resolve.

TAREFA 3 — Não delete o mock ainda
Não apague apps/web-professor/src/mocks/turmas.ts nem types.ts — outras telas
(Dashboard, Aplicações, Correção) ainda podem depender dele até seus donos também
migrarem.
Se o Dashboard (do Thiago) quebrar porque ele lia turmas.ts para contar turmas,
avise no grupo antes de mexer lá.

TAREFA 4 — Documentação
docs/adr/ADR-004-soft-delete-turma.md (ou nome equivalente): documente a decisão de
como turma arquivada e aluno removido preservam histórico (mesmo que a decisão seja
simples, registre o porquê).

TAREFA 5 — Commits pequenos (ex.: "feat(api): implementa crud de turmas e alunos",
"feat(web-professor): conecta telas de turmas à api real").

Branch: feature/n2-turmas (a mesma do PASSO 0). Antes de abrir o PR, rode `git fetch origin` e
`git merge origin/main` de novo na sua branch, para trazer o que os colegas já
mergearam, e resolva conflitos se houver. Abra PR para
main vinculado à Issue de turmas, com pelo menos 1 review antes do merge.
```

---

## Prompt 2 — Hellen: módulo de Banco de Questões

```
Você está no repositório do SGP. A base da N2 (Prisma, autenticação JWT,
PrismaService) já foi mergeada na main.

PASSO 0 (antes de qualquer código): a branch feature/n2-questoes já existe no GitHub,
não crie outra. Ela foi criada antes da base da N2, então você PRECISA trazer a main
para dentro dela. Rode exatamente:
  git fetch origin
  git checkout feature/n2-questoes
  git merge origin/main
(`git pull` sozinho não serve: ele não traz o que entrou na main.) Confira que o
arquivo apps/api/prisma/schema.prisma existe. Se não existir, a base ainda não foi
mergeada: pare e me avise, não continue. Depois leia o schema.prisma para ver os
modelos Questao e Alternativa já criados.

Sua tarefa é implementar o módulo de questões na API e conectar as telas que já são
suas desde a N1 (Banco de questões e Editor de questão) ao banco real.

TAREFA 1 — apps/api/src/exams/questions (ou src/questions, se preferir separar de
exams) — camadas controller → service → repository:
- GET /questions — lista questões do professor, com filtro por texto (query param
  `busca`) e por tag (query param `tag`). Não retorna questões com deletedAt
  preenchido.
- POST /questions — cria questão. Se tipo = 'objetiva', recebe de 2 a 5
  alternativas com exatamente uma marcada como correta (valide isso no service,
  retorne 400 com mensagem clara se não bater). Se tipo = 'discursiva', recebe
  pontuacaoMaxima e respostaEsperada em vez de alternativas.
- PATCH /questions/:id — edita questão (mesmas validações de tipo).
- DELETE /questions/:id — soft-delete (preenche deletedAt, não apaga a linha —
  isso é necessário porque provas que já usam a questão não podem perder a
  referência).
Todas as rotas exigem JwtAuthGuard e só operam nas questões do professor logado.

TAREFA 2 — Wiring no web-professor
Em QuestoesPage.vue e QuestaoNovaPage.vue, troque o import de `../mocks/questoes` e
o uso de `../state/questoes.ts` por chamadas reais (crie
apps/web-professor/src/services/questoes.ts). O CONTRIBUTING.md observa que
state/questoes.ts foi escrito antes do padrão atual — aproveite esta tarefa para
substituí-lo pela chamada de API em vez de manter os dois padrões coexistindo.
Mantenha a busca e o filtro por tag funcionando client-side ou via query param da
API (sua escolha, mas documente qual optou no PR).

TAREFA 3 — Não delete o mock ainda
Não apague mocks/questoes.ts nem types.ts — a tela de Montagem de Prova (do Iago)
também lê de lá até ele migrar a dele.

TAREFA 4 — Documentação
docs/adr/ADR-005-soft-delete-questao.md: por que soft-delete em vez de exclusão
física (histórico de provas que já usam a questão).

TAREFA 5 — Commits pequenos (ex.: "feat(api): implementa crud de questões com
soft-delete", "feat(web-professor): conecta banco de questões à api real").

Branch: feature/n2-questoes (a mesma do PASSO 0). Antes de abrir o PR, rode `git fetch origin` e
`git merge origin/main` de novo na sua branch, para trazer o que os colegas já
mergearam, e resolva conflitos se houver. Abra PR para
main vinculado à Issue de questões, com pelo menos 1 review antes do merge.
```

---

## Prompt 3 — Iago: módulo de Provas e Aplicações

```
Você está no repositório do SGP. A base da N2 (Prisma, autenticação JWT,
PrismaService) já foi mergeada na main.

PASSO 0 (antes de qualquer código): a branch feature/n2-provas-aplicacoes já existe no GitHub,
não crie outra. Ela foi criada antes da base da N2, então você PRECISA trazer a main
para dentro dela. Rode exatamente:
  git fetch origin
  git checkout feature/n2-provas-aplicacoes
  git merge origin/main
(`git pull` sozinho não serve: ele não traz o que entrou na main.) Confira que o
arquivo apps/api/prisma/schema.prisma existe. Se não existir, a base ainda não foi
mergeada: pare e me avise, não continue. Depois leia o schema.prisma para ver os
modelos Prova, ProvaQuestao, Aplicacao e
VersaoProva já criados.

Sua tarefa é implementar dois módulos na API e conectar as quatro telas que já são
suas desde a N1 (Lista de provas, Montagem de prova, Lista de aplicações,
Exportação de PDF) ao banco real. Essas telas hoje leem de
apps/web-professor/src/mocks/provas.ts e aplicacoes.ts — foi você quem entregou
essas telas na N1 (o Thiago cobriu na sua ausência), então essa é a sua chance de
assumir a parte de verdade agora.

TAREFA 1 — apps/api/src/exams/ (provas) — camadas controller → service → repository:
- GET /exams — lista provas do professor.
- POST /exams — cria prova (título, disciplina, lista de questaoId + ordem +
  pontuação). Valide: no máximo 20 questões, cada questaoId precisa existir e
  pertencer ao professor logado.
- GET /exams/:id — detalhe com as questões.
- PATCH /exams/:id — edita.

TAREFA 2 — apps/api/src/applications/ (aplicações) — mesmas camadas:
- GET /applications — lista aplicações do professor (prova, turma, status), já
  com os campos calculados corrigidas (quantidade de Correcao da aplicação) e
  totalProvas (quantidade de alunos da turma). As telas de Aplicações e de Correção
  usam os dois; eles não são colunas do banco.
- POST /applications — cria aplicação (provaId, turmaId, data).
- GET /applications/:id — detalhe.
- POST /applications/:id/generate — recebe a configuração de exportação
  (quantidade de versões, embaralharQuestoes, embaralharAlternativas,
  identificarAluno), cria os registros de VersaoProva correspondentes (uma por
  versão) com um `codigoPublico` e `qrCodePayload` gerados (pode ser um uuid por
  enquanto — a geração do PDF em si e o QR Code de verdade são N3), e muda o
  status da aplicação para 'pdf-gerado'. Isso é o suficiente para a tela de
  Exportação parar de ser só visual.

TAREFA 3 — Wiring no web-professor
Em ProvasPage.vue, ProvaNovaPage.vue, AplicacoesPage.vue e
AplicacaoExportarPage.vue, troque os imports de mocks/provas.ts e
mocks/aplicacoes.ts por chamadas reais (crie
apps/web-professor/src/services/provas.ts e services/aplicacoes.ts). Os toggles de
embaralhamento e o stepper de versões na tela de exportação passam a enviar de
verdade para POST /applications/:id/generate, em vez de só simular no estado local.

TAREFA 4 — Não delete o mock ainda
Não apague mocks/provas.ts, mocks/aplicacoes.ts nem types.ts — Dashboard (Thiago),
Relatórios e Correção (Marceu) ainda podem depender deles até migrarem. Na
AplicacoesPage.vue, mantenha o botão "Corrigir" das linhas com status pdf-gerado ou
em-correcao (ele leva para /correcao/:id/escanear).

TAREFA 5 — Documentação
docs/adr/ADR-006-geracao-versoes-prova.md: como o embaralhamento é modelado
(campo `layout` json em VersaoProva) e por que a geração real do PDF fica para a
N3.

TAREFA 6 — Commits pequenos (ex.: "feat(api): implementa crud de provas",
"feat(api): implementa criação de aplicações e geração de versões",
"feat(web-professor): conecta provas e aplicações à api real").

Branch: feature/n2-provas-aplicacoes (a mesma do PASSO 0). Antes de abrir o PR, rode `git fetch origin` e
`git merge origin/main` de novo na sua branch, para trazer o que os colegas já
mergearam, e resolva conflitos se houver. Abra
PR para main vinculado à Issue, com pelo menos 1 review antes do merge. Desta vez,
mande o PR antes do prazo da fase.
```

---

## Prompt 4 — Marceu: módulo de Correções/Relatórios e correção na web

```
Você está no repositório do SGP. A base da N2 (Prisma, autenticação JWT,
PrismaService) já foi mergeada na main.

PASSO 0 (antes de qualquer código): a branch feature/n2-relatorios-mobile já existe no GitHub,
não crie outra. Ela foi criada antes da base da N2, então você PRECISA trazer a main
para dentro dela. Rode exatamente:
  git fetch origin
  git checkout feature/n2-relatorios-mobile
  git merge origin/main
(`git pull` sozinho não serve: ele não traz o que entrou na main.) Confira que o
arquivo apps/api/prisma/schema.prisma existe. Se não existir, a base ainda não foi
mergeada: pare e me avise, não continue. Depois leia o schema.prisma para ver os
modelos Correcao, AtribuicaoProva,
VersaoProva e Aplicacao já criados.

Sua tarefa tem três frentes: o módulo de correções/relatórios na API, a troca de
mock por API nas telas de Relatórios e Notas, e a troca de mock por API nas telas
de correção de provas. NÃO existe app mobile: o SGP é uma web só, responsiva, e a
correção pela câmera é feita na própria web aberta no celular (leia
docs/adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md). Não tente fazer a
leitura real do QR Code nem o offline nesta fase: isso fica para a N3.

FRENTE 1 — apps/api/src/corrections/ e apps/api/src/reports/ — camadas
controller → service → repository:
- GET /applications/:id/corrections — lista correções de uma aplicação (aluno,
  matrícula, nota, origem automática/manual), com filtro `?assigned=false` para as
  pendentes de atribuição.
- POST /applications/:id/corrections — grava uma correção lida pela câmera
  (aluno ou null quando a prova não é identificada, versao, nota, respostas,
  origem 'mobile', clientCorrectionId). Se já existir uma correção com o mesmo
  clientCorrectionId, devolva a existente em vez de duplicar (RF10). Ao gravar a
  primeira correção, mude o status da aplicação de 'pdf-gerado' para 'em-correcao'.
  O versaoProvaId sai da VersaoProva com o numeroVersao recebido; se a aplicação não
  tiver versão gerada, retorne 400.
- PATCH /applications/:id/corrections/:correctionId — atribui uma correção
  pendente a um aluno da turma (lançamento manual, RF09) — preenche o alunoId sem
  criar registro novo.
- GET /applications/:id/report — estatísticas da aplicação (média, mediana, desvio
  padrão) calculadas a partir das Correcao daquela aplicação.
- GET /reports/consolidated?format=csv|xlsx|pdf — relatório consolidado (pode
  começar só com csv funcionando de verdade; xlsx/pdf ficam de stretch goal se
  sobrar tempo).

FRENTE 2 — Wiring no web-professor
Em RelatoriosPage.vue e RelatorioDetalhePage.vue, troque o import de
mocks/aplicacoes.ts e mocks/correcoes.ts por chamadas reais (crie
apps/web-professor/src/services/relatorios.ts). O botão "lançar nota" na tela de
Notas passa a chamar PATCH /applications/:id/corrections/:correctionId de verdade.
Os botões "Exportar CSV"/"Exportar PDF" chamam o endpoint de relatório consolidado
(mesmo que só o CSV funcione de fato por enquanto — documente no PR o que ficou
pendente).

FRENTE 3 — Correção de provas na web (telas criadas pelo Thiago depois da N1, que
ficam com você na N2 por serem parte de correções e notas):
- CorrecaoPage.vue (/correcao): troque o import de mocks/aplicacoes.ts pela
  listagem de GET /applications (use o services/aplicacoes.ts do Iago; se ainda
  não estiver na main, combine com ele em vez de criar outro). A tela mostra as
  aplicações com status pdf-gerado ou em-correcao, com corrigidas e totalProvas
  vindos da API.
- CorrecaoEscanearPage.vue (/correcao/:id/escanear): a câmera do navegador
  continua igual e a leitura continua simulada pelo botão "Simular leitura".
  Só troque os dados de aplicação, prova e turma do cabeçalho por API.
- CorrecaoRevisaoPage.vue (/correcao/:id/revisao): a nota de exemplo continua
  sendo montada a partir das questões da prova, mas os dados passam a vir da API
  (prova pelo GET /exams/:id do Iago, alunos pelo GET /classes/:id da Amanda,
  correções já feitas pelo GET /applications/:id/corrections). O botão
  "Confirmar" passa a chamar POST /applications/:id/corrections em vez de dar
  push no array do mock, e depois volta para /correcao.
- Mantenha os comentários TODO(N2/N3) que já estão no código sobre a leitura
  real do QR Code e do cartão-resposta.
- Teste as 3 telas em 390x844 (celular): elas são usadas principalmente no
  celular. A câmera só abre em HTTPS ou localhost.

TAREFA — Documentação
docs/adr/ADR-007-relatorios-consolidados.md: formatos de exportação suportados
nesta fase e o que ficou para a N3.

TAREFA — Commits pequenos, separando por frente (ex.: "feat(api): implementa
lançamento manual de nota e relatório por aplicação", "feat(web-professor): conecta
relatórios e notas à api real", "feat(web-professor): conecta correção de provas à
api real").

Branch: feature/n2-relatorios-mobile (a mesma do PASSO 0). Antes de abrir o PR, rode `git fetch origin` e
`git merge origin/main` de novo na sua branch, para trazer o que os colegas já
mergearam, e resolva conflitos se houver. Abra
PR para main vinculado à Issue, com pelo menos 1 review antes do merge.
```

---

## 5. Depois que os 4 PRs estiverem mergeados

- **README v2**: atualizar a seção "Estado atual" para N2, trocar o badge de
  entrega, documentar a URL da API hospedada e como configurar `DATABASE_URL` /
  `VITE_API_URL` localmente.
- **MER/DER**: gerar a partir do `schema.prisma` final (ex.:
  `prisma-erd-generator`) e salvar em `docs/modelo-dados/`.
- **Dashboard (Thiago):** a DashboardPage.vue não está em nenhum prompt acima e
  lê de `mocks/`. Depois dos 4 merges, troque os contadores e as "Últimas
  aplicações" por chamadas aos services que os colegas criaram.
- **Verificação final:** rodar uma busca por `mocks/` em
  `apps/web-professor/src/pages/` e `apps/web-professor/src/layouts/` — se algum
  arquivo ainda importar mock direto, é isso que vai descontar no critério C2
  (nenhum dado fixo). Só então dá para apagar a pasta `src/mocks/` (mantendo os
  tipos de `types.ts` em outro lugar, se ainda forem usados).
- **Celular:** abrir o site publicado no celular e fazer o fluxo de correção
  inteiro (lista, escanear, simular leitura, confirmar) com o banco real.
- **Deploy**: republicar a API (Railway/Aiven/o que for escolhido) e apontar
  `VITE_API_URL` na Vercel para a URL de produção da API antes da entrega.
