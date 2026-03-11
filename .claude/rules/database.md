---
paths:
  - "api/app/models/**"
  - "api/alembic/**"
  - "api/app/database.py"
---

# Regras — Banco de Dados (PostgreSQL + SQLAlchemy + Alembic)

## SQLAlchemy Models
- Todos os models herdam de `Base` declarativo definido em `app/database.py`
- PKs sempre UUID: `Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)`
- Timestamps: `created_at` com `server_default=func.now()`, `updated_at` com `onupdate=func.now()`
- Relacionamentos com `lazy="selectin"` — evitar N+1 queries implícitas
- `__tablename__` sempre em snake_case no plural: `users`, `ad_accounts`, `campaign_metrics`

## Alembic — Workflow obrigatório
```
# Sempre nesta ordem:
1. Alterar o model SQLAlchemy
2. alembic revision --autogenerate -m "descricao_curta"
3. Revisar o arquivo gerado em alembic/versions/ — corrigir se necessário
4. alembic upgrade head
```
- Nunca alterar banco diretamente via SQL em produção — apenas via migration
- Migrations devem ser reversíveis: sempre implementar `downgrade()` funcional
- Nomear migrations descritivamente: `add_frequency_to_campaign_metrics`, não `auto_001`

## Queries Assíncronas
- Sempre usar `AsyncSession` — nunca `Session` síncrono
- Pattern padrão de query:
  ```python
  result = await session.execute(select(Model).where(Model.id == id))
  obj = result.scalar_one_or_none()
  ```
- Bulk insert com `session.add_all()` + `await session.commit()`
- Upsert de métricas: `insert(...).on_conflict_do_update(index_elements=['campaign_id', 'date'], set_=...)`

## Índices e Performance
- Índice obrigatório em `campaign_metrics(campaign_id, date)` — é a query mais frequente
- Índice em `campaigns(ad_account_id)` — listagem de campanhas por conta
- Para queries de período: `campaign_metrics.date BETWEEN :start AND :end` — nunca filtrar em Python após buscar tudo
- Evitar `SELECT *` — especificar colunas nas queries críticas

## Convenções de Schema
- `campaign_metrics`: constraint `UNIQUE(campaign_id, date)` — uma linha por campanha por dia
- `ad_accounts.access_token`: tipo `TEXT` — tokens da Meta podem ser longos (~200 chars)
- Valores monetários: `NUMERIC(12,2)` — nunca `FLOAT` (problema de precisão com dinheiro)
- Taxas e percentuais: `NUMERIC(8,4)` — ex: CTR `0.0234` = 2,34%
- Status de campanha: `VARCHAR` com valores `ACTIVE | PAUSED | ARCHIVED | DELETED`
