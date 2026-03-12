---
paths:
  - "src/**"
  - ".env*"
---

# Regras — Segurança

## Segredos e Variáveis de Ambiente
- Nunca hardcodar tokens, senhas ou chaves no código — sempre via variáveis de ambiente
- Variáveis sem prefixo `NEXT_PUBLIC_` existem apenas no servidor — jamais em código client
- `.env` e `.env.local` nunca vão para o Git — verificar `.gitignore`
- `META_CAPI_ACCESS_TOKEN`, `DATABASE_URL`: apenas server-side

## Banco de Dados
- Sempre queries parametrizadas ($1, $2...) — nunca concatenar strings em SQL
- Validar inputs antes de queries — nunca confiar em dado cru do request

## Autenticação (atual)
- Auth atual é simples via localStorage (`sos-auth`) — apenas pra v1
- Futuro: implementar JWT ou similar

## Headers de Segurança
- Dashboard não deve ser indexável: considerar `X-Robots-Tag: noindex`

## Webhooks
- Endpoints `/api/webhook/` são públicos (chamados pelo n8n)
- Validar campos obrigatórios no início de cada handler
- Retornar errors descritivos com `detail` para facilitar debug do n8n
