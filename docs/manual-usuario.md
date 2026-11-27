# Manual do usuário: SGP, Sistema de Geração de Provas

Este manual é para o **professor**. Ele mostra, passo a passo, como entrar no SGP, cadastrar turmas e alunos, montar questões e provas, gerar o PDF, corrigir pelo celular e ver as notas.

O sistema fica em https://sgp-provas.vercel.app e funciona no computador e no navegador do celular.

> O aluno não usa o SGP: não tem login nem consulta nota. Ele só aparece no sistema como um cadastro (nome e matrícula) feito pelo professor.

## Sumário

1. [Entrar no sistema](#1-entrar-no-sistema)
2. [Cadastrar turmas e alunos](#2-cadastrar-turmas-e-alunos)
3. [Montar o banco de questões](#3-montar-o-banco-de-questões)
4. [Montar uma prova](#4-montar-uma-prova)
5. [Aplicar a prova e gerar o PDF](#5-aplicar-a-prova-e-gerar-o-pdf)
6. [Imprimir o PDF](#6-imprimir-o-pdf)
7. [Ver e imprimir o gabarito](#7-ver-e-imprimir-o-gabarito)
8. [Corrigir pelo celular](#8-corrigir-pelo-celular)
9. [Ver e exportar as notas](#9-ver-e-exportar-as-notas)
10. [Problemas comuns](#10-problemas-comuns)

---

## 1. Entrar no sistema

**Criar conta (primeiro acesso):**

1. Abra https://sgp-provas.vercel.app e clique em **Criar conta**.
2. Preencha o nome, o e-mail e a senha (mínimo de 6 caracteres) e confirme a senha.
3. Clique em **Criar conta**. Você já entra no sistema.

**Entrar:**

1. Digite o e-mail e a senha e clique em **Entrar**.
2. Você chega ao painel (Dashboard), com as últimas aplicações.

Depois de várias tentativas erradas seguidas, o sistema bloqueia o login por um tempo. Espere e tente de novo.

**Esqueci minha senha:**

1. Na tela de entrada, clique em **Esqueci minha senha**, digite o seu e-mail e clique em **Pedir link de redefinição**.
2. O SGP ainda **não envia e-mail**. O link de redefinição fica no registro do servidor, e quem administra o sistema repassa o link a você. Ele vale por **1 hora** e só pode ser usado **uma vez**.
3. Abra o link, escolha a senha nova (mínimo de 6 caracteres), confirme e salve. As sessões abertas em outros aparelhos são encerradas.
4. Volte para a tela de entrada e entre com a senha nova.

Para sair, use o botão **Sair** no canto inferior do menu lateral. No celular, o menu abre pelo botão no topo da tela.

<!-- print: 01-login.png, 02-dashboard.png -->

## 2. Cadastrar turmas e alunos

1. No menu, abra **Turmas** e clique em **+ Nova turma**.
2. Preencha nome, disciplina, ano e turno, e salve.
3. Clique em **Abrir →** na turma e depois em **+ Adicionar aluno**.
4. Informe o nome completo e a matrícula. A matrícula não pode se repetir dentro da mesma turma.

Você pode **Editar** uma turma ou um aluno a qualquer momento. Uma turma ou um aluno que já tem provas corrigidas não pode ser excluído, para não perder o histórico de notas.

**Importar vários alunos de uma vez:**

1. Na tela da turma, clique em **Importar alunos**.
2. Escolha um arquivo **.csv** ou **.xlsx** com uma coluna **Nome** e uma coluna **Matrícula**. Se a primeira linha não tiver esses títulos, o sistema entende que a coluna A é o nome e a B é a matrícula.
3. Confira a prévia: as linhas com problema ficam marcadas (sem nome, matrícula repetida na planilha ou aluno que já está na turma).
4. Clique em **Importar** com o total de alunos. Só as linhas sem erro entram, todas de uma vez. O limite é de 500 alunos por arquivo.

**Dica:** cadastre todos os alunos antes de gerar o PDF. Se você for usar a prova identificada (passo 5), o número de versões é o número de alunos da turma.

<!-- print: 03-turmas.png, 04-turma-alunos.png -->

## 3. Montar o banco de questões

1. No menu, abra **Banco de questões** e clique em **+ Nova questão**.
2. Escolha a **disciplina** e o **tipo**:
   - **Objetiva:** escreva o enunciado, de 2 a 5 alternativas e marque **uma** como correta.
   - **Discursiva:** escreva o enunciado, a pontuação máxima e a resposta esperada, que depois aparece no gabarito.
3. Se quiser, preencha as **tags** (por exemplo, "equações, álgebra") para achar a questão depois.
4. Salve.

Na lista, use a busca por enunciado ou tag, e os botões **Editar** e **Excluir**. Uma questão excluída deixa de aparecer no banco, mas as provas que já a usavam continuam completas.

<!-- print: 05-banco-questoes.png, 06-nova-questao.png -->

## 4. Montar uma prova

1. No menu, abra **Provas** e clique em **+ Nova prova**.
2. Dê um **título** à prova.
3. No painel **Banco de questões**, escolha as questões. Elas passam para **Selecionadas**, onde você define a **pontuação** de cada uma. Uma prova tem **até 20 questões**.
4. Salve. Você pode voltar e usar **Editar** depois.

O total de pontos é a soma das pontuações das questões.

<!-- print: 07-provas.png, 08-montar-prova.png -->

## 5. Aplicar a prova e gerar o PDF

1. No menu, abra **Aplicações e PDF**, escolha a **prova** e marque a **turma** (ou mais de uma). O sistema cria uma aplicação para cada turma marcada.
2. Na linha da aplicação, clique em **Configurar PDF →** e ajuste:
   - **Quantidade de versões:** quantas versões diferentes da prova serão geradas.
   - **Embaralhar questões:** a ordem das questões muda entre as versões.
   - **Embaralhar alternativas:** a ordem das alternativas muda entre as versões.
   - **Identificar aluno na prova:** cada aluno recebe a sua própria versão, com **nome e matrícula impressos** no cartão-resposta e o QR Code ligado a ele. Com essa opção ligada, o número de versões fica igual ao número de alunos da turma e não pode ser alterado. A turma precisa ter alunos (até 200).
3. Clique em **Gerar PDF**. O arquivo é baixado e a aplicação passa para "PDF gerado".

Para baixar de novo depois, volte à mesma tela e use **Baixar PDF**.

**O que tem no PDF:** para cada versão, o **caderno de questões** (nenhuma questão é cortada entre duas páginas) seguido do **cartão-resposta**, com quatro marcas nos cantos, o QR Code da versão e a grade de bolinhas.

Depois que a correção começa, não é possível gerar versões novas, porque isso invalidaria as provas já lidas.

<!-- print: 09-aplicacoes.png, 10-configurar-pdf.png -->

## 6. Imprimir o PDF

Esta etapa é a mais importante para a leitura funcionar.

- Imprima em **escala 100%** (tamanho real). Na janela de impressão, escolha **Tamanho real** ou **100%**, e **nunca** "Ajustar à página".
- Use papel **A4**.
- Imprima o cartão-resposta em **preto e branco, sem borrar**. As quatro marcas dos cantos e o QR Code precisam sair nítidos.
- Entregue o caderno e o cartão-resposta da **mesma versão** para o mesmo aluno. Na prova identificada, entregue a cada aluno a versão com o nome dele.

Peça aos alunos que preencham as bolinhas por completo, com caneta preta ou azul escura, uma alternativa por questão.

## 7. Ver e imprimir o gabarito

1. Em **Aplicações e PDF**, clique em **Gabarito** na linha da aplicação. O link aparece depois que as versões foram geradas.
2. A tela mostra, para cada versão, a **resposta certa de cada questão**, já na ordem e nas letras daquela versão. Como as alternativas podem ser embaralhadas, a letra certa muda de uma versão para outra. Nas questões discursivas aparece a resposta esperada.
3. Use o filtro **Versão** para ver só uma versão.
4. Clique em **Imprimir gabarito**. Cada versão sai em uma página.

<!-- print: 11-gabarito.png -->

## 8. Corrigir pelo celular

1. Abra o SGP no navegador do celular, entre na sua conta e vá em **Correção**. A lista mostra as aplicações esperando correção (com o PDF gerado e ainda não concluídas), com quantas provas já foram corrigidas.
2. Na aplicação, toque em **Corrigir provas**. A tela **Escanear prova** abre a câmera traseira; permita o uso da câmera quando o navegador pedir. A câmera só abre no site com `https`.
3. Aponte a câmera para o cartão-resposta **inteiro**, com os 4 quadrados pretos dos cantos dentro da imagem. O sistema lê primeiro o QR Code, que diz a versão e, na prova identificada, o aluno. Aparece "Versão N identificada. Lendo as marcações..." e, em seguida, ele lê as bolinhas pintadas. O cartão pode estar de lado ou de cabeça para baixo.
4. A tela **Revisar correção** abre com as respostas lidas já marcadas e a **nota calculada**. Em cima aparece uma miniatura da foto, com a letra lida circulada em cada questão.
5. Confira as questões **destacadas em amarelo**:
   - **Em branco:** nenhuma bolinha estava pintada.
   - **Mais de uma marcação: anulada:** duas ou mais bolinhas pintadas. A questão vale zero.
   - **Marcação duvidosa** ou **Leitura fraca:** a bolinha estava pouco preenchida.
   Se a leitura estiver diferente do cartão, toque na letra certa (tocar de novo na letra marcada deixa a questão em branco). Nas questões discursivas, digite os pontos. Se precisar, use **Ajustar nota**.
6. Toque em **Confirmar**. Na prova identificada, a nota vai direto para o aluno do QR Code. A câmera abre de novo para a próxima prova.

**Se a leitura falhar,** a tela mostra o motivo (por exemplo, "Enquadre o cartão inteiro, com os 4 quadrados pretos") e dois botões:

- **Tentar de novo:** volta para a câmera.
- **Marcar à mão:** abre a revisão na versão e no aluno lidos no QR Code, com as respostas em branco para você marcar olhando o cartão.

**Sem câmera** (no computador, ou com a câmera bloqueada), use **Escolher a versão**: escolha a versão (e, na prova identificada, o aluno) e marque as respostas à mão na revisão.

**Dicas para a leitura dar certo:**

- Deixe o cartão inteiro na imagem, com os 4 quadrados pretos aparecendo, e segure o celular parado até a imagem ficar nítida.
- Use boa luz, sem sombra forte e sem reflexo na folha. Evite o flash.
- Peça aos alunos caneta preta ou azul escura e a bolinha pintada por inteiro. Caneta fraca ou bolinha só riscada pode sair como "Leitura fraca".
- O cartão impresso em escala 100% é o que funciona (passo 6).

**Prova sem identificação:** a nota fica guardada sem aluno. Depois, na tela de notas (passo 9), em **Provas lidas sem identificação**, você escolhe o aluno de cada uma, usando o nome e a matrícula escritos na folha.

**Prova já corrigida:** se o cartão de um aluno que já tem nota for lido de novo, a revisão avisa "A prova de ... já foi corrigida". Para mudar a nota, use **Ver notas**.

Quando todos os alunos da turma têm correção, a aplicação passa sozinha para **Concluída**. Se você excluir uma correção, ela volta para **Em correção**.

### Correção sem internet

Se a internet cair na hora de **Confirmar**, a correção não se perde: ela fica guardada no navegador do celular e é enviada sozinha quando a conexão voltar. A tela de **Correção** mostra quantas correções estão guardadas, com o botão **Enviar agora**. Enviar de novo não duplica a nota.

Atenção aos limites:

- **As telas precisam abrir com internet.** A tela de escanear e a de revisão buscam a aplicação e as versões na hora em que abrem. Sem internet nesse momento, elas mostram erro. O que funciona sem conexão é confirmar uma revisão que já estava aberta.
- **As correções guardadas ficam só naquele navegador.** Não limpe os dados do navegador nem troque de celular antes de elas serem enviadas.
- Se o sistema recusar uma correção guardada (por exemplo, o aluno já tinha nota), a tela de **Correção** mostra o motivo e o botão **Descartar**.

<!-- print: 12-correcao.png, 13-escanear.png, 14-revisao.png -->

## 9. Ver e exportar as notas

1. No menu, abra **Relatórios e notas**. A lista mostra cada aplicação com a turma, a prova, a data e a **média** das notas.
2. Clique em **Ver resultados →** para ver as notas dos alunos e as estatísticas: **média**, **mediana**, **desvio padrão**, menor e maior nota. A coluna **Origem** diz se a nota veio da câmera (**Automática**) ou foi lançada à mão (**Manual**).
3. Em **Acerto por questão**, veja o percentual de acerto de cada questão e quantas vezes cada alternativa foi marcada, com a mais marcada em destaque. As versões embaralhadas são somadas pela letra da prova original. Só entram as provas lidas pela câmera; notas lançadas à mão não têm respostas.
4. Em **Provas lidas sem identificação**, ligue cada prova a um aluno da turma.
5. Para lançar ou mudar uma nota à mão, use **— lançar —** ou **editar** na linha do aluno. **excluir** apaga a correção, e a prova pode ser lida de novo.

Para exportar:

| Botão | Onde | O que baixa |
|---|---|---|
| **Exportar CSV** | Notas da aplicação | Planilha simples (aluno, matrícula, nota e origem), para lançar no sistema da escola |
| **Exportar Excel** | Notas da aplicação | Arquivo `.xlsx` com matrícula, aluno e nota e, para cada questão, a letra marcada e se acertou |
| **Exportar PDF** | Notas da aplicação | Abre a impressão do navegador só com o título, as estatísticas e as notas; escolha **Salvar como PDF** |
| **Exportar tudo** | Relatórios e notas | CSV consolidado com as notas de todas as suas aplicações |

<!-- print: 15-relatorios.png, 16-notas.png -->

## 10. Problemas comuns

| O que aconteceu | O que fazer |
|---|---|
| "A turma não tem alunos" ao gerar o PDF | Cadastre os alunos na turma ou desligue **Identificar aluno na prova**. |
| "Gere o PDF antes de corrigir" | Abra **Configurar PDF** da aplicação e clique em **Gerar PDF**. |
| O login foi bloqueado depois de errar a senha | Espere alguns minutos e tente de novo. Se não lembra a senha, use **Esqueci minha senha**. |
| O link de redefinição de senha não chegou por e-mail | O SGP ainda não envia e-mail. Peça o link a quem administra o sistema. |
| "Este link de redefinição é inválido ou expirou" | O link vale 1 hora e uma única vez. Peça um novo em **Esqueci minha senha**. |
| Não consigo gerar versões novas | A correção já começou. Exclua as correções da aplicação, se for o caso, ou crie outra aplicação. |
| Não consigo excluir a turma, o aluno ou a aplicação | Eles já têm provas corrigidas. O sistema protege as notas. |
| A câmera não abre no celular | Permita a câmera nas configurações do navegador e confira se o endereço começa com `https`. |
| O cartão não é lido | Enquadre o cartão inteiro com os 4 quadrados pretos, melhore a luz e tire o reflexo. Se continuar, reimprima em escala 100%, sem ajustar à página. Para não parar a correção, use **Marcar à mão**. |
| Muitas questões em amarelo como "Leitura fraca" | As bolinhas estão pouco pintadas ou a caneta é clara. Confira essas questões na revisão antes de confirmar. |
| "Este cartão é de versões que foram geradas de novo" | As versões foram geradas outra vez depois da impressão. Imprima e use o PDF atual. |
| A tela de escanear ou de revisão mostra erro sem internet | Essas telas precisam de internet para abrir. Só a confirmação funciona sem conexão (ver o passo 8). |
| O PDF de uma turma grande não baixa | A turma pode ser grande demais para um único arquivo. Divida a turma em duas aplicações. |
