# ADR-005: Soft-delete de questões

## Status
Aceito

## Contexto
Provas já montadas ou aplicadas referenciam questões do banco. Excluir a linha fisicamente quebraria essa referência e perderia o histórico.

## Decisão
Questões são removidas via soft-delete: o campo deletedAt é preenchido e a linha permanece. As listagens filtram deletedAt = null.

## Consequências
- Provas antigas mantêm a questão original.
- Toda consulta precisa filtrar deletedAt.
- O banco cresce, pois nada é apagado de fato.
