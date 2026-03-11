---
name: deploy
description: Faz commit, push e verifica o deploy na Vercel. Use quando o usuário pedir para subir alterações.
user-invocable: true
allowed-tools: "Bash, Read, Glob"
---

# Deploy para Vercel

Execute os passos abaixo em ordem:

1. Verifique o status do git e mostre ao usuário o que será commitado
2. Faça `git add .` apenas nos arquivos relevantes (nunca incluir `.env.local`)
3. Peça uma mensagem de commit ao usuário ou sugira uma baseada nas mudanças
4. Execute `git commit` e `git push`
5. Aguarde e mostre o link do deploy: `gh run list` ou `vercel --prod`

Nunca fazer push sem confirmar com o usuário antes.
