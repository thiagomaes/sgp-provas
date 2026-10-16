## 2. Diagrama de Atividades

O diagrama de atividades mostra **o fluxo de trabalho do começo ao fim**: quais
ações acontecem, em que ordem e onde o caminho se divide por uma decisão. Ele
parte do [Cenário Base](../README.md#cenário-base) e cobre o ciclo completo de
uma prova no SGP, do login à consulta do relatório de notas.

### Passo 2A: Análise do Fluxo Cronológico

Lendo o cenário base em ordem cronológica, chegamos à sequência abaixo. As
**decisões** (losangos no diagrama) estão em negrito, com os caminhos possíveis.

1. O Professor acessa o Sistema Web e informa as credenciais.
2. O Sistema Web valida as credenciais. **As credenciais são válidas?** [Sim] abre
   a área do professor / [Não] informa que o acesso não foi validado e o fluxo
   termina.
3. O Professor seleciona ou cadastra a turma e os alunos.
4. O Professor seleciona as questões e monta a prova.
5. O Sistema Web valida a prova e a quantidade de questões. **A prova é válida e
   tem até 20 questões?** [Não] exibe as pendências, o Professor corrige a prova e
   o Sistema Web valida de novo, até a prova ficar válida / [Sim] segue.
6. O Professor cria uma aplicação para a turma e configura versões,
   embaralhamento e identificação dos alunos.
7. O Sistema Web gera o PDF consolidado, com um QR Code por versão ou por aluno, e
   disponibiliza o gabarito da aplicação.
8. O Professor imprime o PDF, aplica a prova em sala e recolhe os
   cartões-resposta. A prova acontece no papel, fora do sistema.
9. O Professor abre a web no celular para iniciar as correções.
10. A web no celular verifica se os dados da aplicação e o gabarito já estão no
    dispositivo. **O pacote da aplicação está disponível localmente?** [Sim] usa o
    pacote local, mesmo sem conexão / [Não] o Professor conecta o dispositivo à
    Internet, a web no celular baixa a aplicação e o gabarito e o Sistema Web
    fornece esses dados.
11. **Há cartões-resposta restantes para corrigir?** [Sim] repete os passos 12 a
    17 para cada prova / [Não] vai para o passo 18.
12. A web no celular lê o QR Code pela câmera e valida localmente a aplicação e a
    versão. **O QR Code é válido para a aplicação?** [Não] lê o QR Code de novo /
    [Sim] segue.
13. A web no celular lê o cartão-resposta pela câmera e calcula a nota com o
    gabarito local.
14. O Professor revisa a leitura e a nota calculada. **É necessário corrigir algum
    dado?** [Sim] o Professor ajusta as respostas ou a nota e a web no celular
    atualiza o resultado / [Não] segue.
15. O Professor confirma a correção.
16. **A aplicação está conectada agora?** [Sim] a web no celular guarda a correção
    na fila local e envia a fila / [Não] guarda na fila local, aguarda a conexão e
    sincroniza automaticamente ao reconectar. Nos dois casos, o Sistema Web recebe
    as correções e deduplica pelo identificador da correção.
17. **Há conflito de sincronização?** [Sim] o Sistema Web sinaliza o conflito, o
    Professor analisa e resolve, e o Sistema Web registra a resolução / [Não] o
    Sistema Web confirma a sincronização idempotente. Em seguida: **O aluno está
    identificado na aplicação?** [Sim] o Sistema Web associa a nota ao aluno
    cadastrado / [Não] o Professor confere o nome ou a matrícula escritos no
    cartão, identifica o aluno e lança a nota manualmente, e o Sistema Web associa
    a nota ao aluno da turma.
18. Com todas as provas corrigidas, o Professor consulta ou exporta o relatório de
    notas e estatísticas, e o fluxo termina.

### Raias identificadas

O fluxo tem mais de um responsável, então usamos **raias** (swimlanes): cada
coluna do diagrama mostra quem executa cada ação, e uma seta que cruza de uma raia
para outra indica a passagem de responsabilidade.

| Raia | Responsabilidades |
|---|---|
| Professor | Faz login, cadastra turma e alunos, monta a prova, cria e configura a aplicação, imprime e aplica a prova em sala, revisa e confirma cada correção, resolve conflitos, lança nota manualmente quando a prova não é identificada e consulta o relatório. |
| Sistema Web | Valida as credenciais e a prova, gera o PDF com os QR Codes, disponibiliza o gabarito, recebe e deduplica as correções sincronizadas, sinaliza e registra conflitos e associa as notas aos alunos. |
| Web no celular | A tela de correção do SGP aberta no navegador do celular: confere e baixa o gabarito, lê o QR Code e o cartão-resposta pela câmera, calcula a nota, guarda as correções na fila local e sincroniza quando há conexão. |

A raia "Web no celular" não é um segundo sistema: é a mesma web do SGP, usada no
celular por causa da câmera
([ADR-001](../../adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md)). O aluno não
tem raia, porque não executa nenhuma ação no sistema.

### Diagrama de Atividades

![Diagrama de Atividades do SGP com raias](atividade.png)
