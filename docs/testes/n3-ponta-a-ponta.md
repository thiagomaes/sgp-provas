# Teste de ponta a ponta da N3 no sistema publicado

| | |
|---|---|
| **Data** | 27/11/2026, das 18h24 às 18h27 (horário de Brasília) |
| **Web testada** | https://sgp-provas.vercel.app (produção; a `main` estava em `0d58136`, merge do PR #97) |
| **API testada** | https://sgp-provas-api.vercel.app (`GET /health` respondeu 200 em 0,4 s antes do teste) |
| **Navegador** | Google Chrome 158.0.8127.38, controlado pelo Playwright 1.56.1 (headless) |
| **Telas** | 1280x800 no computador; 390x844 (celular, com toque) nos passos 10 e 11 |
| **Conta** | `teste.n3.202611272124@exemplo.com` ("Professor Teste N3"), criada no passo 2 e anonimizada no passo 14. A conta `ana.costa@escola.edu.br` não foi usada |
| **Dados criados** | turma "N3 Teste", 3 alunos "N3 Teste Aluno ...", 4 questões "N3 Teste: ...", prova "N3 Teste Prova" e uma aplicação identificada |

## Resultado

**14 de 14 passos passaram no site publicado.** Nenhum código foi alterado.

Apareceu um defeito fora dos critérios dos passos: o PDF da aplicação baixa com o
nome genérico `aplicacao.pdf` (ver [Defeito encontrado](#defeito-encontrado)).

Nenhum erro de JavaScript apareceu na página. O console só registrou as respostas
401 e 429 esperadas, das senhas erradas dos passos 3 e 14.

| Passo | Resultado esperado | Resultado obtido | Print |
|---|---|---|---|
| 1. Login e rota protegida | `/login` abre; sem login, `/turmas` leva ao `/login` | ✅ `/login` respondeu 200 com "Entrar no SGP"; `/turmas` sem login foi para `/login` | [01 login](n3/01-login.png), [01 redireciona](n3/01-turmas-redireciona.png) |
| 2. Cadastro | Criar o professor e entrar no dashboard | ✅ Conta "Professor Teste N3" criada com uma senha forte gerada para o teste; abriu `/dashboard` com "Olá, Professor" e o nome no menu | [02 cadastro](n3/02-cadastro.png), [02 dashboard](n3/02-dashboard.png) |
| 3. Limite de login | Com `limite.n3@exemplo.com` e senha errada, 5 tentativas dão erro e a 6ª mostra "Muitas tentativas" | ✅ Tentativas 1 a 5: HTTP 401, "E-mail ou senha incorretos."; 6ª: HTTP 429 com `Retry-After: 896`, "Muitas tentativas de login. Tente de novo em 15 minutos." | [03 5ª](n3/03-limite-5a-tentativa.png), [03 6ª](n3/03-limite-6a-tentativa.png) |
| 4. Esqueci minha senha | Mensagem genérica de envio | ✅ HTTP 204; a tela mostrou "Se teste.n3...@exemplo.com estiver cadastrado, um link de redefinição foi gerado. Ele vale por 1 hora e só pode ser usado uma vez." e o aviso de que o SGP ainda não envia e-mail. O link não foi usado | [04](n3/04-esqueci-senha.png) |
| 5. Turma e importação de alunos | Importar um CSV com 3 alunos; conferir a prévia e os 3 alunos | ✅ Turma "N3 Teste" criada. O CSV (`/tmp/n3-alunos-202611272124.csv`, com `;` e títulos "Nome" e "Matrícula") mostrou "3 alunos prontos" e as 3 linhas como "Pronto". Depois de importar e recarregar, a turma tinha os 3 alunos com o nome e a matrícula do arquivo | [05 turma](n3/05-turma.png), [05 prévia](n3/05-importar-previa.png), [05 alunos](n3/05-alunos.png) |
| 6. Banco de questões | 3 objetivas (uma com 3 alternativas) e 1 discursiva | ✅ As 4 questões aparecem na lista; a terceira objetiva tem só A, B e C; a discursiva vale 4 pontos e tem resposta esperada | [06 3 alternativas](n3/06-questao-3-alternativas.png), [06 lista](n3/06-questoes.png) |
| 7. Prova | Prova com as 4 questões | ✅ "4 de 20 questões · 10,0 pontos" (2 + 2 + 2 + 4); na lista, "N3 Teste Prova", 4 questões, 10,0, Pronta | [07 montar](n3/07-montar-prova.png), [07 lista](n3/07-provas.png) |
| 8. Aplicação identificada e PDF | Uma versão por aluno; PDF com caderno e cartão de cada aluno, nome e matrícula no cartão, nenhuma questão cortada; QR Code no formato `sgp:<id>:v<n>:<hash>:a<alunoId>` | ✅ Com "Identificar aluno na prova" ligado, o número de versões ficou travado em 3 ("Uma versão por aluno da turma (3 alunos)"). O PDF tem 6 páginas: caderno e cartão das versões 1, 2 e 3, nessa ordem. Cada cartão tem o nome e a matrícula do seu aluno. Cada questão, com todas as alternativas, ficou inteira numa página só (com 4 questões, cada caderno ocupa uma página). O jsQR leu o QR Code dos 3 cartões, todos no formato pedido, com o id desta aplicação e o id do aluno impresso no cartão. Ex.: cartão da página 2, Ana Lima: `sgp:cmwzhqgno000ql007gu9kmln9:v1:2d203645:acmwzhp6re0000l007stnq0bxv`. O texto do QR na tela de versões é igual ao lido no PDF | [08 configurar](n3/08-configurar-pdf.png), [08 versões](n3/08-versoes.png), [08 caderno](n3/08-pdf-caderno.png), [08 cartão](n3/08-pdf-cartao.png) |
| 9. Gabarito | A tela mostra a resposta de cada versão | ✅ 3 versões, cada uma com o aluno, a letra certa de cada objetiva e a resposta esperada da discursiva. Com as questões e as alternativas embaralhadas: v1 1=B 2=C 3=C 4=discursiva; v2 1=D 2=C 3=A 4=discursiva; v3 1=C 2=C 3=discursiva 4=D | [09](n3/09-gabarito.png) |
| 10. Correção no celular (390x844) | Pelo "Escolher a versão" e pela URL do QR, marcar as certas impressas, lançar a discursiva e confirmar; nota cheia | ✅ Sem câmera, o quadro mostrou "O acesso à câmera foi negado. Libere a câmera nas permissões do navegador ou use "Escolher a versão"." A lista mostrou as 3 versões com nome e matrícula. A versão 1 abriu `?versao=1&aluno=cmwzhp6re0000l007stnq0bxv`, igual ao QR do passo 8. A URL montada com o QR abriu a mesma revisão ("Versão 1 · N3 Teste Aluno Ana Lima · matrícula N3A272124"). Marcando as letras do gabarito da versão e 4 pontos na discursiva, a tela mostrou **10,0**. A API respondeu 201 com nota 10 no aluno do QR. Sem rolagem horizontal | [10 correção](n3/10-celular-correcao.png), [10 escolher](n3/10-celular-escolher-versao.png), [10 revisão](n3/10-celular-revisao.png), [10 marcada](n3/10-celular-revisao-marcada.png), [10 depois](n3/10-celular-depois.png) |
| 11. Corrigir os outros 2 alunos | A aplicação vira "Concluída" | ✅ Bruno Rocha (v2) e Carla Dias (v3), pelo "Escolher a versão": 10,0 cada, gravados no aluno certo, sem rolagem horizontal. Em Aplicações o status ficou "Concluída", e a aplicação saiu da lista da tela de Correção | [11 correção](n3/11-celular-correcao-depois.png), [11 concluída](n3/11-aplicacao-concluida.png) |
| 12. Notas | Editar uma nota, excluir uma correção (volta a "Em correção") e baixar o CSV | ✅ A nota da Ana foi editada de 10,0 para 8,5 e a origem passou a "Manual". A correção do Bruno foi excluída, e ele voltou a "— lançar —" ("2 notas · média 9,3 · mediana 9,3 · desvio padrão 0,75 · de 8,5 a 10,0"). O status voltou a "Em correção". O CSV baixou como `notas-n3-teste-prova-n3-teste.csv` (conteúdo abaixo) | [12 editada](n3/12-nota-editada.png), [12 excluída](n3/12-correcao-excluida.png), [12 status](n3/12-aplicacao-em-correcao.png) |
| 13. F5 e Sair | Recarregar uma rota interna não dá 404; Sair volta ao login | ✅ Recarregar `/turmas/:id`, `/relatorios/:id` e `/aplicacoes/:id/gabarito` respondeu 200 e abriu a mesma tela. Sair foi para `/login`, e `/dashboard` passou a redirecionar para `/login` | [13 F5](n3/13-f5-gabarito.png), [13 sair](n3/13-sair.png) |
| 14. Anonimizar a conta | Sai do sistema e o login com aquele e-mail passa a falhar | ✅ Em Minha conta, com a caixa "Entendi" marcada e a senha da conta de teste, a API respondeu 204 e a tela voltou ao `/login`. O login com o mesmo e-mail e a mesma senha respondeu 401, "E-mail ou senha incorretos." | [14 anonimizar](n3/14-anonimizar.png), [14 depois](n3/14-depois-anonimizar.png), [14 login](n3/14-login-falha.png) |

O CSV baixado no passo 12 (separador `;` e vírgula decimal):

```
Aluno;Matrícula;Nota;Origem
N3 Teste Aluno Ana Lima;N3A272124;8,5;Manual
N3 Teste Aluno Bruno Rocha;N3B272124;;Pendente
N3 Teste Aluno Carla Dias;N3C272124;10,0;Automática
```

## Defeito encontrado

### O PDF da aplicação baixa como `aplicacao.pdf`

- **O que acontece:** no passo 8, o PDF baixou como `aplicacao.pdf`. O teste
  passou, porque o nome do arquivo não está entre os critérios. Mas com várias
  aplicações, o professor recebe vários arquivos com o mesmo nome.
- **Causa:** a API sugere o nome `<prova>-<turma>.pdf` no cabeçalho
  `Content-Disposition`. A web e a API ficam em endereços diferentes, e a API não
  libera esse cabeçalho no CORS (`app.enableCors({ origin })`, sem
  `exposedHeaders`). Por isso o navegador não deixa a página ler o nome, e
  `baixarArquivo` usa o nome reserva. É a mesma causa do defeito do CSV na N2,
  que foi resolvido só na tela de notas.
- **Correção possível:** liberar o cabeçalho na API
  (`exposedHeaders: ['Content-Disposition']`), ou montar o nome na tela, como foi
  feito com o CSV.
- **Situação:** só registrado. Nenhum código foi alterado neste teste.

## Observações

- **Câmera:** o navegador do teste não tem câmera, então a leitura do QR Code pela
  câmera não foi testada aqui. O teste usou o "Escolher a versão" e a URL montada
  com o QR Code lido do PDF, como pede a tarefa. A leitura pela câmera falsa do
  Chrome foi testada no PR #97, mas ainda falta o teste com um celular de verdade.
- **Manual do usuário:** a seção 8 de `docs/manual-usuario.md` ainda diz que a
  leitura usa o botão "Simular leitura". No site publicado esse botão não existe
  mais; a tela lê o QR Code ou oferece o "Escolher a versão".
- **E-mail da conta de teste:** o número no e-mail é a data e a hora em UTC
  (21h24 UTC, ou 18h24 em Brasília).

## Nenhuma tela usa dado fixo

As telas buscam tudo na API. A busca abaixo não devolve nada:

```
$ grep -rni "mock" apps/web-professor/src
$ echo $?
1
```

## Dados que ficaram no banco

O banco não foi lido nem alterado diretamente. Tudo foi feito pela tela:

- A conta de teste foi anonimizada no passo 14. Segundo a tela de Minha conta, o
  nome e o e-mail do professor e o nome e a matrícula dos alunos são trocados por
  valores anônimos, e a turma, as questões, a prova, a aplicação e as correções
  continuam guardadas. O teste conferiu só o efeito visível: a conta deixou de
  entrar. Como a conta não entra mais, não dá para ver pela tela os dados que
  ficaram.
- As tentativas de login dos passos 3 e 14 ficam na tabela de tentativas, que só
  guarda 1 dia.
- O pedido de redefinição de senha do passo 4 vence sozinho em 1 hora.
