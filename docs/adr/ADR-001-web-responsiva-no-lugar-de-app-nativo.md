# ADR-001: Web responsiva no lugar de app nativo

- **Status:** aceita
- **Data:** 09/10/2026
- **Decisão do grupo:** Grupo 10 (SGP)

## Contexto

Na N1, o SGP tinha duas aplicações de cliente para o mesmo usuário, o professor:

- `apps/web-professor` (Vite + Vue), com turmas, questões, provas, aplicações,
  PDF e relatórios;
- `apps/mobile-professor` (React Native + Expo), com as 4 telas de correção:
  login, home com fila offline, câmera e revisão da nota.

Isso trouxe três problemas:

1. **A correção não aparecia no sistema publicado.** Só a web estava hospedada
   ([sgp-provas.vercel.app](https://sgp-provas.vercel.app)). O app Expo não
   tinha link: para ver a correção era preciso instalar o Expo Go e rodar o
   projeto. O feedback da professora na N1 foi exatamente este: "No sistema
   não encontrei botão ou tela de correção de prova."
2. **Dois códigos para o mesmo usuário.** Duas stacks (Vue e React Native),
   duas cópias da paleta de cores (`tokens.css` e `theme.js`), dois conjuntos
   de dados mock e duas telas de login para manter em sincronia.
3. **A N2 dobraria o trabalho de integração.** Cada tela que passasse a usar a
   API teria que ser ligada duas vezes, uma em cada cliente.

O que justificava o app nativo era o acesso à câmera e o funcionamento offline
(RF08, RF10, RNF06). Hoje os dois existem no navegador do celular:

- **Câmera:** `navigator.mediaDevices.getUserMedia` abre a câmera traseira em
  qualquer navegador moderno, desde que a página esteja em HTTPS, que é o
  caso do site publicado na Vercel.
- **Offline:** um PWA (service worker para guardar a aplicação e os gabaritos,
  IndexedDB para a fila local de correções) cobre o mesmo papel do SQLite do
  app.

## Decisão

O SGP passa a ser **um sistema web só**, `apps/web-professor`, responsivo e
usado também no celular. Não existe mais app nativo separado.

- A correção vira um fluxo da própria web: `/correcao` (lista das aplicações a
  corrigir), `/correcao/:id/escanear` (câmera) e `/correcao/:id/revisao`
  (conferir, ajustar e confirmar a nota).
- Abaixo de 768px de largura, a sidebar vira um menu recolhível e as tabelas
  rolam na horizontal dentro do próprio bloco.
- A pasta `apps/mobile-professor` foi removida do repositório.

## Consequências

**Positivas**

- **Um sistema, um link.** Tudo o que o professor faz, inclusive corrigir,
  está no endereço publicado. Quem avalia o sistema encontra a correção no
  menu.
- **Menos código para manter.** Uma stack, uma paleta, um conjunto de mocks,
  um login. Na N2, cada tela é ligada à API uma vez só.
- **Sem instalação.** O professor abre o link no celular; não depende de loja
  de aplicativos nem de Expo Go.

**Negativas e riscos**

- **Leitura da câmera no navegador.** O desempenho do reconhecimento do
  cartão-resposta no navegador ainda precisa ser validado em celulares mais
  simples. Se não for suficiente, o Vision Service previsto no README (leitura
  no servidor) passa a ser o caminho quando houver conexão.
- **Offline ainda não implementado.** Nesta fase a correção usa dados mock e
  a leitura é simulada pelo botão "Simular leitura". O PWA, a fila local em
  IndexedDB e a sincronização com deduplicação por `clientCorrectionId`
  (RF10) ficam para a N2/N3.
- **iOS tem limites em PWA**, por exemplo para sincronização em segundo plano.
  A sincronização pode precisar acontecer quando o professor abre a tela, em
  vez de em segundo plano.
- **Documentos anteriores falam em "app mobile".** Os planos em
  `docs/arquitetura/` e os diagramas UML da N2 Parte 1 devem tratar a
  correção como tela da web usada no celular, não como um segundo sistema.
