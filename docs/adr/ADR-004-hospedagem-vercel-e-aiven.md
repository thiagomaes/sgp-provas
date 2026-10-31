# ADR-004: Hospedagem na Vercel com banco MySQL no Aiven

- **Status:** aceita
- **Data:** 30/10/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

A N2 não é avaliada só pelo código: o critério C2 exige cadastrar, listar,
editar e excluir funcionando **no sistema hospedado**, acessível por um link.
Não basta rodar na máquina de quem desenvolveu.

O ponto de partida e as restrições:

- **A web já estava publicada desde a N1** em
  [sgp-provas.vercel.app](https://sgp-provas.vercel.app), num projeto Vercel
  ligado ao repositório. O feedback da N1 foi dado sobre esse link, e o
  [ADR-001](ADR-001-web-responsiva-no-lugar-de-app-nativo.md) consolidou tudo
  num único sistema web, inclusive a correção.
- **Agora é preciso hospedar mais duas coisas:** a API NestJS e o banco MySQL.
- **Não há orçamento.** É trabalho de disciplina, sem verba e sem vontade de
  cadastrar cartão de crédito de ninguém do grupo. Tudo tem que caber em plano
  gratuito, sem prazo de validade até a apresentação.
- **O banco tem que ser MySQL**, por exigência da disciplina
  ([ADR-002](ADR-002-mysql-com-prisma.md)).
- **A entrega é de um dia.** Não há tempo para administrar servidor, container
  ou certificado na mão.

## Decisão

**Web e API ficam na Vercel; o banco MySQL 8.4 fica no Aiven, no plano Free.**

### Web e API na Vercel

São **dois projetos Vercel** sobre o mesmo repositório, cada um com seu Root
Directory: `apps/web-professor` (build do Vite, servido como site estático) e
`apps/api` (Root Directory `apps/api`).

A **API NestJS roda como função serverless**, não como servidor sempre ligado:
cada requisição HTTP é atendida por uma invocação da função. Isso tem quatro
consequências que moldaram o resto da arquitetura:

- Não há memória entre requisições, o que reforça a autenticação stateless do
  [ADR-003](ADR-003-autenticacao-jwt.md).
- Na Vercel, o `src/main.ts` exporta um handler em vez de chamar `app.listen()`,
  que travava a função e fazia toda rota responder 500. O `app.listen()` continua
  sendo usado fora da Vercel, no desenvolvimento local.
- O Prisma precisa do binário do ambiente da Vercel. Por isso o `schema.prisma`
  declara
  `binaryTargets = ["native", "rhel-openssl-3.0.x", "linux-arm64-openssl-3.0.x"]`
  e o `package.json` roda `prisma generate` no `postinstall` — sem os dois, a API
  quebra em produção.
- Migration nunca roda no build: o banco é migrado com `prisma migrate deploy`
  à parte.

A web conversa com a API pela variável `VITE_API_URL`, e a API libera no CORS
apenas a origem da web, pela variável `WEB_ORIGIN`. Nenhum dos dois endereços
fica escrito no código.

As variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`WEB_ORIGIN`, `VITE_API_URL`) são configuradas no painel da Vercel. **Nenhuma
delas vai para o Git**: o repositório tem só o `apps/api/.env.example` com
valores de exemplo.

O deploy é automático a cada push na `main`, o que fecha o ciclo do fluxo de PR
descrito no `CONTRIBUTING.md`.

### Banco no Aiven

O serviço `sgp-provas-db` é um **MySQL 8.4** no plano Free do Aiven, acessado
pela internet com TLS. É MySQL de verdade, administrado pelo provedor: backup,
atualização e certificado não são problema do grupo.

A string de conexão fica na `DATABASE_URL`, no formato do Prisma.

## Alternativas consideradas

**TiDB Cloud.** Tem plano gratuito generoso e fala o protocolo do MySQL, então o
Prisma conectaria com o mesmo `provider = "mysql"`. Foi descartada porque é
**compatível com MySQL, não é o MySQL**: é um banco distribuído com motor
próprio, com diferenças de comportamento (chaves auto-incremento, transações,
`FOREIGN KEY`). Como a disciplina pede MySQL, entregar um banco
"MySQL-compatível" abriria discussão desnecessária na avaliação.

