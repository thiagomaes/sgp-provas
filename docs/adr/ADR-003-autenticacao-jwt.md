# ADR-003: Autenticação JWT só do professor

- **Status:** aceita
- **Data:** 30/10/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

Na N1 a tela de login era enfeite: aceitava qualquer valor e levava ao
dashboard. Na N2 os dados passam a ficar num banco compartilhado e hospedado,
então o login precisa ser real.

Os requisitos que delimitam a decisão:

- **RF01:** cadastro e login **apenas para o professor**. O aluno não acessa o
  sistema em nenhum momento — ele é só um registro dentro da turma (nome e
  matrícula), sem conta, sem e-mail e sem senha. Isso reduz muito o problema:
  existe um único tipo de usuário e não há papéis nem permissões para modelar.
- **RNF04:** HTTPS, autenticação **JWT com refresh token** e proteção contra
  força bruta.
- **RNF05:** isolamento **total** entre professores — um professor nunca pode
  ver nem alterar turma, questão, prova ou nota de outro.
- **RF13:** anonimização da conta do professor (LGPD) preservando o histórico de
  correções, ou seja, a conta deixa de logar sem que os dados sejam apagados.

Duas restrições técnicas pesaram junto:

- **A API roda como função serverless na Vercel**
  ([ADR-004](ADR-004-hospedagem-vercel-e-aiven.md)). Não há processo de longa
  duração nem memória entre requisições, então guardar sessão na memória do
  servidor não é possível.
- **Web e API ficam em domínios diferentes.** A web é um projeto Vercel e a API
  é outro, o que torna cookie compartilhado entre os dois um problema de
  configuração (`SameSite`, domínio, CORS com credenciais) em vez de uma
  facilidade.

## Decisão

Autenticação por **JWT, com dois tokens de validade diferente**, emitidos pela
própria API — sem provedor externo.

### Access token de 1 hora

Assinado com `JWT_SECRET` e validade de 1 hora, configurada no
`src/common/common.module.ts`. Vai em toda requisição no cabeçalho
`Authorization: Bearer <token>` e carrega só o necessário: o id do professor
(`sub`) e o e-mail. É validado em memória, sem consultar o banco, o que mantém a
API stateless.

### Refresh token de 7 dias, guardado com hash

O refresh token é assinado com um segredo **separado**
(`JWT_REFRESH_SECRET`) e vale 7 dias, para o professor não ter que logar de novo
toda hora. O que o banco guarda não é o token: é o **hash SHA-256** dele, na
tabela `RefreshToken`. Quem tiver acesso de leitura ao banco não consegue se
passar por ninguém.

Além disso, o token é **rotacionado a cada uso**: ao renovar, o antigo é
revogado antes de o novo ser emitido. Um refresh token vazado só serve uma vez,
e a revogação é feita de forma condicional — se dois pedidos chegarem com o
mesmo token ao mesmo tempo, apenas um consegue renovar. Cada token leva um `jti`
aleatório, para que dois emitidos no mesmo segundo não sejam iguais.

O `POST /auth/logout` revoga o refresh token daquele dispositivo e **exige estar
logado**, aceitando apenas token do próprio professor.

### Senhas com bcryptjs

As senhas são guardadas como hash **bcrypt com custo 10**, usando a biblioteca
**`bcryptjs`** no lugar do `bcrypt`. É o mesmo algoritmo, mas em JavaScript
puro, **sem binário nativo**: o `bcrypt` precisa compilar código nativo na
instalação, o que falha no build das funções da Vercel. A diferença é
desempenho, irrelevante no volume do RNF01 (500 a 600 professores).

Dois cuidados acompanham o login:

- **A mensagem de erro é a mesma** para e-mail inexistente e senha errada
  ("E-mail ou senha incorretos"), para não revelar quais e-mails estão
  cadastrados.
- **Conta anonimizada não loga.** Se `anonymizedAt` estiver preenchido, o login
  e a renovação são recusados, o que atende ao RF13 sem apagar o histórico.

### Guard JWT global, rota pública é exceção

O `JwtAuthGuard` é registrado como **guard global** no `AppModule` (via
`APP_GUARD`). Toda rota da API nasce protegida; para abrir uma, é preciso
marcá-la explicitamente com o decorator `@Publica()`. Hoje só quatro rotas são
públicas:

