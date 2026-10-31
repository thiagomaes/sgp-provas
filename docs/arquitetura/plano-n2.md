# Plano da N2: integração com banco (Grupo 10)

> **Atualizado em 30/10/2026.** Este plano substitui a versão de 25/09, em que cada
> integrante implementaria um módulo da API. Aquela divisão não chegou a ser
> executada e o prazo apertou, então a N2 foi reorganizada para caber em um dia: o
> Thiago faz a base de código (API e telas) e cada integrante fica com uma entrega
> independente, com o próprio PR revisado e mergeado.

## 1. O que a N2 exige

- As telas lendo e gravando num **MySQL real**, sem nenhum dado mock (critério C2,
  40%: mock presente gera desconto).
- Cadastrar, listar, editar e excluir funcionando no **sistema hospedado**.
- MER/DER, decisões de arquitetura (ADRs), classes de domínio ajustadas.
- README v2 com UML, modelo de dados e o estado da integração.
- Nenhum PR pendente no fim da fase; cada integrante com PR **aprovado** e mergeado.
- Diário individual separando o que foi feito na N1 do que foi feito na N2.

## 2. Situação

| Etapa | Responsável | PR | Situação |
|---|---|---|---|
| Banco MySQL no Aiven (plano Free) | Thiago | | ✅ no ar (`sgp-provas-db`, MySQL 8.4) |
| API com banco: Prisma, schema, seed, autenticação e todos os módulos | Thiago | #16 | ✅ na main |
| API publicada na Vercel | Thiago | #20 | ✅ na main (https://sgp-provas-api.vercel.app) |
| Telas ligadas à API, sem mock | Thiago | #24 | ✅ na main |
| ADRs 002 a 004 | Amanda | #18, #21 | ✅ na main |
| Banco de questões ligado à API e ADR-005 | Hellen | #19 | ✅ na main |
| Relatório consolidado em CSV (`GET /reports/consolidated`) | Marceu | #22 | ✅ na main |
| MER/DER e diagrama de classes ajustado | Iago | #23 | ✅ na main |
| Teste de ponta a ponta no site publicado | Thiago | #25 | ✅ na main (13 de 13 passos) |
| README v2 | Thiago | #26 | ✅ na main |
| Zip, link e envio | Thiago | | ⏳ fim do dia |

### Revisores

