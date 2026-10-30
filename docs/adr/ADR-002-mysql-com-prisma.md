# ADR-002: MySQL com Prisma 6 na API NestJS

- **Status:** aceita
- **Data:** 30/10/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

Na N1 o SGP não tinha banco nenhum. As telas de `apps/web-professor` liam de
`src/mocks/`, um conjunto de arrays em TypeScript com as turmas, questões,
provas e aplicações dos mockups aprovados. O próprio README da N1 registrava a
regra: "não adicione dependência de banco (MySQL, Prisma, Redis): isso é N2".

A N2 muda exatamente isso. O critério C2 (40% da nota) exige as telas lendo e
gravando num **MySQL real**, com cadastro, listagem, edição e exclusão
funcionando no sistema hospedado, e desconta se sobrar dado mock. Além disso a
entrega pede MER/DER e as classes de domínio ajustadas ao banco.

As restrições que pesaram na escolha:

- **MySQL é exigência da disciplina.** Não é uma decisão em aberto; já estava
  no README desde a N1 como banco relacional principal.
- **A API é NestJS em TypeScript**, com ES modules. O acesso ao banco precisa
  ser tipado para não voltarmos a ter os tipos das telas (`src/mocks/types.ts`)
  descolados do que a API realmente devolve.
- **O mesmo modelo serve a três entregas.** Além da API, ele é a base do MER/DER
  e do diagrama de classes atualizado. Ter uma fonte única evita que os três
  documentos divirjam.
- **O prazo é de um dia** e a correção precisa ser reproduzível: quem clonar o
  repositório tem que conseguir criar as tabelas e popular os dados de exemplo
  com dois comandos.

## Decisão

A persistência da API é **MySQL 8.4 acessado pelo ORM Prisma na versão 6**
(`prisma` e `@prisma/client` em `^6.19.3`), com o banco hospedado conforme o
[ADR-004](ADR-004-hospedagem-vercel-e-aiven.md).

**`apps/api/prisma/schema.prisma` é a fonte única do modelo de dados.** Dele
saem, pelo `prisma generate`, os tipos usados em toda a API, e é dele que o
MER/DER e o diagrama de classes são derivados.

A partir do schema:

- **Migrations versionadas no Git.** A migration `20261030202801_init_schema`
  cria todas as tabelas; em produção o deploy roda `prisma migrate deploy`.
  Ninguém altera tabela na mão pelo painel do Aiven.
- **Seed idempotente** (`prisma/seed.ts`, rodado por `prisma db seed`), que
  recria os mesmos dados dos mockups da N1 — a turma "Matemática — 1º Ano", a
  professora Ana Costa, a prova "Avaliação Bimestral 1" — e pode rodar várias
  vezes sem duplicar registro.

Decisões de modelagem que acompanham a escolha:

- **Ids em texto** (`String @id @default(cuid())`), para o seed poder reusar os
  ids dos mocks (`turma-1`, `aluno-1`, `aplicacao-1`) e as telas trocarem o mock
  pela API sem renomear nada.
- **Campos de valor fixo como `String` validados na API**, não como `enum` do
  Prisma: o enum não aceita valores como `Manhã` ou `pdf-gerado`, que são os
  valores que as telas já usam. Os valores válidos são conferidos nos DTOs com
  `class-validator`.
- **Exclusão lógica** (`deletedAt`) em `Questao` e `Prova`, para que provas e
  aplicações antigas não percam a referência.
- **`onDelete: Restrict`** onde apagar destruiria histórico (aluno ou aplicação
  com correção); a API traduz isso num 409 com mensagem clara, em vez de um erro
  de banco vazando para a tela.

### Arquitetura em camadas

Cada módulo em `apps/api/src/<módulo>/` segue sempre a mesma divisão:

```
controller  → rotas HTTP e DTOs (validação de entrada)
service     → regras de negócio
repository  → único lugar que fala com o Prisma
```

