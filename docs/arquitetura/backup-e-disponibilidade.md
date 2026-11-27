# Backup e disponibilidade do SGP (T20)

Este documento registra como o SGP publicado fica no ar e como os dados do banco
são guardados, comparando com os requisitos RNF03 (disponibilidade mensal de
99,5%) e RNF07 (backup diário com retenção de 30 dias). A hospedagem em si está
decidida no [ADR-004](../adr/ADR-004-hospedagem-vercel-e-aiven.md).

## Onde cada parte roda

| Parte | Onde | Endereço |
|---|---|---|
| Web do professor | Vercel (site estático) | https://sgp-provas.vercel.app |
| API NestJS | Vercel (função serverless) | https://sgp-provas-api.vercel.app |
| Banco MySQL 8.4 | Aiven (serviço `sgp-provas-db`) | só a API acessa, pela `DATABASE_URL` |

## Verificação de que a API está no ar

A API tem a rota aberta `GET /health`, que responde sem login:

```json
{ "status": "ok", "service": "sgp-api", "timestamp": "2026-11-27T16:50:55.337Z" }
```

Medição feita em 27/11/2026, com três chamadas seguidas:

| Chamada | Resposta | Tempo |
|---|---|---|
| 1ª (função "fria") | 200 | 3,2 s |
| 2ª | 200 | 0,24 s |
| 3ª | 200 | 0,27 s |

A primeira chamada depois de um tempo parada é lenta porque a Vercel precisa
subir a função de novo (*cold start*). As seguintes ficam abaixo de 300 ms.

O `/health` **não consulta o banco**: ele mostra que a função da API sobe, mas
não que o MySQL está respondendo. Para saber se o banco está no ar, abra uma
tela que lê dados (por exemplo, Turmas) ou confira o painel do Aiven.

### Monitor gratuito

Para saber quando a API cai sem depender de alguém abrir o sistema, o `/health`
fica cadastrado num monitor gratuito de disponibilidade, o
[UptimeRobot](https://uptimerobot.com), no plano gratuito, com checagem a cada 5
minutos e alerta por e-mail.

Configuração:

1. Criar a conta no UptimeRobot com o e-mail do grupo.
2. **Add New Monitor** → tipo **HTTP(s)**.
3. URL: `https://sgp-provas-api.vercel.app/health`; intervalo: 5 minutos.
4. Em **Alert Contacts**, marcar o e-mail de quem vai acompanhar.
5. Opcional: criar uma *Status Page* pública com esse monitor, para mostrar a
   disponibilidade medida na apresentação.

Além de avisar quando a API cai, a chamada a cada 5 minutos mantém a função da
Vercel "quente", o que reduz o *cold start* da primeira chamada.

## Backup do banco

O que a documentação do Aiven diz, conferida em 27/11/2026
([backups](https://aiven.io/docs/products/mysql/concepts/mysql-backups),
[planos](https://aiven.io/docs/platform/concepts/free-plan) e
[alta disponibilidade](https://aiven.io/docs/products/mysql/concepts/high-availability)):

- Todo serviço MySQL do Aiven tem **backup automático e criptografado a cada 24
  horas**, com o log binário gravado continuamente.
- A **retenção depende do plano**: 1 dia nos planos Developer e Hobbyist, 2 dias
  no Startup, 14 no Business e 30 no Premium.
- Nos planos Developer e Hobbyist o backup serve para o Aiven **reconstruir o
  servidor** se ele for perdido. **Restaurar** um backup ou criar uma cópia
  (*fork*) só é possível a partir do plano Startup.
- Hoje a página de planos **não lista MySQL no plano Free**; o gratuito aparece
  só para Kafka, OpenSearch, PostgreSQL e Valkey. O ADR-004 registra o
  `sgp-provas-db` no plano Free, então é preciso confirmar no painel em qual
  plano o serviço está (ver a lista de conferência abaixo).

### Backup próprio do grupo

Como o plano do serviço não permite restaurar um backup do Aiven, o grupo guarda
uma cópia própria antes de cada entrega e da apresentação, com o `mysqldump`
(vem junto com o MySQL instalado na máquina):

```bash
mysqldump --single-transaction --set-gtid-purged=OFF --ssl-mode=REQUIRED -h <host> -P <porta> -u avnadmin -p defaultdb > sgp-backup-AAAA-MM-DD.sql
```

Host, porta e usuário estão na aba **Overview** do serviço no Aiven. O arquivo
gerado tem os dados reais do sistema: **não vai para o Git** e fica guardado
fora do repositório.

Para restaurar num banco vazio:

```bash
mysql --ssl-mode=REQUIRED -h <host> -P <porta> -u avnadmin -p defaultdb < sgp-backup-AAAA-MM-DD.sql
```

## Comparação com os requisitos

| Requisito | Situação | Por quê |
|---|---|---|
| RNF03: 99,5% de disponibilidade mensal | **Medido, não garantido** | Nenhum plano gratuito tem SLA. O monitor mede a disponibilidade real; não há como garantir 99,5% sem plano pago. |
| RNF07: backup diário com 30 dias de retenção | **Parcial** | Existe backup diário automático, mas a retenção é de 1 dia nos planos menores e só o Premium chega a 30 dias. O `mysqldump` manual cobre as datas importantes, não todos os dias. |

Para cumprir os dois em produção de verdade, o caminho seria o banco num plano
pago com retenção de 30 dias (Premium no Aiven, ou outro provedor) e a API num
plano da Vercel com SLA.

## Lista de conferência no painel do Aiven

Antes da entrega e da apresentação:

- [ ] O serviço `sgp-provas-db` está **Running**.
- [ ] Em qual **plano** o serviço está (Overview → Service plan). Se for diferente
      do que diz o ADR-004, atualizar este documento e o ADR.
- [ ] Aba **Backups**: data do último backup automático.
- [ ] `mysqldump` feito e guardado fora do repositório.
- [ ] Monitor do UptimeRobot ativo e sem queda nas últimas 24 horas.
