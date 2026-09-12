<div align="center">

# 🚀 SGP — Sistema de Geração de Provas

**Plataforma web e app mobile para o professor criar, aplicar e corrigir provas de forma automatizada, com geração de estatísticas de desempenho.**

🔗 **Link do sistema hospedado:** https://sgp-provas.vercel.app

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F5A623?style=flat-square)
![Entrega](https://img.shields.io/badge/entrega%20atual-N1-3D348B?style=flat-square)
![Licença](https://img.shields.io/badge/licença-uso%20acadêmico-7B4FA6?style=flat-square)

</div>

## 👥 Equipe (Grupo 10)

Divisão por frente de feature (combinada no grupo; quem tiver mais afinidade com
uma parte pode trocar com o responsável antes de começar):

| Nome completo               | Papel / principais frentes no projeto                          |
| --------------------------- | -------------------------------------------------------------- |
| Amanda Zimmermann           | Turmas — lista de turmas e cadastro de alunos na turma          |
| Hellen Cristina de Oliveira | Banco de questões — lista e editor de questão                   |
| Iago Henrique Pinto Bogler  | Provas e aplicações — montagem de prova, aplicação e PDF        |
| Marceu Lago Pontes Schmidt  | Relatórios e notas + app mobile do professor                    |
| Thiago Luís Lombardi Maes   | Estrutura base do monorepo, autenticação e dashboard            |

## 📑 Sumário

- [1. Objetivo](#1-objetivo)
- [2. Escopo](#2-escopo)
- [3. Principais Requisitos](#3-principais-requisitos)
    - [3.1 Funcionais (RF)](#31-funcionais-rf)
    - [3.2 Não Funcionais (RNF)](#32-não-funcionais-rnf)
- [4. Stack Tecnológica](#4-stack-tecnológica)
- [5. Estrutura de Pastas](#5-estrutura-de-pastas)
- [6. Como rodar o projeto](#6-como-rodar-o-projeto)
- [7. Estado atual (N1)](#7-estado-atual-n1)

---

## 1. Objetivo

O projeto nasce de um problema real relatado por professores: em semanas de avaliação, é comum acumular 200 a 400 provas para corrigir manualmente, o que consome um tempo desproporcional diante das demais atividades docentes e atrasa a devolutiva da nota ao aluno.

O objetivo do SGP é oferecer uma plataforma **exclusiva para o professor** que permita **criar provas com embaralhamento de questões e alternativas**, **gerar o material impresso já pronto para aplicação em sala** e **corrigir as provas de forma automatizada**, via leitura de QR Code e reconhecimento do cartão-resposta pelo aplicativo mobile. Isso reduz drasticamente o tempo de correção (uma turma de 50 alunos em cerca de meia hora), agiliza a devolução do resultado ao aluno (impresso ou por relatório exportado) e produz dados de apoio à análise pedagógica (como a alternativa mais marcada por questão), algo que soluções concorrentes hoje oferecem de forma parcial.

O aluno **não acessa o sistema em nenhum momento**: ele é apenas um dado cadastrado pelo professor (nome/matrícula), usado para identificar a prova física e organizar os resultados.

## 2. Escopo

O sistema é composto por duas frentes de uso do professor, integradas por uma API comum:

- **Web do Professor:** cadastro/login, gestão de turmas (com uma lista simples de alunos por turma — nome e matrícula, sem conta de acesso), banco de questões (objetivas e discursivas), criação de provas reutilizáveis, criação de aplicações (prova aplicada a uma turma), configuração e geração do PDF consolidado (quantidade de versões, embaralhamento, com/sem identificação do aluno), publicação/gestão do gabarito, lançamento manual de nota (provas sem identificação) e relatórios de notas (por aplicação e consolidado, com exportação em CSV/Excel/PDF).
- **App Nativo do Professor (único ponto de acesso à leitura de QR Code):** leitura de QR Code e do cartão-resposta pela câmera, cálculo automático da nota, atribuição automática ao aluno cadastrado na turma quando a prova foi gerada com identificação, e funcionamento **totalmente offline** com fila local de correções e sincronização em segundo plano (com deduplicação e tratamento de conflitos).

**Fora do escopo do MVP:** login/cadastro de aluno e qualquer portal do aluno (consulta de notas, histórico, etc. — o aluno recebe o resultado de forma impressa ou via relatório exportado pelo professor), exclusão física de dados (a LGPD é atendida via anonimização, não exclusão), leitura de QR Code pela web e edição de layout da prova (posicionamento manual de questões cortadas na página) — citada pelo cliente como sugestão futura, mas não coberta na especificação atual.

## 3. Principais Requisitos

### 3.1 Funcionais (RF)

| Código | Requisito                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01   | O sistema deve permitir cadastro e login apenas para o professor, sem nenhuma forma de acesso do aluno ao sistema.                                                                                                                                                                      |
| RF02   | O sistema deve permitir ao professor criar e gerenciar questões objetivas (2 a 5 alternativas) e discursivas, com tags e busca.                                                                                                                                                         |
| RF03   | O sistema deve permitir ao professor criar turmas e cadastrar os alunos da turma como registros simples (nome e matrícula), sem criação de conta de acesso.                                                                                                                             |
| RF04   | O sistema deve permitir ao professor montar provas com até 20 questões, com pontuação independente por questão.                                                                                                                                                                         |
| RF05   | O sistema deve permitir ao professor aplicar uma prova já criada a uma ou mais turmas, gerando aplicações independentes entre si.                                                                                                                                                       |
| RF06   | O sistema deve gerar um PDF único consolidado por aplicação, com controle de quantidade de versões, embaralhamento de questões/alternativas e opção de identificação (ou não) do aluno cadastrado na turma.                                                                             |
| RF07   | O sistema deve gerar um QR Code por versão (ou por aluno, quando identificado) para uso exclusivo do app mobile do professor.                                                                                                                                                           |
| RF08   | O app mobile deve ler o QR Code e o cartão-resposta pela câmera, calcular a nota automaticamente e permitir correção manual do professor antes de confirmar.                                                                                                                            |
| RF09   | Quando a prova tiver identificação do aluno, a nota deve ser atribuída automaticamente ao respectivo registro de aluno na turma ao confirmar a correção; quando não tiver, o professor deve lançar a nota manualmente depois, identificando o aluno pelo nome/matrícula escritos à mão. |
| RF10   | O app mobile deve funcionar totalmente offline após baixar o gabarito da aplicação, salvando as correções em uma fila local com sincronização automática (idempotente e com tratamento de conflitos) ao reconectar.                                                                     |
| RF11   | O sistema deve permitir a publicação/organização do gabarito (por versão ou por aplicação), para uso do próprio professor na devolutiva ao aluno.                                                                                                                                       |
| RF12   | O sistema deve gerar relatórios de notas por aplicação e consolidados, com estatísticas básicas (média, mediana, desvio padrão) e exportação em CSV, Excel e PDF, para o professor repassar o resultado ao aluno ou lançar no sistema acadêmico.                                        |
| RF13   | O sistema deve permitir a anonimização da conta do professor e dos dados de alunos vinculados às turmas (LGPD), preservando o histórico de correções e notas já registradas.                                                                                                            |

### 3.2 Não Funcionais (RNF)

| Código | Requisito                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| RNF01  | O sistema deve suportar entre 500 e 600 professores ativos no primeiro ano, cada um gerenciando suas próprias turmas e alunos cadastrados.       |
| RNF02  | A API deve responder em até 300ms (p95) para operações comuns.                                                                                   |
| RNF03  | O sistema deve manter disponibilidade mensal de 99,5%.                                                                                           |
| RNF04  | O sistema deve usar HTTPS, autenticação JWT com refresh token e rate limiting contra força bruta.                                                |
| RNF05  | O acesso às turmas, questões e notas deve garantir isolamento total entre professores, com logs de acesso registrados.                           |
| RNF06  | O app de correção deve funcionar de forma totalmente offline, incluindo leitura de QR Code, reconhecimento do cartão-resposta e cálculo de nota. |
| RNF07  | O sistema deve manter backup diário do banco de dados, com retenção de 30 dias.                                                                  |
| RNF08  | As regras críticas de negócio devem ter cobertura de testes automatizados igual ou superior a 80%.                                               |

## 4. Stack Tecnológica

![Vue](https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

A arquitetura de alto nível prevê duas frentes de cliente, ambas exclusivas do professor, consumindo uma API comum:

- **Web Professor**: **Vite + Vue 3 (TypeScript)**, com **Vue Router** e **Pinia**. Concentra login, turmas (com cadastro de alunos como registros simples), banco de questões, provas, aplicações, geração de PDF e relatórios.
- **App Nativo do Professor**: **React Native / Expo**, único ponto de acesso do sistema à leitura de QR Code. Responsável pela correção por câmera, funcionamento offline e fila local de sincronização (**SQLite**).
- **API Gateway**: **NestJS** (decidido na N1, entre as duas opções avaliadas — NestJS e Fastify — pela estrutura modular em camadas já pronta), expondo os módulos de Auth (professor), Class (turmas e alunos cadastrados), Exam/Application, Grade (notas) e Sync Service (recebe lotes de correções da fila local, aplica deduplicação por `clientCorrectionId` e resolve conflitos).
- **Persistência**: **MySQL** como banco relacional principal, **Redis** para cache/filas, e **Object Storage** para os PDFs gerados.
- **Vision Service (opcional)**: componente server-side para fallback/verificação de leitura do cartão-resposta com maior precisão quando há conectividade. A leitura em si ocorre on-device, garantindo o funcionamento 100% offline do app.

Bibliotecas de apoio (autenticação JWT + refresh token, hashing de senha, geração de QR Code, leitura de PDF/exportação CSV-Excel-PDF etc.) devem ser listadas aqui conforme forem incorporadas ao projeto.

## 5. Estrutura de Pastas

O projeto reúne duas aplicações de cliente (ambas do professor) e uma API, num monorepo com um pacote por aplicação, mantendo o padrão em camadas (`rota → controle → serviço → repositório → model`) dentro da API. Estrutura já criada no repositório:

```
apps/
  api/                      # API NestJS
    src/
      auth/                 # Feature 1 — cadastro, login e anonimização do professor
      classes/              # Feature 3 — turmas e cadastro de alunos (registros, sem login)
      exams/                # Feature 2 e 4 — questões e provas
      applications/         # Feature 5, 6 e 7 — aplicações, PDF/versões, gabarito
      corrections/          # Feature 8 e 9 — correção e lançamento manual
      reports/              # Feature 12 — relatórios exportáveis
      sync/                 # Sync Service — fila offline, dedup, conflitos
      common/               # guards, interceptors, pipes + health.controller.ts
      app.module.ts
      main.ts
  web-professor/            # Vite + Vue 3 (TypeScript)
    src/
      pages/                # uma tela por arquivo (evita conflito de merge)
      components/           # componentes compartilhados (EmConstrucao, LogoSGP)
      layouts/              # AppShell.vue — sidebar + área de conteúdo
      router/               # todas as rotas do sistema
      mocks/                # dados de exemplo tipados (fase N1)
      styles/               # tokens.css — paleta única do sistema
      main.ts
  mobile-professor/         # React Native / Expo — leitura de QR Code e correção offline
    src/
      screens/
      services/             # fila local (SQLite), sync em background
      offline/
    App.js
docs/
  uml/
  telas/                    # 16 mockups aprovados pelo cliente (PNG)
  arquitetura/
  adr/
  modelo-dados/
  api/
```

> As pastas de banco de dados (`prisma/` ou `migrations/`) entram na N2, junto com a persistência real.

## 6. Como rodar o projeto

Pré-requisito: **Node.js 22+**. Cada app tem suas próprias dependências — instale só a do app em que você vai trabalhar (`node_modules/` não vai versionado; os `package-lock.json` sim).

```bash
# API  → http://localhost:3000/health
cd apps/api && npm install --legacy-peer-deps && npm run start:dev

# Web  → http://localhost:5173
cd apps/web-professor && npm install && npm run dev

# Mobile
cd apps/mobile-professor && npm install && npx expo start
```

O `--legacy-peer-deps` é necessário apenas na API: o npm 10.9.x quebra ao resolver os peers opcionais do vitest 4 (dependência do scaffold do NestJS). O flag contorna o bug sem alterar versão nenhuma.

Antes de implementar qualquer tela, leia o [CONTRIBUTING.md](CONTRIBUTING.md) — ele traz a convenção de commit, o fluxo de branch/PR e a regra de não criar cor nem dado mock novo.

### Deploy da web (Vercel)

A web do professor é uma SPA estática (na N1 roda só com dados mock, sem API), então
o deploy é direto:

| Configuração | Valor |
| --- | --- |
| Root Directory | `apps/web-professor` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

O arquivo `apps/web-professor/vercel.json` já redireciona todas as rotas para o
`index.html`. Sem isso, recarregar a página em `/dashboard` ou abrir um link direto
retorna 404, porque o Vue Router usa modo history e quem resolve a rota é o
navegador, não o servidor.

Cada push na `main` publica automaticamente. Pull requests ganham uma URL de preview,
útil para revisar tela sem precisar rodar o projeto na própria máquina.

## 7. Estado atual (N1)

O que já está no repositório:

| Item | Situação |
| --- | --- |
| Estrutura do monorepo | ✅ criada (`apps/` + `docs/`) |
| API NestJS | ✅ sobe com `GET /health` respondendo 200 |
| Web (Vite + Vue + Router + Pinia) | ✅ scaffold rodando |
| Mobile (Expo) | ✅ scaffold em branco |
| Design tokens (`styles/tokens.css`) | ✅ paleta única extraída dos mockups |
| Layout base (`layouts/AppShell.vue`) | ✅ sidebar, menu com item ativo, breadcrumb, ações e slots de conteúdo |
| Rotas de todas as telas | ✅ 12 rotas, cada tela com placeholder "Em construção" |
| Dados mock tipados (`src/mocks/`) | ✅ turmas, questões, provas, aplicações, correções + `types.ts` |
| Mockups das 16 telas | ✅ em [`docs/telas/`](docs/telas/) |
| Telas de feature implementadas | 🔜 em andamento, uma por integrante |
| Banco de dados, PDF real e leitura de QR Code | 🔜 escopo da N2/N3 |

Nesta fase as telas são **navegáveis com dados mock**: não há banco, autenticação real, geração de PDF nem leitura de câmera. A tela de login aceita qualquer valor e leva ao dashboard.

Regras que valem para todo mundo nesta fase:

- **Não invente cor:** use exclusivamente as variáveis de `apps/web-professor/src/styles/tokens.css`.
- **Não duplique dado mock:** importe de `apps/web-professor/src/mocks/` — os dados de exemplo (turma "Matemática — 1º Ano" com 32 alunos, aluna Beatriz Almeida 2026001, professora Ana Costa, prova "Avaliação Bimestral 1") são os mesmos dos mockups aprovados.
- **Não adicione dependência de banco** (MySQL, Prisma, Redis): isso é N2.
- **O aluno não acessa o sistema:** nunca crie campo de e-mail, senha ou login para aluno.

---

<div align="center">

_README elaborado para a disciplina de Projeto e Arquitetura de Software — Grupo 10_

</div>
