# Plano da N2 Parte 1: Diagramas UML (Grupo 10)

> **Prazo da entrega:** 09/10/2026 às 23:59 (vários envios permitidos).
> **Prazo do grupo:** cada diagrama com PR revisado e mergeado até **quinta 08/10**.
> É o único prazo, não tem cobrança de etapas antes disso.
> **O que entregar:** 4 diagramas UML do SGP (Caso de Uso, Atividade, Classe e
> Sequência), cada um com o **passo a passo da criação**, seguindo o formato do
> `Exemplo Atividade.md` (FastBurger) do material de aula.
> **Recomendação do professor:** cada integrante com uma tarefa definida e tudo
> registrado via PR, para servir de evidência no diário individual.

---

## 1. Como fica em relação ao plano da N2 que já existe

A N2 foi dividida em partes. **Esta Parte 1 é só modelagem (diagramas).** O
`docs/arquitetura/plano-n2.md` (Prisma, autenticação, módulos da API) continua
valendo, mas fica **pausado até esta entrega sair**. Ninguém precisa mexer em
código agora.

**Atualização (09/10):** o SGP passou a ser um sistema web só, responsivo. Não
existe mais app mobile separado: a correção pela câmera é uma tela da própria
web, aberta no navegador do celular (`/correcao`). Os prompts abaixo já usam
essa decisão. Ver `docs/adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md`.

Os dois planos se ajudam: o Diagrama de Classe desta parte usa exatamente as
entidades do schema descrito no `plano-n2.md` (Professor, Turma, Aluno, Questao,
Prova, Aplicacao, Correcao...). Quando o backend começar, o diagrama já é o mapa.

---

## 2. Regra que vale para os 4 diagramas

**O aluno NÃO é ator do sistema.** Ele não tem login, não acessa nada, não clica em
nada. Ele aparece só como **dado** (classe `Aluno` com nome e matrícula) e,
no máximo, como quem responde a prova no papel, fora do sistema.

- Caso de Uso: o único ator humano é o **Professor**.
- Atividade: não existe raia "Aluno" executando ação no sistema.
- Classe: `Aluno` existe, mas sem email, senha ou login.
- Sequência: o aluno não aparece como participante.

Se algum diagrama colocar o aluno fazendo login ou consultando nota, está errado
em relação ao escopo aprovado (README) e vai contradizer o resto do projeto.

---

## 3. Cenário base do SGP (equivalente ao "Cenário Base" do FastBurger)

Todos os diagramas partem deste texto. Ele resume o relato do cliente dentro do
escopo que o grupo aprovou (somente professor):

> *"Precisamos de um sistema para gerar e corrigir provas automaticamente. O
> Professor acessa a plataforma web, faz login, cadastra suas turmas e a lista de
> alunos de cada turma (nome e matrícula). Ele monta um banco de questões
> objetivas e discursivas e, a partir dele, cria provas com até 20 questões,
> definindo a pontuação de cada uma. Para aplicar a prova, o Professor escolhe a
> turma e configura a geração do PDF: quantas versões, se embaralha questões e
> alternativas, e se cada prova sai identificada com o nome do aluno. O sistema
> gera um PDF único com todas as versões e um QR Code em cada prova. Depois da
> prova em sala, o Professor abre o SGP no navegador do celular, que já baixou o
> gabarito e funciona sem internet, lê o QR Code e o cartão-resposta de cada
> prova pela câmera, confere a nota calculada automaticamente e confirma. Se a
> prova era identificada, a nota vai direto para o aluno; se não, o Professor
> lança a nota manualmente na web depois, usando o nome e a matrícula escritos na
> folha. Quando o celular volta a ter internet, as correções são sincronizadas.
> Por fim, o Professor consulta o relatório de notas da turma, com média e
> estatísticas, e exporta em planilha para lançar no sistema acadêmico."*

---

## 4. Divisão de tarefas

| Pessoa | Tarefa | Pasta | Branch |
|---|---|---|---|
| Thiago | Base (cenário + estrutura), revisão final, consistência entre diagramas e montagem da entrega | `docs/uml/README.md` | `docs/uml-base` |
| Amanda | Diagrama de Caso de Uso | `docs/uml/01-caso-de-uso/` | `docs/uml-caso-de-uso` |
| Hellen | Diagrama de Atividade (com raias) | `docs/uml/02-atividade/` | `docs/uml-atividade` |
| Iago | Diagrama de Classe | `docs/uml/03-classe/` | `docs/uml-classe` |
| Marceu | Diagrama de Sequência | `docs/uml/04-sequencia/` | `docs/uml-sequencia` |

