---
paths:
  - "src/lib/db.js"
  - "src/app/api/**"
---

# Regras — Banco de Dados (PostgreSQL via pg)

## Conexão
- Pool em `src/lib/db.js` usando `pg.Pool` com `DATABASE_URL`
- Função `query(text, params)` para todas as queries

## Schema atual

```sql
crm_contacts (
  id UUID PK, session_id TEXT, name TEXT, phone TEXT, email TEXT,
  address TEXT, neighborhood TEXT, city TEXT,
  status TEXT, is_recurring BOOLEAN, total_orders INT, total_revenue NUMERIC,
  last_contact_at TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP
)

crm_orders (
  id UUID PK, contact_id UUID FK, session_id TEXT,
  service_type TEXT, status TEXT,
  scheduled_date DATE, scheduled_time TIME,
  address TEXT, diarista_id UUID FK, value NUMERIC,
  payment_status TEXT, notes TEXT,
  created_at TIMESTAMP, updated_at TIMESTAMP
)

crm_diaristas (
  id UUID PK, name TEXT, phone TEXT, specialties TEXT,
  status TEXT, notes TEXT,
  created_at TIMESTAMP, updated_at TIMESTAMP
)

n8n_chat_histories (
  id SERIAL PK, session_id TEXT,
  message JSONB, type TEXT,
  created_at TIMESTAMP
)
```

## Convenções
- Queries parametrizadas ($1, $2...) — nunca interpolação de string
- COALESCE para valores opcionais
- Cast `::text` em DATE/TIME quando comparar com strings
- Sem ORM, sem migrations — alterações diretas no banco
