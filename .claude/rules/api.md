---
paths:
  - "src/app/api/**"
---

# Regras — API Routes (Next.js App Router)

## Estrutura
- API routes em `src/app/api/` usando Next.js App Router (route.js)
- Banco via `import { query } from '@/lib/db'` (pool PostgreSQL com `pg`)
- Sem ORM — queries SQL diretas com parameterized queries ($1, $2...)

## Padrões
- Sempre retornar `NextResponse.json()`
- Erro: retornar `{ error: 'mensagem', detail: error.message }` com status code adequado
- Sempre `console.error` com `error.message` e `error.stack` no catch
- Validar campos obrigatórios no início da função
- Usar COALESCE para valores opcionais no SQL

## Webhooks (n8n)
- Endpoints em `/api/webhook/` são chamados pelo n8n
- Aceitar body como array ou objeto: `Array.isArray(raw) ? raw[0] : raw`
- Buscar/criar contato por session_id (telefone) quando necessário

## Banco de dados
- Tabelas: crm_contacts, crm_orders, crm_diaristas, n8n_chat_histories
- UUIDs como PK (gerados pelo PostgreSQL)
- Datas: tipo DATE, comparar com `::text` quando necessário
- Horários: tipo TIME, fazer cast `::text` para string_agg
- Valores monetários: tipo NUMERIC