| Rota | Por quê |
| --- | --- |
| `GET /health` | checagem de que a API está no ar |
| `POST /auth/register` | criar a conta |
| `POST /auth/login` | entrar |
| `POST /auth/refresh` | renovar a sessão |

A escolha do padrão importa: numa lista de rotas protegidas, esquecer de
adicionar a rota nova a deixa **aberta**. Com o guard global, o esquecimento
deixa a rota **fechada** — o erro aparece no primeiro teste, em vez de virar um
vazamento silencioso.

### Cada professor só acessa os próprios dados

O guard coloca o id do professor na requisição, lido nos controllers pelo
decorator `@CurrentProfessor()`. Esse id **nunca vem do corpo nem da URL**, só
do token — o cliente não tem como pedir os dados de outra pessoa.

No banco, `Turma`, `Questao`, `Prova` e `Aplicacao` têm `professorId`, e as
consultas dos repositories sempre filtram por ele. Alunos, versões e correções
herdam o isolamento pela turma e pela aplicação. Buscar um registro de outro
professor devolve "não encontrado", não "proibido".

Complementando, o CORS da API libera apenas a origem da web (`WEB_ORIGIN`) e,
em desenvolvimento, o Vite local.

## Alternativas consideradas

**Sessão em cookie com estado no servidor.** É o modelo clássico: o servidor
guarda a sessão e o navegador só carrega o identificador, com a vantagem de o
cookie `HttpOnly` não ficar exposto ao JavaScript da página. Foi descartada por
duas razões. A primeira é a hospedagem: função serverless não tem memória entre
requisições, então a sessão precisaria de um armazenamento compartilhado (Redis
ou uma tabela de sessões) — mais infraestrutura para manter no plano gratuito.
A segunda é que web e API estão em domínios diferentes, o que exigiria cookie de
terceiros com `SameSite=None`, CORS com credenciais e um domínio próprio para
ficar confiável. O RNF04, aliás, já pede JWT com refresh token nominalmente.

**Provedor externo (Auth0, Firebase Authentication, Clerk).** Resolveria login
social, recuperação de senha e verificação de e-mail sem código nosso. Foi
descartada porque tiraria do escopo avaliado justamente a parte que a disciplina
quer ver implementada; criaria dependência de uma conta de terceiro e de um
plano gratuito com limites fora do nosso controle, num semestre em que o sistema
precisa estar no ar na correção; e, mesmo assim, não resolveria o problema
central — o `professorId` que isola os dados é do nosso domínio e continuaria
tendo que ser mantido e verificado por nós em cada consulta.

## Consequências

**Positivas**

- **API stateless.** O access token é verificado sem ida ao banco, o que combina
  com a função serverless e ajuda no RNF02 (300ms no p95).
- **Vazamento do banco não dá acesso.** Senhas em bcrypt e refresh tokens só em
  hash SHA-256.
- **Token roubado tem vida curta.** O access expira em 1h e o refresh morre no
  primeiro uso por quem o roubou — e, quando o legítimo tentar usar, a sessão
  cai, o que torna o incidente perceptível.
- **Rota nova nasce protegida**, pelo guard global.
- **Isolamento vindo do token**, não de parâmetro enviado pelo cliente.

**Negativas e riscos**

- **O token fica no navegador.** Como não há cookie `HttpOnly`, o access token é
  guardado pela web e, em caso de XSS, pode ser lido. A mitigação é a validade
  curta e o Vue escapar interpolação por padrão.
- **Logout não invalida o access token.** Ele continua válido até expirar, no
  máximo 1 hora; só o refresh é revogado. Para invalidação imediata seria
  preciso uma lista de bloqueio consultada a cada requisição, o que desfaria o
  ganho de ser stateless.
- **Rate limiting ainda não está implementado.** O RNF04 pede proteção contra
  força bruta; hoje existem apenas a mensagem de erro genérica e o custo do
  bcrypt. Um throttler no `/auth/login` fica como pendência da N3.
- **Recuperação de senha não existe.** Professor que esquecer a senha depende de
  intervenção manual no banco.
- **A tabela de refresh tokens cresce.** Tokens revogados ou expirados ficam
  guardados; falta uma limpeza periódica.
- **Dois segredos para gerenciar** (`JWT_SECRET` e `JWT_REFRESH_SECRET`). Ambos
  só em variável de ambiente; trocá-los desloga todo mundo, e o `.env` nunca vai
  para o Git.
