# Teste de ponta a ponta da N2 no sistema publicado

| | |
|---|---|
| **Data** | 30/10/2026, por volta das 22h30 (horário de Brasília) |
| **Web testada** | https://sgp-provas.vercel.app (deploy de produção do commit `b0c48d2`, merge do PR #24) |
| **API testada** | https://sgp-provas-api.vercel.app (`GET /health` respondeu 200 em 0,6 s antes do teste) |
| **Navegador** | Google Chrome 156.0.8078.74, controlado pelo Playwright 1.56.1 (headless) |
| **Telas** | 1280x800 no computador; 390x844 (celular) nas telas de correção |
| **Conta** | ana.costa@escola.edu.br, professora do seed |
| **Dados criados** | todos com o prefixo "N2 Teste" e um número da rodada (ex.: "N2 Teste Turma 04416") |

## Resultado

**12 dos 13 passos passaram no site publicado.** O passo 7 falhou porque as
versões não mostravam a imagem do QR Code. Também apareceu um defeito no passo 10:
o CSV baixava com o id da aplicação no nome. Os dois foram corrigidos nesta branch
e o teste completo foi repetido com a correção: **13 de 13** (ver
[Falhas e correções](#falhas-e-correções)).

Nenhum erro de JavaScript apareceu no console da página em nenhuma das rodadas.

| Passo | Resultado esperado | Resultado obtido | Print |
|---|---|---|---|
| 1. Sem login, abrir `/turmas` | Vai para `/login` | ✅ Abriu `/login` | [01](n2/01-login-redireciona.png) |
| 2. Login | Senha errada mostra erro; senha certa abre o dashboard com o nome da Ana | ✅ Senha errada: "E-mail ou senha incorretos."; senha certa abriu "Olá, Ana" com "Ana Costa" no menu e os números da API (6 turmas, 5 provas, 6 aplicações) | [02 erro](n2/02-login-senha-errada.png), [02 dashboard](n2/02-login.png) |
| 3. Turma | Criar, editar e excluir | ✅ Criou "N2 Teste Turma 04416", editou para "N2 Teste Turma 04416 (editada)", criou e excluiu uma segunda turma; conferido depois de recarregar a página | [03 confirmação](n2/03-turma-confirmar-exclusao.png), [03 lista](n2/03-turma.png) |
| 4. Alunos | Adicionar 2, editar 1, remover 1; matrícula repetida mostra o erro da API | ✅ Adicionou 2, editou o nome de um e removeu o outro. A matrícula repetida mostrou "Já existe um aluno com esta matrícula nesta turma." (409 da API). Depois adicionou um terceiro aluno, usado no passo 9 | [04 matrícula repetida](n2/04-alunos-matricula-repetida.png), [04 alunos](n2/04-alunos.png) |
| 5. Questões | Criar, editar e excluir uma objetiva e uma discursiva | ✅ Criou e editou uma objetiva e uma discursiva; criou e excluiu outra objetiva e outra discursiva. Depois de recarregar ficaram só as 2 editadas | [05 confirmação](n2/05-questoes-confirmar-exclusao.png), [05 lista](n2/05-questoes.png) |
| 6. Prova | Criar com questões, editar e excluir; deixar uma para o passo 7 | ✅ "N2 Teste Prova 04416 (editada)" com 2 questões, 10,0 pontos, status Pronta; uma segunda prova foi criada e excluída | [06](n2/06-provas.png) |
| 7. Aplicação | Criar para a turma de teste e gerar versões; o QR Code aparece | ❌ As 2 versões foram geradas, mas cada uma mostrava só o texto do QR Code (ex.: `sgp:...:v1:21463681`), sem a imagem. **Corrigido**: depois da correção, cada versão mostra a imagem do QR Code | [07 antes](n2/07-aplicacao-versoes.png), [07 corrigido](n2/07-aplicacao-versoes-corrigido.png) |
| 8. Correção no celular (390x844) | Escanear, revisar e confirmar; o progresso aumenta; sem rolagem horizontal | ✅ Revisão com nota 5,0 para o aluno identificado; depois de confirmar, o progresso foi de "0 de 2 corrigidas" para "1 de 2 corrigidas". Nenhuma das 4 telas teve rolagem horizontal. Em ambiente sem câmera (o navegador do teste), o quadro mostra a instrução e "Simular leitura" faz a leitura de exemplo | [08 lista](n2/08-celular-correcao-lista.png), [08 escanear](n2/08-celular-escanear.png), [08 revisão](n2/08-celular-revisao.png), [08 depois](n2/08-celular-correcao-depois.png) |
| 9. Nota manual | Lançar uma nota manual e editá-la | ✅ Lançou 6,5 para o terceiro aluno e editou para 7,0; origem "Manual" | [09](n2/09-nota-manual.png) |
| 10. Relatório | Estatísticas aparecem; o CSV baixa com as notas | ✅ "2 notas · média 6,0 · mediana 6,0 · desvio padrão 1,00 · de 5,0 a 7,0". O CSV veio com as 2 notas (5,0 automática e 7,0 manual), **mas com o nome `notas-<id da aplicação>.csv`**. **Corrigido**: agora baixa como `notas-<prova>-<turma>.csv`. O print é a mesma tela de notas do passo 9 recarregada; o arquivo baixado não aparece nele | [10](n2/10-relatorio.png) |
| 11. Excluir turma com correções | Mostra a mensagem 409 da API | ✅ "Esta turma tem provas corrigidas e não pode ser excluída, para não perder o histórico de notas." | [11](n2/11-turma-409.png) |
| 12. F5 numa rota interna | Não dá 404 | ✅ Recarregar `/turmas`, `/relatorios/:id` e `/correcao` respondeu HTTP 200 e abriu a tela | [12](n2/12-f5-turmas.png) |
| 13. Sair | Volta ao login; `/dashboard` passa a levar a `/login` | ✅ Voltou ao `/login`, apagou os tokens do navegador e `/dashboard` redirecionou para `/login` | [13](n2/13-sair.png) |

O CSV baixado no passo 10 (separador `;` e vírgula decimal, como o Excel em
português abre):

```
Aluno;Matrícula;Nota;Origem
N2 Teste Aluno Ana 04416 Souza;N2T044161;5,0;Automática
N2 Teste Aluno Carla 04416;N2T044163;7,0;Manual
```

## Falhas e correções

### Passo 7: o QR Code não aparecia

- **O que falhou:** a tela de gerar versões (`/aplicacoes/:id/exportar`) listava
  cada versão só com o texto do QR Code. O professor não tinha a imagem que vai
  impressa na prova.
- **Correção:** commit `fix(web-professor): mostra a imagem do qr code de cada versão`.
  - Novo componente `src/components/QrCode.vue`, que desenha o QR Code com a
    biblioteca `qrcode` usando as cores de `tokens.css`.
  - Na lista de versões, cada uma mostra a imagem ao lado do número e do texto.
  - A biblioteca entra só no pacote dessa tela, que é carregado sob demanda.
- **Reteste:** passou. As 2 versões aparecem cada uma com a sua imagem de QR Code
  ([print](n2/07-aplicacao-versoes-corrigido.png)).

### Passo 10: o CSV baixava com o id da aplicação no nome

- **O que falhou:** no site publicado o arquivo se chamava
  `notas-cmvvr20g00001jn08xu02o78a.csv`.
- **Causa:** a API sugere o nome `notas-<prova>-<turma>.csv` no cabeçalho
  `Content-Disposition`. Mas a web e a API ficam em endereços diferentes, e o
  navegador só deixa a página ler esse cabeçalho quando a API o libera no CORS
  (ela não libera). Por isso a tela caía no nome reserva, com o id. Em
  `npm run dev` o problema não aparece, porque lá a API passa por um proxy no
  mesmo endereço da web.
- **Correção:** commit `fix(web-professor): corrige o nome do csv baixado no site publicado`.
  A tela de notas monta o nome com a mesma regra da API (título da prova e nome
  da turma, sem acento e com hífens). Não foi preciso mexer na API.
- **Reteste:** passou. O CSV baixou como
  `notas-n2-teste-prova-63370-editada-n2-teste-turma-63370-editada.csv`, igual ao
  nome que a API sugere.

### Como foi o reteste

As correções só chegam a https://sgp-provas.vercel.app depois do merge na `main`.
O preview da Vercel desta branch não serve para testar, porque a API publicada só
libera o CORS para o endereço de produção da web.

Por isso o reteste rodou os **13 passos inteiros** com o código desta branch em
`npm run dev`, chamando a **mesma API publicada** e o mesmo banco. Resultado:
**13 de 13**.

Depois do merge, vale repetir os passos 7 e 10 no site publicado.

## Observação (não é falha da web)

Uma aplicação com todas as provas lidas (ex.: "2 de 2 corrigidas") continua com o
status "Em correção" e segue na lista da tela de Correção. A API não muda o status
para "Concluída" sozinha, e a web não tem botão para concluir. Fica como sugestão
para a API.

## Nenhuma tela usa dado fixo

As telas buscam tudo na API. A pasta `src/mocks` não existe mais, e a busca
abaixo não devolve nada:

```
$ grep -rni "mock" apps/web-professor/src
$ echo $?
1
```

## Limpeza do banco

Os dados criados pelo teste foram apagados ao final:

- O que dava para apagar pela tela já tinha sido excluído durante o próprio teste.
- O resto foi apagado direto no banco, porque a API recusa com 409 apagar turma ou
  aplicação com correção. Para isso foi usado um script temporário com o Prisma da
  API, fora do repositório e apagado depois do uso.
- O script listou antes o que ia apagar e só aceitava registros criados pela API
  (o seed tem ids como `turma-1` e `prova-1`).
- Entraram as turmas "N2 Teste" e "E2E Turma" (das rodadas deste teste e do teste
  do PR #24) e as provas e questões com esses prefixos. Tudo foi apagado numa
  transação, na ordem das chaves estrangeiras.

| Conta da Ana Costa | Antes da limpeza | Depois | Seed |
|---|---|---|---|
| Turmas | 9 | 4 | 4 |
| Alunos | 125 | 115 | 115 |
| Questões | 24 | 10 | 10 |
| Alternativas | 68 | 32 | 32 |
| Provas | 13 | 5 | 5 |
| Aplicações | 10 | 5 | 5 |
| Versões | 21 | 11 | 11 |
| Correções | 41 | 31 | 31 |

Depois da limpeza ficaram só os registros do seed:

- **Turmas:** `turma-1` a `turma-4`.
- **Provas:** `prova-1` a `prova-5`.
- **Questões:** `questao-1` a `questao-10`.
- **Aplicações:** `aplicacao-1` a `aplicacao-5`, com o mesmo status e o mesmo
  número de provas corrigidas de antes dos testes.