| Autor do PR | Quem aprova |
|---|---|
| Thiago (API, #16) | Iago |
| Thiago (telas) | Marceu |
| Amanda (ADRs) | Hellen |
| Iago (MER/DER) | Amanda |
| Hellen (README v2) | Thiago |
| Marceu (teste ponta a ponta) | Thiago |

Regras para todo mundo:
- Branch nova a partir da `main` atualizada (`git checkout main && git pull`).
- O PR só entra depois do **Approve** do revisor (Files changed, Review changes,
  Approve). Merge sem Approve não conta como evidência no diário.
- Commits com a própria conta, em português, no padrão do CONTRIBUTING.md, sem
  Co-Authored-By nem menção a IA.
- Nunca commitar `.env`, senha ou URI do banco.

## 3. O que a API entrega (PR #16)

- **Stack:** NestJS 12, Prisma 6, MySQL 8.4 no Aiven, JWT (`@nestjs/jwt`) e
  `bcryptjs` para as senhas.
- **Camadas:** cada módulo em `apps/api/src/<módulo>/` com controller (rotas),
  service (regras), repository (Prisma) e DTOs validados com class-validator.
  Regras de negócio em arquivos próprios: `validacao-questao.ts`,
  `regras-prova.ts`, `versoes.ts`, `calculo-nota.ts`, `estatisticas.ts`.
- **Segurança:** guard JWT global (só `/health` e as rotas públicas de `/auth`
  ficam abertas); cada professor vê e altera apenas os próprios dados.
- **Banco:** `apps/api/prisma/schema.prisma`, migration `init_schema` e seed com
  os mesmos dados das telas da N1 (pode rodar várias vezes sem duplicar).
- **Conta de demonstração:** `ana.costa@escola.edu.br` / `sgp2026`.

| Módulo | Rotas |
|---|---|
| health | `GET /health` |
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| turmas | `GET/POST /classes`, `GET/PATCH/DELETE /classes/:id`, `POST /classes/:id/students`, `PATCH/DELETE /classes/:id/students/:studentId` |
| questões | `GET/POST /questions`, `GET/PATCH/DELETE /questions/:id` (exclusão lógica) |
| provas | `GET/POST /exams`, `GET/PATCH/DELETE /exams/:id` |
| aplicações | `GET/POST /applications`, `GET/DELETE /applications/:id`, `POST /applications/:id/generate` |
| correções | `GET/POST /applications/:id/corrections`, `PATCH /applications/:id/corrections/:correctionId` |
| relatórios | `GET /reports/summary`, `GET /applications/:id/report`, `GET /applications/:id/report.csv` |

Decisões tomadas durante a implementação:
- `corrigidas` é uma coluna da aplicação (há aplicações concluídas no seed sem
  registro individual de correção); `totalProvas` é calculado.
- `POST` de correções aceita `origem: 'manual'`, usado no lançamento manual de nota.
- 409 com mensagem clara ao excluir turma, aluno ou aplicação com correções, e ao
  mudar as questões de uma prova que já teve versões geradas.
- `bcryptjs` no lugar de `bcrypt`: mesmo algoritmo, sem binário nativo (evita
  falha na Vercel).
- Conexão com o Aiven usa `?sslaccept=accept_invalid_certs`; o `.env.example`
  explica como trocar pelo certificado do Aiven.

## 4. Publicar a API na Vercel (Thiago)

1. Antes de tudo, troque a senha do `avnadmin` no Aiven (Users, Reset password) e
   atualize o `apps/api/.env`.
2. Vercel, Add New, Project, repositório `sgp-provas`, Root Directory `apps/api`.
3. Variáveis: `DATABASE_URL` (a do `.env`, já com a senha nova), `JWT_SECRET`,
   `JWT_REFRESH_SECRET` e `WEB_ORIGIN=https://sgp-provas.vercel.app` (sem barra no
   final).
4. Deploy e teste `https://<api>.vercel.app/health`.
5. No projeto da web: variável `VITE_API_URL` com a URL da API e Redeploy.

O plano Free do Aiven desliga o banco depois de um tempo sem uso: antes de entregar
e perto da correção, confira no painel se o serviço está "Running".

---

## Prompt 2 (Thiago): telas sem mock, ligadas à API

Depois do merge do #16 e da API publicada.

```
Você está no repositório do SGP. A API com banco já está na main (apps/api) e
publicada. Esta tarefa liga TODAS as telas de apps/web-professor à API e remove os
mocks por completo. Não mexa em apps/api nem no README.md.

PASSO 0: git checkout main && git pull && git checkout -b feat/n2-telas-api
Leia apps/api (controllers, DTOs e src/common/formatos.ts) para usar as rotas e os
formatos de resposta exatos. A URL da API publicada é: COLE_AQUI_A_URL_DA_API

TAREFA 1: Cliente HTTP e login
- src/services/http.ts: fetch com base em import.meta.env.VITE_API_URL, envia o
  token, renova com /auth/refresh quando der 401 e, se não conseguir, manda para
  /login. Crie apps/web-professor/.env.example com VITE_API_URL e um .env local
  (não versionado) apontando para a API publicada.
- Store de autenticação (Pinia) com login, logout e professor logado (/auth/me).
- LoginPage chama /auth/login de verdade e mostra erro de credencial inválida.
- Guarda de rota: sem token, qualquer rota interna vai para /login.
- O nome do professor no AppShell vem do professor logado. Adicione "Sair" no menu.

TAREFA 2: Um service por área em src/services (turmas, questoes, provas,
aplicacoes, correcoes, relatorios) e todas as páginas usando eles:
Dashboard, Turmas, TurmaDetalhe, Questoes, QuestaoNova (criar e editar), Provas,
ProvaNova, Aplicacoes, AplicacaoExportar, Correcao, CorrecaoEscanear,
CorrecaoRevisao, Relatorios e RelatorioDetalhe.
- O CRUD tem que funcionar de ponta a ponta onde o escopo pede: turmas (criar,
  editar, excluir), alunos (adicionar, editar, remover), questões (criar, editar,
  excluir), provas (criar, editar, excluir), aplicações (criar, gerar versões,
  excluir), correção (confirmar grava no banco), lançamento manual de nota e
  exportação CSV de notas.
- Onde hoje só existe criar, acrescente editar e excluir no mesmo padrão visual
  (use só as cores de styles/tokens.css). Excluir pede confirmação na própria tela,
  sem window.confirm. Quando a API recusar com 409 (ex.: turma com correções),
  mostre a mensagem dela na tela.
- Cada tela com estado de carregando, de lista vazia e de erro (mensagem da API).

TAREFA 3: Zero mock
- Mova src/mocks/types.ts para src/types/index.ts e ajuste os imports.
- Apague a pasta src/mocks inteira e src/state/questoes.ts.
- Confirme com grep -rn "mocks" src que não sobrou nada.
- npm run build tem que passar.

TAREFA 4: Teste com a API publicada: login da Ana Costa
(ana.costa@escola.edu.br / sgp2026), criar, editar e excluir uma turma, uma
questão e uma prova, gerar uma aplicação, corrigir uma prova pela tela de correção
e conferir a nota no relatório. Use o Playwright (se o Chromium não estiver
instalado, use npx playwright install chromium) e corrija o que quebrar. No fim,
apague do banco o que o teste criou, deixando só os dados do seed.

TAREFA 5: Commits pequenos por área (ex.: "feat(web-professor): adiciona cliente
http e login real", "feat(web-professor): conecta telas de turmas à api", ...,
"refactor(web-professor): remove dados mock"). Push e PR para a main pedindo review
do Marceu.

REGRAS DE COMMIT: use a identidade git já configurada nesta máquina (confira com git
config user.name e user.email; se estiver vazia ou genérica, pare e me avise). NÃO
adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de atribuição no commit ou
no PR. Não use --author. Nunca commite .env.

Antes de começar, me mostre o plano rápido na ordem de execução.
```

---

## Prompt A (Amanda): decisões de arquitetura (ADRs)

Pode começar já, não depende do código.

```
Você está no repositório do SGP. Tarefa só de documentação: registrar as decisões de
arquitetura da N2 em docs/adr/, no mesmo formato do ADR-001 que já existe
(Contexto, Decisão, Alternativas consideradas, Consequências). Leia antes o
README.md, docs/adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md e a seção 3 de
docs/arquitetura/plano-n2.md (o que a API entrega). Se o PR #16 já estiver na main,
leia também apps/api/prisma/schema.prisma e apps/api/src/auth.

PASSO 0: git checkout main && git pull && git checkout -b docs/n2-adrs

Crie três arquivos:
- docs/adr/ADR-002-mysql-com-prisma.md: MySQL (exigência da disciplina) com o ORM
  Prisma 6 na API NestJS; por que Prisma (schema tipado, migrations, seed); por que
  a versão 6 e não a 7; arquitetura em camadas (controller, service, repository);
  alternativas: TypeORM, SQL puro.
- docs/adr/ADR-003-autenticacao-jwt.md: login só do professor; access token de 1h
  e refresh token de 7 dias guardado com hash; senhas com bcryptjs (sem binário
  nativo, por causa da Vercel); guard JWT global com rotas públicas marcadas; cada
  professor só acessa os próprios dados; alternativas: sessão em cookie, provedor
  externo.
- docs/adr/ADR-004-hospedagem-vercel-e-aiven.md: web e API na Vercel (a API NestJS
  roda como função), banco MySQL 8.4 gratuito no Aiven; consequências: o plano
  gratuito desliga o banco quando fica parado e a primeira requisição pode demorar;
  a conexão aceita o certificado sem verificar (e como trocar pelo CA do Aiven);
  alternativas: TiDB Cloud (compatível com MySQL, mas não é o MySQL em si), Supabase
  (descartado por ser PostgreSQL), Railway (só período de teste).
Também crie docs/adr/README.md com uma tabela listando os ADRs 001 a 004.

Commits pequenos (ex.: "docs(docs): registra adr da escolha do mysql com prisma").
Push e PR para a main pedindo review da Hellen.

REGRAS: use a identidade git já configurada nesta máquina (se estiver vazia, pare e
me avise). NÃO adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de
atribuição no commit ou no PR. Não use --author.
```

---

## Prompt I (Iago): MER/DER e diagrama de classes

Depois do merge do #16 (o `schema.prisma` precisa estar na `main`).

```
Você está no repositório do SGP. O banco da N2 está em
apps/api/prisma/schema.prisma. Tarefa só de documentação: modelo de dados e ajuste
do diagrama de classes que você fez na Parte 1.

PASSO 0: git checkout main && git pull && git checkout -b docs/n2-modelo-dados
Se apps/api/prisma/schema.prisma não existir, a API ainda não entrou: pare e me avise.

TAREFA 1: docs/modelo-dados/mer-der.md
- O DER em Mermaid (erDiagram) com todas as tabelas do schema, chaves primárias e
  estrangeiras, tipos e cardinalidades exatamente como no schema.
- Gere também docs/modelo-dados/der.png (npx @mermaid-js/mermaid-cli) e abra para
  conferir que está legível.
- Um dicionário de dados: uma tabela por entidade (campo, tipo, obrigatório,
  descrição) e um parágrafo com as regras importantes: aluno único por matrícula
  na turma, exclusão lógica de questão, correção sem aluno quando a prova não é
  identificada, deduplicação por clientCorrectionId, ids em texto (iguais aos da
  N1) e campos de valor fixo guardados como texto e validados na API.

TAREFA 2: Atualize docs/uml/03-classe/ (md, puml e png) para bater com o schema
final: mesmos nomes de classe, atributos e multiplicidades. Explique no .md o que
mudou em relação à Parte 1.

Commits pequenos (ex.: "docs(docs): adiciona mer/der do banco",
"docs(docs): alinha diagrama de classes ao schema"). Push e PR para a main pedindo
review da Amanda.

REGRAS: use a identidade git já configurada nesta máquina (se estiver vazia, pare e
me avise). NÃO adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de
atribuição no commit ou no PR. Não use --author.
```

---

## Prompt H (Hellen): README v2

Depois do merge do #16. Se o PR das telas ainda não tiver entrado, deixe o estado
das telas e o link para atualizar no fim.

```
Você está no repositório do SGP. Tarefa: atualizar o README.md da raiz para a v2,
seguindo o modelo da disciplina (seções marcadas como N2). Não mexa em código.
Leia antes docs/arquitetura/plano-n2.md (seção 3 tem tudo o que a API entrega).

PASSO 0: git checkout main && git pull && git checkout -b docs/n2-readme-v2

No README.md:
- Badge "entrega atual" de N1 para N2.
- Nova seção "Modelagem (UML)": os 4 diagramas de docs/uml/ (imagem + um parágrafo
  curto explicando cada um, com link para o passo a passo).
- Nova seção "Modelo de Dados": link e imagem de docs/modelo-dados/ (se ainda não
  existir, deixe o link e avise no PR).
- Nova seção "Decisões Arquiteturais (ADRs)": tabela com os ADRs de docs/adr/.
- Seção "Arquitetura": as camadas da API (controller → service → repository →
  Prisma → MySQL), o guard JWT e como web e API conversam (VITE_API_URL).
- "Especificação da API": a tabela de rotas da seção 3 do plano.
- "Como rodar": API (cd apps/api, npm install --legacy-peer-deps, copiar
  .env.example para .env e preencher, npx prisma migrate deploy, npx prisma db
  seed, npm run start:dev) e web (cd apps/web-professor, npm install, .env com
  VITE_API_URL, npm run dev). Inclua as versões de Node, NestJS, Vue, Prisma e
  MySQL (leia dos package.json e do plano).
- "Sistema hospedado": link da web, link da API (/health) e a conta de
  demonstração ana.costa@escola.edu.br / sgp2026.
- Troque "Estado atual (N1)" por "Estado atual (N2)": o que já está integrado ao
  banco e o que fica para a N3 (PDF real, leitura real do QR Code e do
  cartão-resposta, funcionamento offline).
- Na tabela da equipe, atualize o papel de cada um com o que fez na N2.
- Atualize o Sumário.

Commit: "docs: atualiza readme para a v2". Push e PR para a main pedindo review do
Thiago.

REGRAS: use a identidade git já configurada nesta máquina (se estiver vazia, pare e
me avise). NÃO adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de
atribuição no commit ou no PR. Não use --author.
```

---

## Prompt M (Marceu): teste de ponta a ponta no sistema hospedado

Depois do merge do PR das telas e do redeploy na Vercel.

```
Você está no repositório do SGP. A N2 está integrada ao banco e publicada em
https://sgp-provas.vercel.app. Tarefa: testar o sistema publicado de ponta a ponta,
registrar o resultado e corrigir o que estiver quebrado.

PASSO 0: git checkout main && git pull && git checkout -b test/n2-ponta-a-ponta

TAREFA 1: Com o Playwright (se o Chromium não estiver instalado, use npx playwright
install chromium), no site publicado, com a conta ana.costa@escola.edu.br /
sgp2026: login; criar, editar e excluir turma; adicionar, editar e remover aluno;
criar, editar e excluir questão objetiva e discursiva; criar, editar e excluir
prova; criar aplicação e gerar versões; corrigir uma prova na tela de correção
(celular, 390x844); lançar uma nota manual; ver o relatório e baixar o CSV; sair.
Tire um print de cada passo em docs/testes/n2/.

TAREFA 2: docs/testes/n2-ponta-a-ponta.md com uma tabela (passo, resultado esperado,
resultado obtido, print) e a confirmação de que nenhuma tela usa dado fixo (rode
grep -rn "mocks" apps/web-professor/src).

TAREFA 3: Se algo falhar, corrija no código em commits separados (ex.:
"fix(web-professor): corrige ...") e repita o teste daquele passo. No fim, apague
do banco o que o teste criou (pela própria tela), deixando só os dados do seed.

Push e PR para a main pedindo review do Thiago.

REGRAS: use a identidade git já configurada nesta máquina (se estiver vazia, pare e
me avise). NÃO adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de
atribuição no commit ou no PR. Não use --author.
```

---

## 5. Checklist final (Thiago)

- [ ] Nenhum PR aberto; todos com Approve antes do merge.
- [ ] `grep -rn "mocks" apps/web-professor/src` sem resultado.
- [ ] Site publicado: login, CRUD de turmas, alunos, questões e provas, aplicação,
      correção, lançamento manual e relatório funcionando com o banco.
- [ ] Aiven "Running" e `/health` da API respondendo.
- [ ] README v2 com UML, MER/DER, ADRs, rotas e estado da integração.
- [ ] Zip do repositório sem `node_modules` e sem `.env`.
- [ ] Cada um com prints do próprio PR (aberto, review, merge) para o diário,
      separando N1 de N2.
