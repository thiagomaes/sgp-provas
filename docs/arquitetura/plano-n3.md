# Plano da N3: refinamento, entrega final e apresentação (Grupo 10)

> **Criado em 06/11/2026**, a partir da atividade "Revisão e Backlog N3". A revisão
> comparou o sistema publicado, o repositório e os requisitos do README com o relato
> do cliente. O resultado está na planilha `Revisao-Backlog-N3-Grupo10.xlsx`
> (aba 1: requisitos pendentes; aba 2: backlog) e este plano é a versão para o
> repositório, com a ordem do trabalho, os revisores e um prompt por integrante.

## 1. O que a N3 exige

Entrega até **27/11/2026**; apresentação ao cliente em data a combinar.

- **C2 (50%) Sistema hospedado na versão final:** tudo o que foi combinado com o
  cliente funcionando e ligado ao banco, **mergeado na main** (PR aberto não conta),
  com validações e casos de borda tratados.
- **C3 (20%) Documentação:** README final no modelo da disciplina, arquitetura em
  camadas, ADRs e **manual do usuário** (`docs/manual-usuario.md`).
- **C1 (10%) Código zipado** e **C4 (10%) diário individual** com as evidências da fase.
- Todas as Issues fechadas, nenhum PR pendente, teste de ponta a ponta do fluxo
  completo e o **pitch** para o cliente.

## 2. Revisão: onde o sistema está hoje

O que o cliente chamou de **essencial** é "gerar e corrigir a prova de forma
automatizada e fácil". Hoje o sistema cadastra tudo, sorteia as versões e grava as
notas, mas **ainda não gera o PDF nem lê o cartão pela câmera** (a leitura é
simulada). Esse é o centro da N3.

| Requisito | Já funciona | Falta | Tarefas |
|---|---|---|---|
| RF01 Cadastro e login | Login, logout, sessão | Tela de cadastro, recuperação de senha | T16, T17 |
| RF02 Questões | CRUD, busca, tags, exclusão lógica | Testar casos de borda | T22 |
| RF03 Turmas e alunos | CRUD, matrícula única | Importar alunos por planilha (pedido do cliente) | T18 |
| RF04 Provas | CRUD, limite de 20 | Testar casos de borda | T22 |
| RF05 Aplicações | Uma turma por vez, versões | Várias turmas, status "Concluída" sozinho | T06 |
| **RF06 PDF consolidado** | Configuração e sorteio | **Gerar o PDF** (caderno + cartão-resposta, sem cortar questão) | T02, T03 |
| RF07 QR Code | Por versão | Por aluno na prova identificada | T04 |
| **RF08 Leitura pela câmera** | Câmera abre, grava a nota | **Ler o QR Code e as marcações** | T07, T08 |
| RF09 Nota no aluno | Lançamento manual | Atribuição automática pelo QR Code | T09 |
| RF10 Offline | API não duplica | PWA, cache, fila local, sincronização | T11 |
| RF11 Gabarito | Está no banco | Tela para ver e imprimir | T05 |
| RF12 Relatórios | Média, mediana, desvio, CSV | Estatística por questão, Excel com a alternativa marcada, consolidado na web, PDF | T12 a T14 |
| RF13 LGPD | Campo `anonymizedAt` | Rota e tela | T19 |
| RNF02/03/07 Desempenho, disponibilidade, backup | Nada medido | Medir, monitorar, conferir backup | T20, T25 |
| RNF04 Segurança | HTTPS, JWT | Rate limit, CA do Aiven, npm audit | T10, T25 |
| RNF05 Isolamento e logs | Filtro por professor | Teste com 2 professores, log de acesso | T23 |
| RNF08 Testes 80% | 30 testes | Medir e completar a cobertura | T24 |
| RNF09 Validações (escopo N3) | Parcial | Revisar todas as telas | T22 |
| RNF10 Usabilidade | Telas do protótipo | Teste com uma pessoa de fora | T29 |

