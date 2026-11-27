# Casos de borda dos formulários (T22)

| | |
|---|---|
| **Data** | 27/11/2026 |
| **Web** | `apps/web-professor` desta branch em `npm run dev`, no Chrome 158 controlado pelo Playwright 1.56.1 |
| **API** | simulada no próprio navegador (`page.route`): cada caso devolve a resposta que a API real dá (por exemplo, o 409 de matrícula repetida). Nenhum banco foi usado |
| **API real** | as validações dos DTOs e o filtro de erro interno têm testes unitários próprios (ver [na API](#na-api)) |

## Resultado

**37 de 37 casos passam na web**, depois das correções deste PR. Antes delas, 3
casos falhavam e 5 passavam com uma resposta pior que a esperada. Estes casos
foram repetidos com o código da `main`, e a coluna "Corrigido" marca o que mudou:

- **Questões:** o duplo clique criava a questão duas vezes. A pontuação zero na
  discursiva não mostrava mensagem nenhuma. A disciplina vazia mostrava o erro
  de outro campo. A mensagem da API não aparecia (a tela mostrava sempre "Não
  foi possível salvar a questão.").
- **Turmas e alunos:** um campo só com espaços era recusado sem mensagem.
- **Tamanho máximo:** nenhum campo de texto tinha. Um texto maior que o banco
  aceita dava erro 500 na API, com a mensagem "Internal server error", em inglês.

**Como ler a tabela:** "Esperado" é o que a tela deve fazer. "Obtido" é o que
apareceu na tela, copiado do teste.

| Tela | Caso testado | Esperado | Obtido | Corrigido neste PR |
|---|---|---|---|---|
| Login | Campos vazios | Mensagem sem chamar a API | "Informe o e-mail e a senha." | |
| Login | Tamanho máximo do e-mail | Campo limitado ao tamanho da API | `maxlength=191` (e senha 72) | ✅ |
| Login | 6ª tentativa errada (429 da API) | Mensagem da API | "Muitas tentativas de login. Tente de novo em 15 minutos." | |
| Login | Erro inesperado da API (500) | Mensagem em português, sem detalhe técnico | "O servidor teve um problema. Tente de novo em instantes." | ✅ (filtro novo na API) |
| Login | Duplo clique em Entrar | Um envio só | 1 envio | |
| Cadastro | Nome com 1 letra | Mensagem | "Informe o seu nome." | |
| Cadastro | Senhas diferentes | Mensagem | "As senhas não conferem." | |
| Cadastro | E-mail já cadastrado (409 da API) | Mensagem da API | "Já existe um professor cadastrado com este e-mail." | |
| Cadastro | Tamanhos máximos | Campos limitados | nome 120, e-mail 191, senha 72 | ✅ |
| Esqueci a senha | E-mail vazio | Mensagem | "Informe o e-mail da sua conta." | |
| Esqueci a senha | Duplo clique | Um envio só | 1 envio | |
| Redefinir senha | Senha com 3 caracteres | Mensagem | "A senha precisa ter pelo menos 6 caracteres." | |
| Redefinir senha | Link vencido (400 da API) | Mensagem da API | "Este link de redefinição é inválido ou expirou. Peça um novo." | |
| Turmas | Campos só com espaços | Mensagem | "Preencha o nome, a disciplina e o ano da turma." (antes: nada acontecia) | ✅ |
| Turmas | Tamanhos máximos | Campos limitados | nome 120, disciplina 80, ano 30 (antes: sem limite) | ✅ |
| Turmas | Duplo clique em Salvar | Um envio só | 1 envio | |
| Alunos | Matrícula repetida (409 da API) | Mensagem da API | "Já existe um aluno com esta matrícula nesta turma." | |
| Alunos | Matrícula com 40 caracteres | Campo limitado a 30 | o campo aceitou 30 (antes: 40) | ✅ |
| Alunos | Nome ou matrícula só com espaços | Mensagem | "Preencha o nome e a matrícula do aluno." (antes: nada acontecia) | ✅ |
| Importar alunos | CSV com linha sem matrícula, sem nome, matrícula repetida na planilha e já cadastrada | Prévia marca cada linha com o motivo e não importa as linhas com erro | "0 alunos prontos para importar · 5 linhas com erro vão ficar de fora." Motivos: "Matrícula repetida na planilha.", "Sem matrícula.", "Sem nome.", "Matrícula já cadastrada nesta turma." | |
| Questões | Objetiva sem alternativa certa | Mensagem | "Marque exatamente uma alternativa como correta." | |
| Questões | Alternativa vazia | Mensagem | "Preencha o texto de todas as alternativas." | |
| Questões | Disciplina vazia | Mensagem da disciplina | "Informe a disciplina da questão." (antes: a mensagem das alternativas) | ✅ |
| Questões | Discursiva com pontuação 0 | Mensagem | "A pontuação máxima deve ser maior que zero." (antes: nenhuma mensagem) | ✅ |
| Questões | Erro de validação da API (400) | Mensagem da API | "O enunciado pode ter no máximo 10000 caracteres." (antes: "Não foi possível salvar a questão.") | ✅ |
| Questões | Duplo clique em Salvar | Um envio só | 1 envio (antes: **2 envios, a questão era criada duas vezes**) | ✅ |
| Questões | Tamanhos máximos | Campos limitados | enunciado 10000, disciplina 80, alternativa 2000 | ✅ |
| Provas | Sem questão | Mensagem | "Selecione ao menos uma questão." | |
| Provas | 21ª questão | Recusa e mensagem | "Uma prova pode ter no máximo 20 questões." (o contador fica em 20 de 20) | |
| Provas | Pontuação zero | Mensagem | "Informe uma pontuação maior que zero em todas as questões selecionadas." | |
| Provas | Duplo clique em Salvar | Um envio só | 1 envio | |
| Aplicações | Sem prova e sem turma | Mensagem | "Escolha a prova e pelo menos uma turma." | |
| Aplicações | Duplo clique em Configurar PDF | Um envio só | 1 envio | |
| Revisão da correção | Nota ajustada para 11 numa prova de 10 | Mensagem | "Digite uma nota entre 0 e 10,0." | |
| Revisão da correção | Duplo clique em Confirmar | Um envio só | 1 envio | |
| Notas | Nota manual -1 | Mensagem | "Digite uma nota entre 0 e 10,0." | |
| Anonimizar conta | Sem marcar "Entendi" | Mensagem | "Marque que você entendeu que a anonimização não pode ser desfeita." | |
| Anonimizar conta | Senha errada (403 da API) | Mensagem da API | "Senha incorreta." | |

## Na API

A API recusa os mesmos casos com 400 e mensagem em português, para quem chama
sem passar pela tela.

- **`src/common/validacoes-dto.spec.ts` (novo, 22 casos):** cobre e-mail e senha
  grandes demais, nome curto, turno inválido, matrícula com 31 caracteres,
  enunciado com 10001 caracteres, pontuação negativa, alternativa vazia, título
  da prova com 151 caracteres, pontuação zero, aplicação sem turma ou com 201
  versões e nota negativa ou em texto. Cada caso confere a mensagem e que
  nenhuma saiu em inglês.
- **Mensagens em português nos DTOs:** antes, os limites (`MaxLength`) e os tipos
  (`IsString`, `IsNumber`) sem mensagem própria respondiam com a mensagem padrão
  da biblioteca, em inglês (por exemplo, "nome must be shorter than or equal to
  120 characters").
- **Limites novos, iguais aos do banco:**
  - **E-mail com até 191 caracteres:** o e-mail é `varchar(191)` no banco. Antes,
    um e-mail maior passava do DTO e dava erro 500.
  - **Textos longos:** enunciado e resposta esperada com até 10000 caracteres, e
    alternativa com até 2000. São colunas `TEXT`, que estouram perto de 16 mil
    caracteres acentuados.
  - **Senha com até 72 caracteres** também no login e na anonimização, como no
    cadastro.
- **Erro não tratado (`src/common/erro-interno.filter.ts`, novo, com teste):**
  - responde "O servidor teve um problema. Tente de novo em instantes." (500), em
    vez de "Internal server error";
  - com o banco fora do ar (códigos P1xxx, P2024 e P2028 do Prisma), responde
    "O banco de dados não respondeu. Tente de novo em instantes." (503);
  - a stack vai só para o log da API, nunca para a resposta.
- **Regras que já existiam e continuam iguais:**
  - de 2 a 5 alternativas com exatamente uma certa;
  - prova com de 1 a 20 questões, sem repetir;
  - matrícula única na turma (409);
  - nota entre 0 e o total da prova;
  - limite de tentativas de login (429).

**Na web,** um erro 5xx sem corpo JSON (por exemplo, o 504 da Vercel quando a
função passa do tempo) também ganhou mensagem em português: "O servidor não
respondeu direito. Tente de novo em instantes.".
