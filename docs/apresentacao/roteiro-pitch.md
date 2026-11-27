# Roteiro da apresentação (T15)

Pitch de **cerca de 15 minutos**, com demonstração ao vivo no sistema publicado:
https://sgp-provas.vercel.app.

| Bloco | Tempo | Quem |
|---|---|---|
| 1. Problema e solução | 1 min | Marceu |
| 2. Conta do professor e LGPD | 2 min | Amanda |
| 3. Alunos e questões | 2 min | Hellen |
| 4. Prova, versões, PDF e gabarito | 3 min | Iago |
| 5. Correção pelo celular | 3 min | Thiago |
| 6. Notas e relatórios | 2 min | Marceu |
| 7. Arquitetura e qualidade | 2 min | Thiago e Iago |
| 8. Perguntas | o que sobrar | todos |

## Antes da apresentação

- [ ] **Acordar o banco:** abrir o site na véspera e de novo 10 minutos antes.
- [ ] **Conta de demonstração:** `ana.costa` logada no notebook e no celular.
  **Ninguém anonimiza essa conta.**
- [ ] **Turma demo** com 2 alunos.
- [ ] **Aplicação identificada e embaralhada** para a correção ao vivo.
- [ ] **Material impresso:** o caderno impresso uma vez e os 2 cartões em escala
  100%. O cartão 2 vai com uma questão em branco e uma com duas marcações.
- [ ] **Aplicação já corrigida** com cerca de 8 alunos, para os relatórios.
- [ ] **CSV com 3 alunos** para a importação.
- [ ] **Celular espelhado** no projetor.
- [ ] **Plano B:** os prints de
  [`docs/testes/n3-ponta-a-ponta.md`](../testes/n3-ponta-a-ponta.md) abertos.
- [ ] **Luz** boa e sem reflexo no lugar da leitura dos cartões.

## Roteiro

### 1. Problema e solução (1 min, Marceu)

- **O problema do cliente:** a correção é feita à mão, e o PDF das provas sai com
  questão cortada entre páginas.
- **A solução:** o SGP gera as provas e corrige pelo celular.

### 2. Conta do professor e LGPD (2 min, Amanda)

- Cadastro de um professor novo e login.
- Senha errada e o bloqueio depois de 5 tentativas.
- "Esqueci minha senha".
- Anonimizar **essa conta nova** (LGPD).

### 3. Alunos e questões (2 min, Hellen)

- Importar alunos por CSV, com a prévia.
- Questões com tags e uma de 3 alternativas.
- Um formulário inválido, mostrando as validações.

### 4. Prova, versões, PDF e gabarito (3 min, Iago)

- Montar a prova.
- Aplicação identificada e embaralhada, e as versões.
- PDF: o caderno sem corte e o cartão com QR Code.
- Gabarito por versão.

### 5. Correção pelo celular (3 min, Thiago)

- **Cartão 1:** lido, com a nota.
- **Cartão 2:** a revisão abre com as questões em amarelo. Corrigir na tela e
  confirmar.
- **Concluída:** a aplicação fica "Concluída".
- **Aviso:** ler o cartão 1 de novo mostra que o aluno já foi corrigido.

### 6. Notas e relatórios (2 min, Marceu)

- Notas, média, mediana, desvio padrão e acerto por questão.
- Exportar CSV, Excel e PDF.
- Relatório consolidado.

### 7. Arquitetura e qualidade (2 min, Thiago e Iago)

- **Camadas da API:** controller, service, repository e Prisma.
- **Isolamento:** cada professor só vê os próprios dados
  ([`isolamento.e2e-spec.ts`](../../apps/api/test/isolamento.e2e-spec.ts)).
- **Hospedagem:** Vercel e Aiven, com HTTPS
  ([ADR-004](../adr/ADR-004-hospedagem-vercel-e-aiven.md)).
- **Documentação:** os [ADRs](../adr/README.md) e o
  [manual do usuário](../manual-usuario.md).
- **Testes:** os da seção 15 do README.
- **O repositório,** com os PRs e as Issues.

### 8. Perguntas

Respostas prontas:

| Pergunta | Resposta |
|---|---|
| Funciona sem internet? | A correção confirmada sem internet fica guardada e é enviada depois, sem duplicar. As telas precisam de internet para abrir ([ADR-008](../adr/ADR-008-correcao-offline-com-fila.md)). |
| Por que web e não app? | Um sistema, um link e uma stack; o celular usa a mesma web ([ADR-001](../adr/ADR-001-web-responsiva-no-lugar-de-app-nativo.md)). |
| E se a câmera não ler? | "Tentar de novo" ou "Marcar à mão". O professor sempre confere antes de confirmar. |
| Como recupera a senha sem e-mail? | O link de redefinição sai no log da API, e quem administra repassa ao professor. |
| E o backup? | Diário, no Aiven ([`backup-e-disponibilidade.md`](../arquitetura/backup-e-disponibilidade.md)). |
