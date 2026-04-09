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
  id UUID PK, session_id VARCHAR, phone VARCHAR, name VARCHAR,
  address TEXT, neighborhood VARCHAR, city VARCHAR, ddd VARCHAR,
  status VARCHAR, is_recurring BOOLEAN,
  first_contact_at TIMESTAMPTZ, last_contact_at TIMESTAMPTZ,
  total_orders INT, total_revenue NUMERIC,
  tags ARRAY, notes TEXT,
  follow_up_date DATE, follow_up_note TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)

crm_orders (
  id UUID PK, contact_id UUID FK, session_id VARCHAR,
  service_type VARCHAR, status VARCHAR,
  scheduled_date DATE, scheduled_time TIME,
  address TEXT, diarista_id UUID FK, value NUMERIC,
  payment_status VARCHAR, notes TEXT,
  lat NUMERIC, lng NUMERIC, geocoded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)

crm_diaristas (
  id UUID PK, name VARCHAR, phone VARCHAR,
  status VARCHAR, specialties ARRAY, notes TEXT,
  created_at TIMESTAMPTZ
)

crm_followups (
  id UUID PK, contact_id UUID FK, type VARCHAR, status VARCHAR,
  message_template TEXT, scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ, response_at TIMESTAMPTZ, notes TEXT,
  created_at TIMESTAMPTZ
)

crm_daily_reports (
  id UUID PK, report_date DATE,
  total_conversations INT, new_contacts INT, returning_contacts INT,
  total_messages INT, orders_created INT, orders_completed INT,
  revenue NUMERIC, avg_response_quality NUMERIC,
  ai_summary TEXT, ai_insights TEXT, details JSONB,
  created_at TIMESTAMPTZ
)

n8n_chat_histories (
  id SERIAL PK, session_id VARCHAR,
  message JSONB,
  created_at TIMESTAMPTZ
)
```

## Convenções
- Queries parametrizadas ($1, $2...) — nunca interpolação de string
- COALESCE para valores opcionais
- Cast `::text` em DATE/TIME quando comparar com strings
- Sem ORM, sem migrations — alterações diretas no banco
