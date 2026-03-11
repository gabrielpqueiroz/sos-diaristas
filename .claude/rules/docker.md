---
paths:
  - "docker-compose*.yml"
  - "**/Dockerfile"
  - ".env.example"
---

# Regras — Docker e Ambiente

## docker-compose.yml (base — vai pro Git)
- Contém a estrutura dos serviços: `postgres`, `api`, `dashboard`
- Sem valores sensíveis — todas as credenciais via `${VARIAVEL}` que vêm do `.env`
- Health checks obrigatórios no postgres: `pg_isready -U ${POSTGRES_USER}`
- `depends_on` com `condition: service_healthy` — api só sobe quando banco estiver pronto
- Rede interna nomeada (`app_network`) — serviços se comunicam por nome de serviço, não por `localhost`

## docker-compose.override.yml (dev — vai pro Git, sobrepõe o base)
- Monta volumes para hot reload: `./api:/app` e `./dashboard:/app`
- Expõe porta 5432 do postgres para ferramentas locais (DBeaver, TablePlus)
- Variáveis de dev podem ser menos restritivas (CORS `*`, debug=True)

## Dockerfiles
- Multi-stage build para produção: stage `builder` instala deps, stage `runtime` copia apenas o necessário
- `api/Dockerfile`: base `python:3.12-slim`, instala deps do `requirements.txt`, roda com `uvicorn`
- `dashboard/Dockerfile`: base `node:20-alpine`, build Next.js, output standalone
- Nunca incluir `.env`, `node_modules/`, `__pycache__/`, `.next/` na imagem — usar `.dockerignore`
- Usuário não-root: `RUN adduser --disabled-password appuser && USER appuser`

## .env e Variáveis
- `.env.example` no Git com todas as variáveis e comentários explicativos, sem valores reais
- `.env` e `.env.local` nunca no Git (já no `.gitignore`)
- Para novo desenvolvedor: `cp .env.example .env` e preencher os valores
- Variáveis obrigatórias para o sistema funcionar (sem defaults):
  - `POSTGRES_PASSWORD`, `SECRET_KEY`, `META_ENCRYPTION_KEY`
- Variáveis com default no código: `SYNC_INTERVAL_HOURS=6`, `LLM_PROVIDER=openai`

## Comandos do Dia a Dia
```bash
docker compose up -d              # sobe tudo em background
docker compose up -d postgres api # sobe só banco e API
docker compose logs -f api        # logs da API em tempo real
docker compose exec api bash      # terminal dentro do container da API
docker compose down               # para e remove containers (dados preservados no volume)
docker compose down -v            # CUIDADO: apaga volumes (perde dados do banco)
```

## Migrations em Container
```bash
# Sempre rodar migrations dentro do container:
docker compose exec api alembic upgrade head
docker compose exec api alembic revision --autogenerate -m "descricao"
```