**Supabase.** Seria a opção mais confortável — banco, painel, autenticação e
plano gratuito estável no mesmo lugar. **Descartada por ser PostgreSQL**, o que
contraria a exigência da disciplina. Nenhuma vantagem de produto compensa
entregar o banco errado.

**Railway.** Sobe MySQL em poucos cliques e tem boa experiência de uso, mas hoje
oferece apenas **período de teste / crédito inicial**, sem plano gratuito
permanente. O crédito acabaria antes da apresentação e o banco sairia do ar
justamente na correção — risco inaceitável para o critério C2.

**Banco na máquina de alguém do grupo** (MySQL local exposto por túnel). Sem
custo, mas depende do computador ligado para o sistema funcionar, e os dados do
trabalho ficariam na máquina de uma pessoa. Descartada de saída.

## Consequências

**Positivas**

- **Um link para tudo.** Web, API e banco no ar, de graça, sem cartão de
  crédito, com MySQL de verdade.
- **Deploy automático** a cada merge na `main`, sem ninguém publicar na mão.
- **Nada de infraestrutura para administrar.** Sem servidor, sem container, sem
  renovar certificado; HTTPS vem pronto nos dois projetos Vercel.
- **Configuração fora do código.** Trocar a URL da API ou a senha do banco é
  mexer em variável de ambiente e redeployar.

**Negativas e riscos**

- **O plano Free do Aiven desliga o banco quando ele fica parado.** Depois de um
  tempo sem uso o serviço é suspenso, e a primeira requisição que chega precisa
  esperar o banco voltar — pode demorar bastante ou até falhar por timeout, e a
  tela mostra erro sem motivo aparente. **Mitigação operacional:** conferir no
  painel do Aiven se o serviço está "Running" antes de entregar e perto da
  correção, e abrir o sistema alguns minutos antes de apresentar.
- **A conexão aceita o certificado sem verificar.** A `DATABASE_URL` usa
  `?sslaccept=accept_invalid_certs`, porque o Aiven apresenta um certificado
  próprio que não está na lista de raízes confiáveis do ambiente da Vercel. O
  tráfego **é cifrado**, mas sem validar a identidade do servidor, o que deixa a
  conexão teoricamente exposta a um ataque de intermediário. É um risco aceito
  para um trabalho acadêmico, com dados de exemplo.

  **Como trocar pelo CA do Aiven:** baixar o `ca.pem` do serviço (painel do
  Aiven, nas informações de conexão) e substituir o parâmetro por
  `?sslcert=caminho/ca.pem` na `DATABASE_URL`, como o
  `apps/api/.env.example` já documenta. Em função serverless isso exige que o
  arquivo seja publicado junto do deploy, o que fica como melhoria da N3.
- **Cold start.** Função serverless que não é chamada há um tempo demora mais na
  primeira requisição. Somado ao banco suspenso, o primeiro acesso do dia é
  sensivelmente mais lento que o RNF02 (300ms no p95) — número que vale para a
  API aquecida.
- **Dois projetos Vercel para manter em sincronia.** Mudar a URL da API obriga a
  atualizar a `VITE_API_URL` na web e a `WEB_ORIGIN` na API; esquecer um dos
  lados derruba tudo com erro de CORS.
- **Dependência de três contas de terceiros** (GitHub, Vercel, Aiven), todas em
  plano gratuito, com termos que podem mudar. A senha do banco e os segredos JWT
  vivem no painel da Vercel: se a conta que criou os projetos ficar
  indisponível, o grupo perde acesso ao deploy.
- **Limites do plano gratuito.** Armazenamento e conexões simultâneas do Aiven
  Free são pequenos. Atende aos dados de exemplo e ao uso da avaliação, mas não
  ao RNF01 (500 a 600 professores) — um cenário real exigiria plano pago.
- **Backup diário com 30 dias de retenção (RNF07) não está contemplado** no
  plano Free.