**Fora do MVP:** portal ou login do aluno e edição manual do layout em `.doc`. O PDF
da T03 já resolve a queixa principal do cliente (questão cortada no meio da página).

## 3. Backlog por integrante

132 horas no total, entre 23 e 29 horas por pessoa. Detalhes de cada tarefa na
planilha e nas Issues.

**Thiago: correção pela câmera, segurança e entrega (28 h)**

| ID | Tarefa | Prazo | Depende de |
|---|---|---|---|
| T01 (#61) | Issues da N3 e este plano no repositório | 09/11 | |
| T02 (#62) | Layout do cartão-resposta (`docs/arquitetura/cartao-resposta.md`) | 10/11 | |
| T10 (#53) | Rate limit no login e CA do Aiven | 12/11 | |
| T07 (#50) | Ler o QR Code pela câmera | 14/11 | T02 |
| T08 (#65) | Reconhecer as marcações do cartão-resposta | 20/11 | T02, T03 |
| T09 (#66) | Atribuir a nota ao aluno identificado | 21/11 | T04, T07 |
| T30 (#80) | Montar e enviar a entrega | 27/11 | T21, T28 |

**Iago: provas e aplicações (27 h)**

| ID | Tarefa | Prazo | Depende de |
|---|---|---|---|
| T06 (#52) | Status "Concluída" automático e várias turmas | 13/11 | |
| T03 (#49) | Gerar o PDF consolidado da aplicação | 16/11 | T02 |
| T04 (#63) | Prova identificada: versão e QR Code por aluno | 18/11 | T03 |
| T05 (#64) | Tela de gabarito por versão | 19/11 | T03 |
| T26 (#76) | Atualizar UML e MER/DER | 23/11 | T04, T17, T23 |
| T28 (#78) | Manual do usuário | 25/11 | T27 |

**Marceu: relatórios, offline e apresentação (29 h)**

| ID | Tarefa | Prazo | Depende de |
|---|---|---|---|
| T12 (#67) | Estatística por questão (acerto e alternativa mais marcada) | 14/11 | |
| T13 (#56) | Exportar notas em Excel com a alternativa marcada | 16/11 | T12 |
| T14 (#68) | Relatório consolidado na web e PDF | 18/11 | T13 |
| T11 (#51) | Correção offline (PWA) | 22/11 | T08 |
| T29 (#79) | Teste de uso com uma pessoa de fora | 24/11 | T27 |
| T15 (#69) | Apresentação (pitch) para o cliente | 26/11 | T27 |

**Amanda: conta do professor, alunos e README (25 h)**

| ID | Tarefa | Prazo | Depende de |
|---|---|---|---|
| T16 (#70) | Tela de cadastro do professor | 12/11 | |
| T18 (#71) | Importar alunos por planilha | 16/11 | |
| T20 (#72) | Backup e disponibilidade | 19/11 | |
| T17 (#54) | Recuperação de senha | 20/11 | T16 |
| T19 (#55) | Anonimização da conta (LGPD) | 21/11 | |
| T21 (#59) | README final e novos ADRs | 25/11 | T03, T08, T11 |

**Hellen: qualidade e testes (23 h)**

| ID | Tarefa | Prazo | Depende de |
|---|---|---|---|
| T23 (#74) | Logs de acesso e teste de isolamento | 17/11 | |
| T22 (#73) | Validações e mensagens de erro em todas as telas | 18/11 | |
| T25 (#58) | Medir desempenho e corrigir o npm audit | 19/11 | |
| T24 (#75) | Cobertura de testes de 80% | 21/11 | |
| T27 (#77) | Teste de ponta a ponta da N3 | 24/11 | T03 a T14 |

## 4. Ordem do trabalho

- **Semana 1 (09 a 15/11):** T01 e T02 primeiro, porque o layout do cartão destrava o
  PDF e a leitura. Em paralelo, o que não depende de ninguém: T06, T10, T12, T16, T23.
- **Semana 2 (16 a 22/11):** o núcleo: PDF (T03, T04, T05), leitura (T07 a T09),
  Excel e relatórios (T13, T14), offline (T11), conta e alunos (T17 a T20),
  qualidade (T22, T24, T25).
- **Semana 3 (23 a 27/11):** teste de ponta a ponta (T27), teste com pessoa de fora
  (T29), UML (T26), manual (T28), README final (T21), pitch (T15) e entrega (T30).

## 5. Revisores

| Autor do PR | Quem aprova |
|---|---|
| Thiago | Iago |
| Iago | Thiago |
| Amanda | Marceu |
| Marceu | Hellen |
| Hellen | Amanda |

Thiago e Iago revisam um ao outro porque o PDF e a leitura usam o mesmo layout de
cartão: um erro de um aparece no trabalho do outro.

Regras para todo mundo:
- Uma branch por tarefa, a partir da `main` atualizada (`git checkout main && git pull`).
- PR com `Closes #<issue>` na descrição. Só entra depois do **Approve** do revisor
  (Files changed, Review changes, Approve, Submit review). Merge sem Approve não conta
  no diário.
- Commits com a própria conta, em português, no padrão `tipo(escopo): descrição`, sem
  Co-Authored-By nem menção a IA.
- Use só as cores de `apps/web-professor/src/styles/tokens.css`, nenhum dado fixo nas
  telas, e nunca commite `.env`, `.vercel/`, senha ou URL do banco.
- O aluno não acessa o sistema: nunca crie login para aluno.

## 6. Prompts para o Claude Code

Cada um cola o seu prompt no Claude Code, na pasta do repositório, **uma tarefa por
vez**, trocando `<TAREFA>` pelo ID e `<ISSUE>` pelo número da Issue. Todos terminam
com o mesmo bloco de regras.

### Bloco de regras (vai no fim de todos os prompts)

```
REGRAS: comece com git checkout main && git pull e crie uma branch nova para esta
tarefa. Leia o README, o docs/arquitetura/plano-n3.md e o código da área antes de
mexer. Siga as camadas da API (controller, service, repository) e use só as cores de
apps/web-professor/src/styles/tokens.css. Nenhum dado fixo nas telas. Rode npm run
build na web e npm test na API antes do PR. Commits pequenos em português no padrão
tipo(escopo): descrição. Abra o PR para a main com "Closes #<ISSUE>" na descrição e
peça review de <REVISOR> (veja a tabela de revisores do plano-n3.md). NÃO faça o
merge. Use a identidade git e o gh já configurados nesta máquina (confira com git
config user.name e gh auth status; se não for a sua conta, pare e me avise). NÃO
adicione Co-Authored-By, menção a Claude ou IA, nem rodapé de atribuição em commits
ou PRs. Nunca commite .env, .vercel/, senha ou URL do banco.
```

### Prompt Thiago: correção pela câmera

```
Tarefa <TAREFA> do docs/arquitetura/plano-n3.md (correção pela câmera do SGP).
- T02: escreva docs/arquitetura/cartao-resposta.md com o layout do cartão-resposta
  (A4, quatro marcas quadradas nos cantos para alinhar a foto, QR Code no topo,
  nome e matrícula, grade com uma linha por questão e uma bolinha por alternativa,
  até 20 questões e 5 alternativas, medidas em mm). Esse documento é o contrato
  entre o PDF (T03, Iago) e a leitura (T07/T08).
- T07: na CorrecaoEscanearPage, decodifique o QR Code do vídeo da câmera (jsQR ou
  BarcodeDetector, com fallback), valide que a aplicação e a versão existem e
  pertencem ao professor, e mostre erro claro se não pertencerem.
- T08: depois do QR Code, capture a foto do cartão, ache as quatro marcas, corrija a
  perspectiva num canvas, meça o preenchimento de cada bolinha e monte as respostas;
  calcule a nota com o gabarito da versão e leve para a CorrecaoRevisaoPage, onde o
  professor ainda pode ajustar. Tudo no navegador, sem servidor (vai rodar offline).
  Teste com fotos de cartões impressos do PDF da T03 e escreva testes da lógica de
  leitura com imagens de exemplo.
- T09: se a versão lida for de uma prova identificada (T04), grave a nota direto no
  aluno; se não for, mantenha o fluxo de lançamento manual.
- T10: rate limit no POST /auth/login com @nestjs/throttler (ex.: 5 tentativas por
  minuto por IP, resposta 429 com mensagem) e conexão Prisma verificando o
  certificado (CA) do Aiven em vez de sslaccept=accept_invalid_certs; documente a
  variável nova no .env.example e no ADR-004.
[cole aqui o bloco de regras, com REVISOR = Iagobogler]
```

### Prompt Iago: PDF, prova identificada e gabarito

```
Tarefa <TAREFA> do docs/arquitetura/plano-n3.md (provas e aplicações do SGP).
- T03: gere o PDF consolidado da aplicação no POST /applications/:id/generate (ou
  numa rota GET /applications/:id/pdf), com uma biblioteca de PDF para Node
  (ex.: pdfkit ou pdfmake). Para cada versão: o caderno com as questões e as
  alternativas na ordem sorteada (layout da VersaoProva) e o cartão-resposta no
  layout de docs/arquitetura/cartao-resposta.md, com o QR Code da versão. Nenhuma
  questão pode começar numa página e terminar em outra. Na web, o botão "Gerar PDF"
  baixa o arquivo. Abra o PDF e confira página por página.
- T04: quando a aplicação tiver identificarAluno, gere uma versão por aluno da turma
  e guarde o aluno na versão (ajuste o schema.prisma com migration); o cartão sai
  com nome e matrícula, e o QR Code identifica o aluno.
- T05: tela de gabarito da aplicação, com a resposta certa de cada questão em cada
  versão, pronta para imprimir.
- T06: a aplicação muda para "concluida" quando corrigidas = número de alunos, e
  volta para "em-correcao" se uma correção for apagada; na criação, permita marcar
  mais de uma turma (gera uma aplicação por turma).
- T26: atualize docs/uml (classe e sequência) e docs/modelo-dados se o schema mudou.
- T28: escreva docs/manual-usuario.md do ponto de vista do professor (entrar,
  cadastrar turma e alunos, montar questões e prova, gerar o PDF, corrigir pelo
  celular, ver e exportar notas), com prints do sistema publicado em
  docs/manual/, e link no README.
[cole aqui o bloco de regras, com REVISOR = thiagomaes]
```

### Prompt Marceu: relatórios, offline e apresentação

```
Tarefa <TAREFA> do docs/arquitetura/plano-n3.md (relatórios e correção offline do SGP).
- T12: no relatório da aplicação (API e RelatorioDetalhePage), para cada questão:
  percentual de acerto e quantas vezes cada alternativa foi marcada, destacando a
  mais marcada. Use o campo respostas das correções; lembre que cada versão tem uma
  ordem diferente, então converta para a questão e alternativa originais.
- T13: exportação .xlsx (biblioteca exceljs na API) com uma linha por aluno:
  matrícula, nome, nota e, para cada questão, a alternativa que ele marcou e se
  acertou. Botão "Exportar Excel" na tela do relatório.
- T14: botão "Exportar tudo" na tela de Relatórios usando GET /reports/consolidated
  (que você já fez no PR #22) e exportação do relatório da aplicação em PDF.
- T11: transforme a web em PWA (vite-plugin-pwa): guarde o gabarito das aplicações
  em correção, salve as correções feitas sem internet numa fila no IndexedDB com o
  clientCorrectionId, envie sozinho ao voltar a internet e mostre na tela o que
  está pendente ou em conflito.
- T15/T29: roteiro da apresentação em docs/apresentacao.md e registro do teste com
  uma pessoa de fora (o que ela fez, onde travou, o que foi ajustado).
[cole aqui o bloco de regras, com REVISOR = hlleenn]
```

### Prompt Amanda: conta do professor, alunos e README

```
Tarefa <TAREFA> do docs/arquitetura/plano-n3.md (conta do professor e turmas do SGP).
- T16: tela /cadastro ligada ao POST /auth/register (nome, e-mail, senha e
  confirmação), com erro de e-mail repetido vindo da API, senha mínima e link
  "Criar conta" na tela de login; depois do cadastro, entra direto.
- T18: na TurmaDetalhePage, "Importar alunos": o professor envia CSV ou Excel com
  nome e matrícula, vê a prévia, as linhas com erro e as matrículas repetidas
  marcadas, e confirma; a API recebe a lista numa rota só (ex.: POST
  /classes/:id/students/import) e grava numa transação.
- T17: "Esqueci minha senha": token de uso único com validade (tabela nova com
  migration). Se não houver serviço de e-mail, registre o link no log do servidor
  e documente essa limitação no README.
- T19: tela de configurações da conta com "Anonimizar minha conta": a API troca
  nome e e-mail do professor e dos alunos das turmas por valores anônimos, preenche
  anonymizedAt e mantém notas e correções; confirmação na própria tela.
- T20: confira o backup do plano do Aiven, configure um monitor gratuito do
  https://sgp-provas-api.vercel.app/health e documente os limites no README.
- T21: README final no modelo da disciplina (docs do projeto), estado atual da N3,
  link do manual do usuário, e ADRs novos (PDF, leitura do cartão, offline).
[cole aqui o bloco de regras, com REVISOR = marceuschmidt]
```

### Prompt Hellen: qualidade e testes

```
Tarefa <TAREFA> do docs/arquitetura/plano-n3.md (qualidade do SGP).
- T23: middleware na API que registra cada acesso (professorId, método, rota,
  status, horário, sem dados sensíveis) e teste e2e com dois professores: o
  professor B não pode ler, editar nem apagar turma, questão, prova, aplicação ou
  correção do professor A (todas devem dar 404).
- T22: passe por todas as telas e rotas com campo vazio, dado inválido, item
  inexistente, sessão expirada e sem internet; cada caso precisa de mensagem clara
  na tela e resposta certa da API. Registre os casos testados em
  docs/testes/n3-casos-de-borda.md.
- T24: rode npm run test:cov na API, ache o que falta nas regras críticas
  (calculo-nota, versoes, estatisticas, validacao-questao, correções) e complete
  até pelo menos 80%; coloque o resultado no README.
- T25: meça o tempo de resposta das rotas principais no sistema publicado (ex.: 50
  chamadas com autocannon ou um script), registre o p95 com e sem o banco
  "acordando" em docs/testes/n3-desempenho.md, e resolva o npm audit da web.
- T27: teste de ponta a ponta da N3 no sistema publicado: gerar o PDF, imprimir,
  corrigir pelo celular com e sem internet, conferir notas, estatísticas e Excel;
  registre em docs/testes/n3-ponta-a-ponta.md com prints e limpe os dados de teste.
[cole aqui o bloco de regras, com REVISOR = amandazmn]
```

## 7. Checklist final (Thiago)

- [ ] Todas as tarefas do backlog com PR aprovado e mergeado.
- [ ] Nenhum PR aberto e todas as Issues da N3 fechadas.
- [ ] Teste de ponta a ponta da N3 registrado (T27).
- [ ] README final, manual do usuário e ADRs novos na main.
- [ ] Aiven "Running" e sistema publicado respondendo no dia da entrega e da apresentação.
- [ ] Zip com `git archive`, link do sistema e do repositório enviados.
- [ ] Cada integrante com o diário da N3 pronto.
