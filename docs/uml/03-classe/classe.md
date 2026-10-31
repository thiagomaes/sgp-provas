# Diagrama de Classes

Esta versão alinha as classes, atributos, tipos e multiplicidades ao schema final em `apps/api/prisma/schema.prisma`. Os tipos seguem os escalares Prisma; o campo `data`, por exemplo, é `DateTime` com armazenamento MySQL `Date`. Atributos com `?` aceitam nulo. As multiplicidades refletem a nulabilidade das FKs e as relações declaradas no schema; limites de negócio como a quantidade de alternativas são tratados pela API.

## 3. Diagrama de Classes

### Passo 3A: Extração do Texto ("Truque do Detetive")

#### Identificando as classes (substantivos)

Partindo dos substantivos do cenário base, identificamos as classes abaixo. Nomes, atributos e tipos acompanham o schema final.

| Classe | Descrição |
|---|---|
| Professor | Usuário que cadastra turmas, questões e provas. |
| RefreshToken | Token de atualização de sessão vinculado a um professor. |
| Turma | Grupo de alunos de uma disciplina, ano e turno. |
| Aluno | Registro de nome e matrícula dentro de uma turma. |
| Questao | Questão objetiva ou discursiva do banco do professor; `tags` é `Json`. |
| Alternativa | Opção de resposta de uma questão, marcada como correta ou incorreta. |
| Prova | Modelo reutilizável com título, disciplina e questões selecionadas; `totalPontos` é `Float`. |
| ProvaQuestao | Associação entre prova e questão, com ordem e pontuação (`Float`). |
| Aplicacao | Preparação de uma prova para uma turma, com data e configuração de versões. |
| VersaoProva | Versão gerada para uma aplicação, com layout `Json` e QR Code. |
| Correcao | Resultado da leitura ou do lançamento manual; nota `Float` e respostas `Json`. |

#### Interpretando associações e multiplicidades

A pergunta-chave é: **“Quantos desse podem estar ligados a aquele?”** As multiplicidades abaixo acompanham as FKs do schema; regras de negócio adicionais são validadas pela API.

- **Professor e RefreshToken:** 1 professor tem 0..* tokens; cada token pertence a 1 professor.
- **Professor e Turma, Questao, Prova e Aplicacao:** cada professor pode cadastrar/criar/registrar 0..* registros de cada classe; cada registro referencia 1 professor.
- **Turma e Aluno:** composição, 1 turma contém 0..* alunos; cada aluno pertence a 1 turma.
- **Turma e Aplicacao:** 1 turma pode receber 0..* aplicações; cada aplicação referencia 1 turma.
- **Questao e Alternativa:** composição, 1 questão pode ter 0..* alternativas; cada alternativa pertence a 1 questão. Limites funcionais são validados pela API.
- **Prova e Questao:** muitos para muitos, resolvido por `ProvaQuestao`; cada associação referencia 1 prova e 1 questão e guarda ordem e pontuação.
- **Prova e Aplicacao:** 1 prova pode estar em 0..* aplicações; cada aplicação usa 1 prova.
- **Prova e ProvaQuestao:** composição, 1 prova contém 0..* registros `ProvaQuestao`; cada registro pertence a 1 prova.
- **Aplicacao e VersaoProva:** composição, 1 aplicação tem 0..* versões; cada versão pertence a 1 aplicação.
- **Aplicacao e Correcao:** 1 aplicação tem 0..* correções; cada correção pertence a 1 aplicação.
- **Correcao e Aluno:** cada correção pode estar ligada a 0..1 aluno; um aluno pode ter 0..* correções. `alunoId` é opcional.

## O que mudou em relação à Parte 1

- Incluída a classe `RefreshToken`, que registra tokens vinculados ao professor.
- Alinhados os tipos numéricos `Decimal` para `Float` e `String[]` para `Json`, conforme o Prisma.
- Corrigidos atributos que não existem no banco: `totalProvas`, `pdfUrl`, `versaoProva`, dados de identificação informados, códigos públicos e campos de publicação de gabarito.
- Incluídos campos que faltavam no diagrama, como `createdAt`, `criadaEm`, `deletedAt`, `corrigidas`, `qrCodePayload` e `clientCorrectionId`.
- `clientCorrectionId` agora é obrigatório e único no schema. `alunoId` continua opcional para correções sem aluno identificado.
- As relações mantêm as FKs do schema: uma correção referencia uma aplicação e, opcionalmente, um aluno; `VersaoProva` pertence à aplicação, sem FK direta de correção para versão.
- As associações `Aplicacao`–`VersaoProva` e `Questao`–`Alternativa` passaram a `0..*`, pois o banco não declara mínimo de registros. Os limites funcionais são validados pela API.

## Diagrama

![Diagrama de Classes do SGP alinhado ao schema Prisma](classe.png)