O `PrismaService` (`src/common/prisma.service.ts`) é injetado **apenas nos
repositories**: controller e service nunca chamam o banco direto. As regras que
valem por si ficam em arquivos próprios e testáveis sem banco
(`validacao-questao.ts`, `regras-prova.ts`, `versoes.ts`, `calculo-nota.ts`,
`estatisticas.ts`), o que sustenta a cobertura de testes pedida pelo RNF08.

Isso mantém a camada de persistência trocável: se um dia o Prisma sair, só os
repositories mudam.

### Por que a versão 6 e não a 7

O Prisma 7 já está publicado, mas o salto é quebrado em três pontos que afetam
justamente o que faz o SGP funcionar hoje:

1. **O generator muda.** O `prisma-client-js` que usamos passa a ser depreciado
   em favor do `prisma-client`, com `output` obrigatório — o client deixa de ser
   gerado em `node_modules` por padrão.
2. **O import muda.** Em vez de `import { PrismaClient } from '@prisma/client'`,
   passa a ser um import da pasta gerada. Isso alcança o `PrismaService` e todos
   os repositories.
3. **O engine Rust dá lugar a driver adapters.** Cada banco passa a exigir um
   adapter explícito, e o `binaryTargets` deixa de fazer sentido. Hoje o nosso
   schema declara `binaryTargets = ["native", "rhel-openssl-3.0.x"]` exatamente
   porque, sem isso, o Prisma não encontra o binário no ambiente das funções da
   Vercel. Migrar significaria refazer e revalidar o deploy.

Nenhum desses três pontos traz benefício para o escopo da N2, e os três juntos
são uma migração de risco numa entrega feita em um dia, com a API já publicada e
funcionando. A versão 6 fica fixada agora; a atualização pode ser reavaliada na
N3, quando houver tempo de testar o deploy de novo.

## Alternativas consideradas

**TypeORM.** É a opção mais citada junto do NestJS e tem integração oficial
(`@nestjs/typeorm`). Foi descartada porque o modelo fica espalhado em classes
com decorators, uma por arquivo: não existe um documento único do banco para
derivar o MER/DER, que é entrega da N2. As migrations geradas também costumam
precisar de ajuste manual, e o `synchronize: true`, que evitaria isso, é
justamente o que não se quer num banco hospedado com dados de avaliação.

**SQL puro com `mysql2`.** Dá controle total sobre as consultas e zero camada de
abstração para aprender. Foi descartada pelo custo: seria escrever à mão o
mapeamento de todas as tabelas, a validação de tipos, as migrations e o seed,
sem nenhuma tipagem ligando a consulta ao resultado — todo retorno chega como
`any` e o erro só aparece em execução. Com sete módulos para entregar em um dia,
o tempo iria para encanamento em vez de regra de negócio.

## Consequências

**Positivas**

- **Um só lugar define o banco.** `schema.prisma` gera os tipos da API e serve
  de base para o MER/DER e para o diagrama de classes, então os três não
  divergem.
- **Ambiente reproduzível.** `prisma migrate deploy` e `prisma db seed` montam o
  banco do zero com os dados dos mockups — quem corrige o trabalho consegue
  rodar localmente.
- **Erro de campo aparece ao compilar.** O client tipado pegou as diferenças
  entre os nomes dos mocks e os do banco antes de chegarem na tela.
- **Camadas isoladas.** Com o Prisma restrito aos repositories, as regras de
  negócio são testáveis sem banco e a troca do ORM fica contida.

**Negativas e riscos**

- **Mais uma ferramenta para o grupo aprender**, com um vocabulário próprio
  (schema, generate, migrate, seed). Quem nunca usou precisa do passo a passo do
  README para rodar.
- **O `prisma generate` é obrigatório** depois de todo `npm install` e de toda
  mudança no schema. Por isso existe o `postinstall` no `package.json` — sem
  ele, o deploy quebra com o client desatualizado.
- **Versão fixada.** Ficar no 6 é uma dívida assumida: em algum momento a
  migração para o 7 (ou o 8) terá que ser feita, e quanto mais tarde, maior o
  salto.
- **Os campos de valor fixo não são garantidos pelo banco.** Como são `String`,
  quem gravar fora da API pode inserir um `turno` inválido. A proteção está nos
  DTOs, não no MySQL.
