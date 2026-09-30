# Modelagem UML do SGP (N2 Parte 1)

Este documento segue o formato do exemplo FastBurger dado em aula: cada diagrama
começa pela análise do cenário base (passo a passo da criação) e termina com o
diagrama pronto.

## Cenário Base

> *"Precisamos de um sistema para gerar e corrigir provas automaticamente. O
> Professor acessa a plataforma web, faz login, cadastra suas turmas e a lista de
> alunos de cada turma (nome e matrícula). Ele monta um banco de questões
> objetivas e discursivas e, a partir dele, cria provas com até 20 questões,
> definindo a pontuação de cada uma. Para aplicar a prova, o Professor escolhe a
> turma e configura a geração do PDF: quantas versões, se embaralha questões e
> alternativas, e se cada prova sai identificada com o nome do aluno. O sistema
> gera um PDF único com todas as versões e um QR Code em cada prova. Depois da
> prova em sala, o Professor abre o aplicativo no celular, que já baixou o
> gabarito e funciona sem internet, lê o QR Code e o cartão-resposta de cada
> prova pela câmera, confere a nota calculada automaticamente e confirma. Se a
> prova era identificada, a nota vai direto para o aluno; se não, o Professor
> lança a nota manualmente na web depois, usando o nome e a matrícula escritos na
> folha. Quando o celular volta a ter internet, as correções são sincronizadas.
> Por fim, o Professor consulta o relatório de notas da turma, com média e
> estatísticas, e exporta em planilha para lançar no sistema acadêmico."*

## Regra de escopo

O aluno **não é ator do sistema**: ele não tem login, não acessa a web nem o app e
não consulta nota (RF01). Nos diagramas, ele aparece só como **dado** cadastrado
pelo professor na turma (classe `Aluno`, com nome e matrícula) e, no máximo, como
quem responde a prova no papel, fora do sistema. O único ator humano é o
**Professor**.

## Índice

1. [Diagrama de Caso de Uso](01-caso-de-uso/caso-de-uso.md)
2. [Diagrama de Atividade (com raias)](02-atividade/atividade.md)
3. [Diagrama de Classe](03-classe/classe.md)
4. [Diagrama de Sequência (correção pelo app mobile)](04-sequencia/sequencia.md)

## Responsáveis

| Diagrama | Integrante | PR |
|---|---|---|
| Caso de Uso | Amanda Zimmermann | a preencher |
| Atividade | Hellen Cristina de Oliveira | a preencher |
| Classe | Iago Henrique Pinto Bogler | a preencher |
| Sequência | Marceu Lago Pontes Schmidt | a preencher |
