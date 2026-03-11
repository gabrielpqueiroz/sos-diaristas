---
paths:
  - "api/**"
  - "dashboard/**"
  - "src/**"
  - "docker-compose*.yml"
  - ".env*"
---

# Regras — Segurança (Cross-cutting)

## Segredos e Variáveis de Ambiente
- Nunca hardcodar tokens, senhas ou chaves no código — sempre via variáveis de ambiente
- Variáveis sem prefixo `NEXT_PUBLIC_` existem apenas no servidor — jamais em código client
- `.env` e `.env.local` nunca vão para o Git — verificar `.gitignore` antes de qualquer commit
- `META_CAPI_ACCESS_TOKEN`, `SECRET_KEY`, `META_ENCRYPTION_KEY`, senhas de banco: apenas server-side

## Autenticação e JWT
- Tokens JWT com expiração máxima de 24h para access token
- Refresh token com expiração de 7 dias, armazenado em cookie HttpOnly (não localStorage)
- Verificar `exp` e `iat` em toda request autenticada
- Invalidar token no logout (blocklist em Redis ou versionamento por usuário)
- Bcrypt com custo mínimo 12 para hash de senhas

## CORS
- Em produção: `allow_origins` deve listar explicitamente os domínios permitidos — nunca `"*"` em prod
- Em dev (`docker-compose.override.yml`): pode usar `"*"` apenas localmente
- `allow_credentials=True` exige origins explícitas — não funciona com wildcard

## Proteção contra Injeções
- SQLAlchemy ORM + parâmetros nomeados: nunca concatenar strings em queries SQL
- Pydantic valida todos os inputs antes de chegar ao service — nunca confiar em dado cru do request
- IDs de recurso (campaign_id, account_id) devem ser UUIDs — nunca aceitar strings arbitrárias como ID

## Access Token da Meta Ads
- Criptografar com `cryptography.fernet.Fernet` antes de salvar no banco
- `META_ENCRYPTION_KEY` nunca deve ser rotacionada sem migrar os tokens existentes
- Logar apenas os primeiros 8 caracteres do token para debug: `token[:8] + "..."`
- Nunca incluir o token em URLs, query strings ou headers de log

## Headers de Segurança (Next.js)
- Configurar em `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- Dashboard não deve ser indexável: `X-Robots-Tag: noindex` via header

## Docker e Produção
- Containers não rodam como root — usar `USER appuser` no Dockerfile
- Portas internas (banco, API interna) não devem ser expostas publicamente em prod — apenas via rede Docker interna
- PostgreSQL porta 5432 exposta apenas para desenvolvimento (`docker-compose.override.yml`)
