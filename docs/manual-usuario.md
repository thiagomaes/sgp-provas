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

1. Abra https://sgp-provas.vercel.app.
2. Digite o e-mail e a senha e clique em **Entrar**.
3. Você chega ao painel (Dashboard), com as últimas aplicações.

Para sair, use o botão **Sair** no canto inferior do menu lateral. No celular, o menu abre pelo botão no topo da tela.

<!-- print: 01-login.png, 02-dashboard.png -->

## 2. Cadastrar turmas e alunos

1. No menu, abra **Turmas** e clique em **+ Nova turma**.
2. Preencha nome, disciplina, ano e turno, e salve.
3. Clique em **Abrir →** na turma e depois em **+ Adicionar aluno**.
4. Informe o nome completo e a matrícula. A matrícula não pode se repetir dentro da mesma turma.

Você pode **Editar** uma turma ou um aluno a qualquer momento. Uma turma ou um aluno que já tem provas corrigidas não pode ser excluído, para não perder o histórico de notas.

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

1. Abra o SGP no navegador do celular, entre na sua conta e vá em **Correção**.
2. Escolha a aplicação e abra **Escanear prova**. Permita o uso da câmera quando o navegador pedir. A câmera só abre no site com `https`.
3. Aponte a câmera para o cartão-resposta, com as quatro marcas dos cantos visíveis. O sistema lê o QR Code (versão e, na prova identificada, o aluno) e as bolinhas marcadas.
4. Na tela **Revisar correção**, confira as respostas lidas e a nota calculada. Se algo estiver errado, ajuste a nota.
5. Confirme. Na prova identificada, a nota vai direto para o aluno.

**Prova sem identificação:** a nota fica guardada sem aluno. Depois, na tela de notas (passo 9), em **Provas lidas sem identificação**, você escolhe o aluno de cada uma, usando o nome e a matrícula escritos na folha.

Quando todos os alunos da turma têm correção, a aplicação passa sozinha para **Concluída**. Se você excluir uma correção, ela volta para **Em correção**.

> **Atenção, estado desta versão:** a leitura automática da câmera (QR Code e bolinhas) e o uso sem internet ainda estão em desenvolvimento. Hoje a tela abre a câmera e o botão **Simular leitura** leva à revisão com uma leitura de exemplo, que grava a correção de verdade. Este passo será atualizado quando a leitura real for publicada.

<!-- print: 12-correcao.png, 13-escanear.png, 14-revisao.png -->

## 9. Ver e exportar as notas

1. No menu, abra **Relatórios e notas**. A lista mostra cada aplicação com a **média** das notas.
2. Clique em uma aplicação para ver as notas dos alunos e as estatísticas: **média**, **mediana** e **desvio padrão**.
3. Em **Provas lidas sem identificação**, ligue cada prova a um aluno da turma.
4. Clique em **Exportar CSV** para baixar a planilha e lançar as notas no sistema da escola.

<!-- print: 15-relatorios.png, 16-notas.png -->

## 10. Problemas comuns

| O que aconteceu | O que fazer |
|---|---|
| "A turma não tem alunos" ao gerar o PDF | Cadastre os alunos na turma ou desligue **Identificar aluno na prova**. |
| "Gere o PDF antes de corrigir" | Abra **Configurar PDF** da aplicação e clique em **Gerar PDF**. |
| Não consigo gerar versões novas | A correção já começou. Exclua as correções da aplicação, se for o caso, ou crie outra aplicação. |
| Não consigo excluir a turma, o aluno ou a aplicação | Eles já têm provas corrigidas. O sistema protege as notas. |
| A câmera não abre no celular | Permita a câmera nas configurações do navegador e confira se o endereço começa com `https`. |
| O cartão não é lido | Reimprima em escala 100%, sem ajustar à página, e deixe as quatro marcas e o QR Code visíveis. |
| O PDF de uma turma grande não baixa | A turma pode ser grande demais para um único arquivo. Divida a turma em duas aplicações. |
