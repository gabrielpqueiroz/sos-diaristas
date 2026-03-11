---
name: sync-meta
description: Sincroniza métricas do Meta Ads manualmente via API do backend. Use quando o usuário pedir para atualizar os dados das campanhas.
user-invocable: true
allowed-tools: "Bash, Read"
---

# Sync Meta Ads

Execute a sincronização manual das métricas:

1. Verifique se a API está rodando: `curl http://localhost:8000/health`
2. Liste as contas conectadas: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/accounts`
3. Para cada conta, dispare o sync: `POST /accounts/{id}/sync`
4. Mostre o resultado ao usuário (campanhas atualizadas, erros, etc.)

Se a API não estiver rodando, instrua o usuário a executar `docker compose up -d api`.