A divisão segue a área de cada um desde a N1: Marceu ficou com a correção pela câmera
(é o fluxo do diagrama de sequência) e Iago com Classe, que é o mesmo modelo de
dados que ele vai implementar no backend de Provas e Aplicações.

**Plano B para Iago:** se o PR de Classe não estiver mergeado até **quinta 08/10**, o
Thiago assume o diagrama de Classe (sai rápido, porque é a tradução direta do
schema do `plano-n2.md`) e isso fica registrado no diário. Combinem isso no grupo
agora, não na véspera.

### Cada pessoa entrega 3 arquivos na sua pasta

```
docs/uml/01-caso-de-uso/
  caso-de-uso.md     ← passo a passo (análise) + imagem, igual ao exemplo
  caso-de-uso.puml   ← código-fonte do diagrama (PlantUML)
  caso-de-uso.png    ← imagem exportada do .puml
```

Cada um mexe **só na própria pasta**, então ninguém dá conflito de merge. O
`docs/uml/README.md` (índice que junta tudo) é só do Thiago.

### Ferramenta: PlantUML (a mesma do exemplo do professor)

As imagens do exemplo do FastBurger foram feitas em PlantUML. Para exportar o PNG
de um `.puml`, qualquer uma destas serve:

- **VS Code:** extensão "PlantUML" (jebbs.plantuml), abrir o `.puml`, `Alt+D` para
  pré-visualizar, e comando "PlantUML: Export Current Diagram" para gerar o PNG.
