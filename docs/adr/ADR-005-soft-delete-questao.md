# ADR-005: Soft-delete de questões

- **Status:** aceita
- **Data:** 30/10/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

Provas já montadas ou aplicadas referenciam questões do banco. Excluir a linha
fisicamente quebraria essa referência e perderia o histórico.

No modelo de dados ([ADR-002](ADR-002-mysql-com-prisma.md)), uma prova não
guarda o texto das questões: ela aponta para elas pela tabela `ProvaQuestao`, que
registra a ordem e a pontuação de cada questão naquela prova. É também pelas
questões da prova que a API monta o gabarito na hora de corrigir
(`calculo-nota.ts`) e embaralha as versões de uma aplicação (`versoes.ts`).

Ao mesmo tempo, o professor precisa conseguir "apagar" uma questão do banco
dele (RF02): uma questão errada ou que não vai usar mais não pode ficar
aparecendo na lista nem ser escolhida para provas novas. E o RF13 já registra
que o SGP atende a LGPD por anonimização, não por exclusão física, então manter
a linha no banco segue o mesmo princípio do resto do sistema.

## Decisão

Questões são removidas via soft-delete: o campo `deletedAt` é preenchido e a
linha permanece. As listagens filtram `deletedAt = null`.

Na prática, conferido em `apps/api/src/questions` e no `schema.prisma`:

- `Questao.deletedAt` é um `DateTime?` no schema. Nulo quer dizer questão ativa.
- `DELETE /questions/:id` não apaga a linha: o repository só grava a data atual
  em `deletedAt` (`marcarComoExcluida`) e a rota responde 204.
- `GET /questions` e `GET /questions/:id` só enxergam questões com
  `deletedAt = null`. Uma questão excluída some da lista e responde 404, como se
  não existisse.
- Ao criar ou editar uma prova, a API só aceita questões ativas do próprio
  professor. Uma questão excluída não entra em prova nova.
- As provas que já tinham a questão continuam com ela: o gabarito da correção e
  a geração das versões leem as questões da prova pela `ProvaQuestao`, sem
  filtrar `deletedAt`.
- O banco reforça a regra: a relação de `ProvaQuestao` com `Questao` é
  `onDelete: Restrict`, então uma exclusão física de questão usada em prova é
  recusada pelo próprio MySQL.

As provas seguem o mesmo padrão (`Prova.deletedAt`, com as aplicações antigas
continuando a apontar para a prova excluída).

## Alternativas consideradas

**Exclusão física com `ON DELETE CASCADE`.** A forma mais simples: apagar a
questão e, em cascata, as linhas de `ProvaQuestao` que apontam para ela. Foi
descartada porque altera provas que já foram montadas e, pior, aplicadas: a prova
perderia uma questão, o total de pontos mudaria e o gabarito das versões já
impressas não bateria mais com o que a API usa para calcular a nota. As notas já
lançadas ficariam sem a questão que as explica.

**Exclusão física bloqueada quando a questão está em uso.** Deixar o
`onDelete: Restrict` agir sozinho e responder 409 quando a questão estiver em
alguma prova. Evita perder histórico, mas deixa o professor sem saída: a questão
errada continuaria aparecendo no banco dele para sempre, só porque já foi usada
uma vez.

**Copiar a questão para dentro da prova.** Cada prova guardaria uma cópia do
enunciado, das alternativas e do gabarito no momento da montagem, e a questão
original poderia ser apagada à vontade. Foi descartada por duplicar dados (uma
questão usada em dez provas vira onze cópias) e porque uma correção de digitação
feita no banco não chegaria às provas ainda não aplicadas. Também exigiria mudar
o modelo, o MER/DER e o diagrama de classes no meio da N2.

## Consequências

**Positivas**

- Provas antigas mantêm a questão original.
- O professor consegue tirar a questão do banco dele sem quebrar nada do que já
  foi aplicado e corrigido.
- A exclusão é reversível no banco: basta limpar `deletedAt` para a questão
  voltar.

**Negativas e riscos**

- Toda consulta precisa filtrar `deletedAt`. As listagens e a montagem de prova
  filtram; o gabarito e a geração das versões, de propósito, não. Uma consulta nova que
  esqueça o filtro mostra questão excluída na tela.
- As linhas excluídas continuam ocupando espaço no banco. No volume do SGP isso
  não pesa, mas não há rotina de limpeza.
- Não existe tela para restaurar uma questão excluída: hoje isso só é possível
  direto no banco.
