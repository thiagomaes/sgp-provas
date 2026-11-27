# ADR-008: Correção offline com fila no localStorage e clientCorrectionId

- **Status:** aceita
- **Data:** 27/11/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

O RF10 e o RNF06 pedem que a correção pelo celular funcione sem internet, com
uma fila local e sincronização automática ao reconectar, sem duplicar notas. O
cenário real é a sala de aula: o professor corrige uma pilha de provas pelo
celular, e o Wi-Fi da escola cai no meio.

O que já existia:

- **API idempotente desde a N2:** cada correção é enviada com um
  `clientCorrectionId`, gerado na tela de revisão e único no banco. Reenviar a
  mesma correção não cria uma segunda nota.
- **Leitura sem servidor:** a leitura do cartão já roda no navegador
  ([ADR-007](ADR-007-leitura-do-cartao-no-navegador.md)).
- **Plano da N3:** previa transformar a web numa PWA (`vite-plugin-pwa`), com
  service worker guardando as telas e o gabarito das aplicações em correção, e a
  fila de correções no IndexedDB.

A T11 ficou para o fim da N3, depois da leitura do cartão, com pouco tempo até a
entrega e a apresentação feita no sistema publicado.

## Decisão

A correção sem internet cobre o **envio**: uma correção confirmada sem conexão
vai para uma fila no navegador e é enviada depois. A web **não** virou uma PWA
completa.

Na prática, conferido em `apps/web-professor/src/services/filaOffline.ts`:

- **Guardar na fila:** ao confirmar a revisão, a tela tenta enviar. Se a
  requisição nem chega à API (erro de rede, `status 0`), a correção vai para a
  fila na chave `sgp:correcoes-pendentes` do `localStorage`, com a aplicação e o
  mesmo corpo que seria enviado, inclusive o `clientCorrectionId`.
- **Quando envia:** no evento `online` do navegador, ao abrir a tela de Correção
  e pelo botão **Enviar agora**. O envio para na primeira falha de rede e tenta
  de novo depois. Uma sessão vencida (401) também conta como "sem conexão", e a
  correção espera o próximo login.
- **Recusa da API:** se a API recusar a correção (por exemplo, o aluno já tinha
  nota), ela fica na fila marcada com o motivo. A tela de Correção mostra o
  motivo e o botão **Descartar**.
- **Sem duplicar:** como cada correção mantém o seu `clientCorrectionId`,
  reenviar depois de uma resposta perdida não duplica a nota.

## Alternativas consideradas

**PWA completa (o plano da N3).** Com o service worker, as telas e os dados da
aplicação (versões e gabarito) ficariam no celular, e a correção funcionaria
inteira sem internet, inclusive abrir a tela. Ficou para depois por quatro
motivos:

- **Cache que envelhece:** se as versões forem geradas de novo, o gabarito
  guardado fica velho, e é justamente o problema que a T07 já trata no QR Code
  ("versões geradas de novo"). Seria preciso invalidar esse cache com cuidado.
- **Atualização do service worker:** um service worker com defeito pode deixar
  uma versão velha da web presa nos aparelhos, e corrigir isso perto da
  apresentação é arriscado.
- **Sessão vencida:** o access token vale 1 hora
  ([ADR-003](ADR-003-autenticacao-jwt.md)). Um uso longo sem internet precisaria
  de outra regra de sessão.
- **Tempo:** não cabia testar tudo isso no prazo da N3.

**IndexedDB no lugar do `localStorage`.** É o certo para volume grande ou dados
binários. A fila guarda poucos objetos JSON pequenos (as letras e os pontos de
cada correção), que cabem no `localStorage` com folga, e a API síncrona dele
deixa o código menor.

**Background Sync API.** O navegador enviaria a fila mesmo com a página fechada.
Exige service worker e só existe nos navegadores baseados no Chrome.

## Consequências

**Positivas**

- **Simples:** a solução tem cerca de 90 linhas, sem dependência nova, e a tela
  de revisão mudou em 2 linhas.
- **Nada se perde:** uma queda de internet durante a correção não perde a prova
  nem duplica a nota.
- **O professor acompanha a fila:** vê quantas correções estão guardadas e quais
  foram recusadas.
- **Base para a PWA:** a fila e o `clientCorrectionId` continuam servindo se a
  PWA vier depois. Ela só precisaria guardar as telas e os dados da aplicação.

**Negativas e riscos**

- **RF10 e RNF06 atendidos em parte:** a tela de escanear e a de revisão buscam
  a aplicação e as versões na API quando abrem, então precisam de internet para
  abrir. Sem conexão, só a confirmação de uma revisão já aberta funciona. Isso
  está nas limitações do README e no manual.
- **Fila presa ao navegador:** limpar os dados do navegador ou trocar de celular
  antes do envio perde as correções guardadas.
- **Sessão vencida segura o envio:** a correção espera um novo login, e o
  professor precisa abrir o sistema de novo para ela sair.
