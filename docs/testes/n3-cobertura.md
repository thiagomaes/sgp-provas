# Cobertura dos testes da API (T24)

| | |
|---|---|
| **Data** | 27/11/2026 |
| **Comando** | `cd apps/api && npm run test:cov` (Vitest 4 com cobertura v8) |
| **Testes** | 178 testes unitários, todos passando |

## Total

| Medida | Cobertura |
|---|---|
| Linhas | **83,85%** (566 de 675) |
| Comandos | 84,25% (637 de 756) |
| Desvios (`if`, `?:`, `??`) | 83,25% (338 de 406) |
| Funções | 74,07% (180 de 243) |

> **A conta só inclui os arquivos carregados pelos testes unitários: 43 dos 74
> arquivos da API.** Um arquivo que nenhum teste unitário importa (por exemplo,
> `auth.service.ts` ou os controllers) não entra nem no numerador nem no
> denominador. Os testes e2e (`npm run test:e2e`, 56 testes) exercitam os
> controllers, os DTOs, os services e o isolamento entre professores, mas não
> entram nesta conta.

Na N3 (#107) o total era 84,71% das linhas, sobre 29 arquivos. Ele caiu um pouco
porque os testes novos carregam mais arquivos: o `corrections.service.ts`
entrou com 100%, mas trouxe junto repositories e DTOs que só os e2e exercitam.

## Arquivos críticos

São as regras que decidem a nota, as versões e o que o professor vê.
**Todos estão acima de 80%** em linhas, desvios e funções.

| Arquivo | O que faz | Linhas | Desvios | Funções |
|---|---|---|---|---|
| `corrections/calculo-nota.ts` | Nota da prova lida, com o gabarito do banco | 100% | 100% | 100% |
| `corrections/corrections.service.ts` | Criar, reenviar, editar e excluir correções | 100% | 97,05% | 100% |
| `applications/versoes.ts` | Embaralhamento das versões e payload do QR Code | 100% | 100% | 100% |
| `applications/gabarito.ts` | Gabarito de cada versão | 100% | 80% | 100% |
| `applications/gabarito-versao.ts` | Letra correta impressa de cada versão | 100% | 100% | 100% |
| `applications/pdf/desenhar-cartao.ts` | Marcas, QR Code e bolinhas do cartão | 100% | 100% | 100% |
| `reports/estatisticas.ts` | Média, mediana, desvio padrão e acerto por questão | 100% | 100% | 100% |
| `questions/validacao-questao.ts` | De 2 a 5 alternativas, uma certa | 100% | 95% | 100% |
| `exams/regras-prova.ts` | De 1 a 20 questões, sem repetir | 100% | 90% | 100% |
| `auth/limite-login.ts` | Bloqueio depois de 5 falhas por e-mail e 20 por IP | 100% | 100% | 100% |
| `classes/importacao-alunos.ts` | Conferência da planilha de alunos | 100% | 100% | 100% |

**O que foi completado neste PR:**

- **`corrections.service.ts`:** estava fora da conta, porque nenhum teste unitário
  o carregava. Ganhou `corrections.service.spec.ts`, com 19 testes:
  - nota pela câmera e "Ajustar nota";
  - versão, respostas e questão de fora da prova;
  - rascunho;
  - lançamento manual;
  - aluno de outra turma ou já corrigido;
  - reenvio pelo mesmo `clientCorrectionId`, inclusive dois envios ao mesmo tempo;
  - aplicação de outro professor;
  - edição, atribuição e exclusão.
- **Validações e log:** `validacoes-dto.spec.ts` (22 casos),
  `erro-interno.filter.spec.ts` e `log-de-acesso.spec.ts`, da T22 e da T23.

## Abaixo de 80%, e por quê

| Arquivo | Linhas | Motivo |
|---|---|---|
| `applications.repository.ts`, `corrections.repository.ts`, `exams.repository.ts` | 8% a 20% | Só montam consultas do Prisma; os testes unitários usam repositórios falsos. Nos e2e também são trocados por falsos, e o banco real fica para o teste de ponta a ponta |
| `applications.service.ts`, `exams.service.ts` | 55% a 66% | As partes que faltam (criar em várias turmas, gerar versões identificadas, editar prova com PDF gerado) passam pelos e2e e pelo teste de ponta a ponta |
| `pdf/dados-do-pdf.ts`, `pdf/texto-pdf.ts` | 0% e 74% | Conversão dos dados do banco para o PDF e corte de texto longo; o PDF inteiro é conferido página por página no teste de ponta a ponta |
| `common/prisma.service.ts` | 60% | Conexão com o banco |
| `classes/dto/aluno.dto.ts`, `corrections/dto/correcao.dto.ts` | 0% e 67% | Classes só com decorators. O v8 conta as linhas de forma estranha nesses arquivos, mas as validações deles são testadas em `validacoes-dto.spec.ts` |