- **Site:** colar o código em [plantuml.com/plantuml](https://www.plantuml.com/plantuml)
  e baixar o PNG.
- **Claude Code:** o próprio prompt abaixo pede para ele gerar o PNG.

---

## 5. Cronograma

| Data | O que acontece |
|---|---|
| **qua 30/09** | Thiago sobe a base (`docs/uml/README.md` com cenário e índice) e avisa no grupo |
| **qui 01/10 a qui 08/10** | Cada um faz seu diagrama no seu ritmo: abre o PR, recebe o review do colega, ajusta e mergeia. **Prazo único: quinta 08/10.** |
| **qui 08/10** | Thiago confere consistência entre os 4 diagramas e monta a entrega |
| **sex 09/10** | Envio (até 23:59) |

Não há prazos intermediários, mas o review depende de um colega: quem abrir o PR
mais cedo tem mais tempo para receber o review e ajustar sem correria.

### Reviews cruzados (evidência para o diário de todos)

Cada PR precisa de 1 review de um colega **antes** do merge. Para ninguém revisar
o próprio trabalho e todo mundo ter review registrado no GitHub:

| Autor do PR | Quem revisa |
|---|---|
| Amanda (Caso de Uso) | Hellen |
| Hellen (Atividade) | Marceu |
| Iago (Classe) | Amanda |
| Marceu (Sequência) | Iago |
| Thiago (base) | qualquer um |

O Thiago faz uma segunda leitura em todos, focada em **consistência**: os mesmos
nomes em todos os diagramas (se o Caso de Uso diz "Gerar PDF da Aplicação", a
Atividade e a Sequência não podem chamar de "Exportar Prova").

**Para o diário:** comentário recebido em review, correção feita e reenvio contam
como evidência. Tirem print do PR (aberto, com review e mergeado).

---

## 6. Passo a passo de git (igual para todos)

```bash
# 1. só depois do aviso do Thiago de que a base entrou na main
git checkout main
git pull

# 2. criar a SUA branch (troque pelo nome da tabela)
git checkout -b docs/uml-caso-de-uso

# 3. trabalhar, commitar, subir
git add docs/uml/01-caso-de-uso/
git commit -m "docs(docs): adiciona diagrama de caso de uso"
git push -u origin docs/uml-caso-de-uso

# 4. abrir PR para a main no GitHub, marcar o revisor da tabela acima
```

Convenção de commit continua a do `CONTRIBUTING.md`:
`tipo(escopo): descrição no imperativo`. Exemplos:
`docs(docs): adiciona análise de atores do caso de uso`,
`docs(docs): corrige multiplicidade entre turma e aluno`.

---

## Prompt 0 (Thiago): base da entrega

```
Você está no repositório do SGP. Leia o README.md e o
docs/arquitetura/plano-n2-parte1.md antes de começar. Esta tarefa NÃO envolve
código: é só documentação UML.

PASSO 0: git checkout main && git pull && git checkout -b docs/uml-base

TAREFA 1: Crie docs/uml/README.md com:
- título "Modelagem UML do SGP (N2 Parte 1)";
- uma frase explicando que o documento segue o formato do exemplo FastBurger
  dado em aula (análise do cenário seguida do diagrama);
- a seção "Cenário Base", com o texto exatamente como está na seção 3 do
  plano-n2-parte1.md, em bloco de citação;
- a seção "Regra de escopo", explicando em 3 ou 4 linhas que o aluno não é ator
  do sistema (só aparece como dado: nome e matrícula);
- um índice com links para os 4 diagramas:
  01-caso-de-uso/caso-de-uso.md, 02-atividade/atividade.md,
  03-classe/classe.md, 04-sequencia/sequencia.md
  (os arquivos ainda não existem, os links vão funcionar quando cada colega
  mergear);
- uma tabela "Responsáveis" com diagrama, integrante e link do PR (deixe a
  coluna de PR com "a preencher").

TAREFA 2: Crie as 4 pastas vazias com um .gitkeep cada:
docs/uml/01-caso-de-uso, 02-atividade, 03-classe, 04-sequencia.
Apague o docs/uml/.gitkeep antigo se ele existir.

TAREFA 3: Commits pequenos, em português, seguindo o CONTRIBUTING.md, por exemplo
"docs(docs): adiciona cenário base e índice da modelagem uml".

REGRAS DE COMMIT (obrigatórias):
- use a identidade git já configurada nesta máquina (confira com
  git config user.name e git config user.email; se estiver vazia ou genérica,
  pare e me avise);
- NÃO adicione "Co-Authored-By", "Generated with", menção a Claude ou a IA, nem
  qualquer rodapé de atribuição na mensagem de commit ou na descrição do PR;
- não use --author.

Dê push na branch e abra PR para a main (se o gh não estiver disponível, só dê
push e me diga a URL para eu abrir o PR). Ao final, rode
git log -3 --format="%an <%ae>%n%B" e me mostre o resultado.
```

---

## Prompt 1 (Amanda): Diagrama de Caso de Uso

```
Você está no repositório do SGP. Esta tarefa NÃO envolve código: é um diagrama
UML de Caso de Uso com o passo a passo da criação, no mesmo formato do exemplo
FastBurger dado em aula.

PASSO 0: git checkout main && git pull && git checkout -b docs/uml-caso-de-uso
Leia docs/uml/README.md (cenário base e regra de escopo) e o README.md da raiz
(seção 3, requisitos RF01 a RF13). Se docs/uml/README.md não existir, a base
ainda não foi mergeada: pare e me avise.

REGRA DE ESCOPO: o aluno NÃO é ator. O único ator humano é o Professor. O aluno
não faz login, não consulta nota, não interage com o sistema.

TAREFA 1: Crie docs/uml/01-caso-de-uso/caso-de-uso.md com esta estrutura:

## 1. Diagrama de Casos de Uso
### Passo 1A: Análise do Cenário ("Caça aos Atores e Ações")
- Tabela de atores identificados (Ator | Papel no sistema). Explique em uma
  linha por que o Aluno NÃO aparece como ator.
- Lista de ações/casos de uso encontrados no cenário base, cada um com o
  requisito (RF) de origem entre parênteses. Espera-se algo como: Autenticar-se,
  Gerenciar Turmas, Cadastrar Alunos na Turma, Gerenciar Banco de Questões,
  Montar Prova, Aplicar Prova à Turma, Gerar PDF da Aplicação, Baixar Gabarito
  para Correção Offline, Corrigir Prova pela Câmera, Lançar Nota Manualmente, Consultar Relatório
  de Notas, Exportar Relatório.
### Passo 1B: Relacionamentos include/extend
- Explique quais casos usam <<include>> (obrigatório, sempre acontece junto; ex:
  Corrigir Prova pela Câmera inclui Ler QR Code e Ler Cartão-Resposta; Gerar PDF
  inclui Embaralhar Questões) e quais usam <<extend>> (opcional/condicional; ex:
  Lançar Nota Manualmente estende o fluxo quando a prova não é identificada).
### Diagrama de Caso de Uso
- a imagem: ![Diagrama de Casos de Uso do SGP](caso-de-uso.png)

TAREFA 2: Crie docs/uml/01-caso-de-uso/caso-de-uso.puml em PlantUML:
- left to right direction;
- ator Professor fora do retângulo;
- um único retângulo de sistema, "SGP (web do professor)". Dentro dele, agrupe
  em um pacote "Correção pelo celular" os casos de uso da câmera (Baixar Gabarito
  para Correção Offline, Corrigir Prova pela Câmera, Ler QR Code, Ler
  Cartão-Resposta). Não existe app separado: é a mesma web, aberta no navegador
  do celular (ADR-001);
- os casos de uso do Passo 1A nos retângulos certos, com as setas
  <<include>>/<<extend>> do Passo 1B.

TAREFA 3: Gere caso-de-uso.png a partir do .puml (tente plantuml via npx ou
java; se não conseguir, me diga para exportar pela extensão PlantUML do VS Code
ou pelo site plantuml.com). Abra a imagem e confira se está legível e se nenhum
ator Aluno apareceu.

TAREFA 4: Commits pequenos (ex: "docs(docs): adiciona análise de atores do caso
de uso", "docs(docs): adiciona diagrama de caso de uso"). Push na branch e PR
para a main pedindo review da Hellen. Prazo: PR aberto, revisado e mergeado até quinta 08/10.

REGRAS DE COMMIT: use a identidade git já configurada nesta máquina; NÃO
adicione Co-Authored-By, menção a Claude/IA ou rodapé de atribuição no commit
nem no PR; não use --author.
```

---

## Prompt 2 (Hellen): Diagrama de Atividade

```
Você está no repositório do SGP. Esta tarefa NÃO envolve código: é um diagrama
UML de Atividade COM RAIAS, com o passo a passo da criação, no mesmo formato do
exemplo FastBurger dado em aula.

PASSO 0: git checkout main && git pull && git checkout -b docs/uml-atividade
Leia docs/uml/README.md (cenário base e regra de escopo). Se não existir, a base
ainda não foi mergeada: pare e me avise.

REGRA DE ESCOPO: não existe raia de Aluno executando ações no sistema. A prova
em sala acontece no papel, fora do sistema; represente isso como uma ação do
Professor ("Aplicar prova impressa em sala").

TAREFA 1: Crie docs/uml/02-atividade/atividade.md com esta estrutura:

## 2. Diagrama de Atividades
### Passo 2A: Análise do Fluxo Cronológico
Lista numerada com a sequência lógica do cenário base, do início ao fim:
criar prova, aplicar à turma, configurar geração, gerar PDF, imprimir e aplicar
em sala, a tela de correção baixa o gabarito, ler QR Code e cartão-resposta, conferir nota,
confirmar, sincronizar, atribuir nota, relatório. Marque em negrito as DECISÕES:
- a prova é identificada por aluno? [Sim] nota atribuída automaticamente /
  [Não] professor lança nota manualmente na web;
- há conexão com a internet? [Sim] envia para a API / [Não] guarda na fila local
  e sincroniza depois;
- a nota lida está correta? [Não] professor ajusta antes de confirmar.
### Raias identificadas
Tabela Raia | Responsabilidades, com 3 raias: Professor, Web do Professor
(navegador, inclusive no celular, onde fica a tela de correção) e API (servidor).
Não use raia de app mobile: ele não existe mais (ADR-001).
Explique em uma frase por que usar raias (mais de um responsável).
### Diagrama de Atividades
- a imagem: ![Diagrama de Atividades do SGP com raias](atividade.png)

TAREFA 2: Crie docs/uml/02-atividade/atividade.puml em PlantUML, usando a
sintaxe de raias (|Professor|, |Web do Professor|, |API|), com início, fim e
os losangos de decisão do Passo 2A (if/else). Use os mesmos nomes de ação que o
diagrama de Caso de Uso (Gerar PDF da Aplicação, Corrigir Prova pela Câmera,
Lançar Nota Manualmente, Consultar Relatório de Notas).

TAREFA 3: Gere atividade.png (plantuml via npx ou java; se não conseguir, me
diga para exportar pela extensão do VS Code ou pelo site plantuml.com). Abra a
imagem e confira se as raias e decisões estão legíveis.

TAREFA 4: Commits pequenos (ex: "docs(docs): adiciona análise do fluxo de
atividades", "docs(docs): adiciona diagrama de atividades com raias"). Push na
branch e PR para a main pedindo review do Marceu. Prazo: PR aberto, revisado e mergeado até quinta 08/10.

REGRAS DE COMMIT: use a identidade git já configurada nesta máquina; NÃO
adicione Co-Authored-By, menção a Claude/IA ou rodapé de atribuição no commit
nem no PR; não use --author.
```

---

## Prompt 3 (Iago): Diagrama de Classe

```
Você está no repositório do SGP. Esta tarefa NÃO envolve código: é um diagrama
UML de Classe com o passo a passo da criação, no mesmo formato do exemplo
FastBurger dado em aula.

PASSO 0: git checkout main && git pull && git checkout -b docs/uml-classe
Leia docs/uml/README.md, apps/web-professor/src/mocks/types.ts (tipos que as
telas já usam) e a TAREFA 2 do Prompt 0 em docs/arquitetura/plano-n2.md (schema
do banco planejado). O diagrama de classe deve bater com esses dois: mesmos
nomes de classe e atributos. Se docs/uml/README.md não existir, a base ainda não
foi mergeada: pare e me avise.

REGRA DE ESCOPO: a classe Aluno tem só id, nome e matrícula. Nada de email,
senha ou login para aluno.

TAREFA 1: Crie docs/uml/03-classe/classe.md com esta estrutura:

## 3. Diagrama de Classes
### Passo 3A: Extração do Texto ("Truque do Detetive")
#### Identificando as classes (substantivos)
Tabela Classe | Descrição, partindo dos substantivos do cenário base: Professor,
Turma, Aluno, Questao, Alternativa, Prova, ProvaQuestao, Aplicacao, VersaoProva,
Correcao.
#### Interpretando associações e multiplicidades
Pergunta-chave: "Quantos desse podem estar ligados a aquele?". Um parágrafo
curto por associação, no formato do exemplo, por exemplo:
- Professor e Turma: 1 professor tem 0..* turmas; cada turma é de 1 professor.
- Turma e Aluno: composição (aluno não existe sem turma), 1 para 0..*.
- Questao e Alternativa: composição, 1 para 0..5 (objetiva tem 2 a 5).
- Prova e Questao: muitos para muitos, resolvido pela classe ProvaQuestao
  (guarda ordem e pontuação); uma prova tem até 20 questões.
- Prova e Aplicacao: 1 prova para 0..* aplicações; Turma e Aplicacao idem.
- Aplicacao e VersaoProva: composição, 1 para 1..*.
- Aplicacao e Correcao: 1 para 0..*; Correcao e Aluno: 0..1 (vazio quando a
  prova não é identificada, preenchido no lançamento manual).
### Diagrama de Classes
- a imagem: ![Diagrama de Classes do SGP](classe.png)

TAREFA 2: Crie docs/uml/03-classe/classe.puml em PlantUML, com atributos
tipados (+ nome : String, etc.) e alguns métodos principais por classe (ex:
Aplicacao.gerarVersoes(), Correcao.calcularNota(), Turma.adicionarAluno()),
associações com multiplicidade nas duas pontas e composição onde indicado.

TAREFA 3: Gere classe.png (plantuml via npx ou java; se não conseguir, me diga
para exportar pela extensão do VS Code ou pelo site plantuml.com). Abra a
imagem e confira se está legível.

TAREFA 4: Commits pequenos (ex: "docs(docs): adiciona análise de classes e
multiplicidades", "docs(docs): adiciona diagrama de classes"). Push na branch e
PR para a main pedindo review da Amanda. Prazo: PR aberto, revisado e mergeado até quinta 08/10.

REGRAS DE COMMIT: use a identidade git já configurada nesta máquina; NÃO
adicione Co-Authored-By, menção a Claude/IA ou rodapé de atribuição no commit
nem no PR; não use --author.
```

---

## Prompt 4 (Marceu): Diagrama de Sequência

```
Você está no repositório do SGP. Esta tarefa NÃO envolve código: é um diagrama
UML de Sequência com o passo a passo da criação, no mesmo formato do exemplo
FastBurger dado em aula.

PASSO 0: git checkout main && git pull && git checkout -b docs/uml-sequencia
Leia docs/uml/README.md (cenário base e regra de escopo). Se não existir, a base
ainda não foi mergeada: pare e me avise.

CENÁRIO DO DIAGRAMA: "Correção de uma prova pela câmera do celular". É o
coração do sistema: o professor abre a tela de correção da web no navegador do
celular (/correcao), que substituiu o app mobile (ADR-001).

REGRA DE ESCOPO: o aluno não é participante. Os participantes são: Professor
(ator), TelaCorrecao (a web aberta no celular), FilaLocal (IndexedDB do
navegador, use o símbolo de banco), API
(servidor) e BancoDeDados (símbolo de banco).

TAREFA 1: Crie docs/uml/04-sequencia/sequencia.md com esta estrutura:

## 4. Diagrama de Sequência
### Passo 4A: Como Analisar e Ler o Diagrama
Mesmos 4 itens do exemplo (atores e objetos, linhas de vida, mensagens contínuas
e tracejadas, bloco alt), adaptados ao SGP. Explique as decisões:
- bloco alt "prova identificada" / "prova sem identificação": na primeira a API
  atribui a nota ao aluno automaticamente; na segunda a correção fica pendente
  de lançamento manual na web;
- bloco opt ou alt "sem internet": a tela grava na FilaLocal e sincroniza depois,
  enviando o clientCorrectionId para evitar duplicidade.
### Diagrama de Sequência
- a imagem: ![Diagrama de Sequência do SGP](sequencia.png)

TAREFA 2: Crie docs/uml/04-sequencia/sequencia.puml em PlantUML com
autonumber, activate/deactivate e esta ordem de mensagens:
Professor -> TelaCorrecao: iniciarCorrecao(aplicacao)
TelaCorrecao -> FilaLocal: carregarGabarito(aplicacaoId)  (já baixado antes)
Professor -> TelaCorrecao: lerQRCode()
Professor -> TelaCorrecao: lerCartaoResposta()
TelaCorrecao -> TelaCorrecao: calcularNota(respostas, gabarito)
TelaCorrecao --> Professor: exibe nota para conferência
Professor -> TelaCorrecao: confirmarCorrecao()
TelaCorrecao -> FilaLocal: salvarCorrecao(clientCorrectionId)
bloco alt/opt de conexão, depois TelaCorrecao -> API: sincronizar(lote)
API -> BancoDeDados: verificar clientCorrectionId (deduplicação)
bloco alt identificada / não identificada, com os retornos tracejados.
Use os mesmos nomes do diagrama de Caso de Uso e de Classe (Correcao,
Aplicacao, Aluno).

TAREFA 3: Gere sequencia.png (plantuml via npx ou java; se não conseguir, me
diga para exportar pela extensão do VS Code ou pelo site plantuml.com). Abra a
imagem e confira se está legível.

TAREFA 4: Commits pequenos (ex: "docs(docs): adiciona análise do diagrama de
sequência", "docs(docs): adiciona diagrama de sequência da correção pela câmera").
Push na branch e PR para a main pedindo review do Iago. Prazo: PR aberto, revisado e mergeado até quinta 08/10.

REGRAS DE COMMIT: use a identidade git já configurada nesta máquina; NÃO
adicione Co-Authored-By, menção a Claude/IA ou rodapé de atribuição no commit
nem no PR; não use --author.
```

---

## 7. Checklist final do Thiago (quinta 08/10)

- [ ] Os 4 PRs mergeados, cada um com pelo menos 1 review registrado.
- [ ] Nenhum diagrama tem Aluno como ator, raia ou participante.
- [ ] Nomes iguais nos 4 diagramas (casos de uso, ações, classes, mensagens).
- [ ] Classe bate com `mocks/types.ts` e com o schema do `plano-n2.md`.
- [ ] Todas as imagens abrem e aparecem no GitHub dentro dos `.md`.
- [ ] `docs/uml/README.md` com a coluna de PR preenchida.
- [ ] Entrega enviada (link do repositório apontando para `docs/uml/`, ou um
      único documento juntando os 4 `.md`, conforme o formato que o professor
      aceitar).
- [ ] Cada integrante com prints do seu PR (aberto, review, merge) para o diário.
