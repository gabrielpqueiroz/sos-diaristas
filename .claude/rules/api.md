---
paths:
  - "api/**/*.py"
---

# Regras — Backend FastAPI (Python)

## Estrutura e Organização
- `app/routers/` — apenas definição de rotas e validação de entrada (Pydantic schemas)
- `app/services/` — toda a lógica de negócio; routers chamam services, nunca o contrário
- `app/models/` — SQLAlchemy models (mapeamento ORM)
- `app/schemas/` — Pydantic schemas separados por entidade: `{entidade}_request.py`, `{entidade}_response.py`
- Nunca colocar lógica de negócio diretamente em routers — router deve ter no máximo 10 linhas
- `app/config.py` com `BaseSettings` do Pydantic — todas as variáveis de ambiente tipadas aqui

## Async e Performance
- Todas as funções de I/O (banco, API externa) devem ser `async def`
- SQLAlchemy 2.0 async: usar `AsyncSession`, `async with session.begin()`, `await session.execute()`
- Nunca usar `.one()` — preferir `.scalar_one_or_none()` para evitar exceções inesperadas
- Dependency Injection do FastAPI para sessão do banco: `Depends(get_db)` nas rotas

## Pydantic e Validação
- Todos os endpoints com input do usuário devem ter Pydantic schema de request
- Schemas de response nunca retornam campos sensíveis (token, senha, chave)
- Usar `model_config = ConfigDict(from_attributes=True)` nos schemas que mapeiam models ORM
- Validações de domínio (ex: período máximo 90 dias) no schema com `@field_validator`

## Banco de Dados e Migrations
- Toda mudança no schema de banco requer migration Alembic: `alembic revision --autogenerate -m "desc"`
- Migrations devem ser revisadas antes de aplicar — autogenerate pode errar em tipos customizados
- UUIDs como PK: `default=uuid.uuid4` no model Python (não no banco)
- `campaign_metrics` tem constraint `UNIQUE(campaign_id, date)` — usar `INSERT ... ON CONFLICT DO UPDATE`
- Métricas históricas são imutáveis: sync upsert por (campaign_id, date), nunca deletar linha de métrica

## Tratamento de Erros
- HTTPException com status codes semânticos: 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 422 (validação), 500 (erro interno)
- Erros de integração com Meta API: capturar, logar e retornar 502 com mensagem descritiva
- Nunca expor stack trace para o client — logar internamente, retornar mensagem genérica

## Meta Ads Service (`app/services/meta_ads.py`)
- `access_token` sempre descriptografado em memória — nunca passar para log ou response
- Respeitar rate limits: máximo 200 calls/hora por token — implementar sleep/retry com backoff exponencial
- Timeout de 30s em todas as chamadas à API do Meta
- Campos obrigatórios nas chamadas de insights: `impressions,reach,clicks,spend,cpm,cpc,ctr,actions,cost_per_action`
- Breakdown obrigatório: `time_increment=1` (por dia)
