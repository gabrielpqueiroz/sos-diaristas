---
paths:
  - "dashboard/**"
---

# Regras — Dashboard Admin (Next.js + TypeScript)

## Linguagem e Tipagem
- TypeScript strict — nunca usar `any`, preferir tipos explícitos ou `unknown`
- Tipos de domínio em `src/types/` — reutilizar entre componentes e chamadas de API
- Interfaces para props de componentes — sempre tipar, nunca inferir implicitamente

## Componentes e UI
- Componentes shadcn/ui para tudo que o shadcn já resolve: botões, tabelas, modais, badges, inputs, dropdowns
- Nunca criar componente do zero se o shadcn tem equivalente
- Componentes de negócio em `src/components/` — nomes em PascalCase descritivos (`KpiCard`, `CampaignTable`)
- Gráficos exclusivamente via Recharts — sem Chart.js, sem outros
- Estados de loading: sempre usar Skeleton (shadcn) enquanto dados carregam — nunca tela em branco
- Estados de erro: sempre exibir mensagem clara com opção de retry
- Estados vazios: sempre exibir mensagem descritiva — nunca lista vazia sem explicação

## Design System (herdar da landing)
- Mesmas cores: `brand.blue #1B5FA8`, `brand.navy #1A3A6B`, `brand.light #E8F1FB`
- Sidebar: fundo `brand.navy`, texto branco, item ativo com `brand.blue`
- Background do dashboard: `#F8FAFC` (cinza muito claro)
- Indicadores positivos: `#16A34A` (verde) — CPL caindo, leads subindo
- Indicadores negativos: `#DC2626` (vermelho) — gasto alto, CTR baixo
- Fonte: Inter — mesma da landing

## Arquitetura de Estado e Dados
- Todas as chamadas de API via `src/lib/api.ts` — nunca `fetch()` direto em componente
- `api.ts` deve incluir o header `Authorization: Bearer {token}` automaticamente
- Estado de auth via Context API ou Zustand — nunca localStorage direto nos componentes
- React Query (TanStack Query) para cache e refetch de dados do servidor
- Formulários via React Hook Form + Zod para validação

## Roteamento e Proteção
- Rotas autenticadas agrupadas em `(dashboard)/` com layout que verifica JWT
- Redirect para `/login` se token inválido ou expirado — middleware Next.js
- Rota `/login` é a única pública — todo o resto exige auth

## Nomenclatura de Arquivos
- Páginas: `page.tsx` dentro da pasta da rota
- Layouts: `layout.tsx`
- Componentes reutilizáveis: `kebab-case.tsx` ou `PascalCase.tsx`
- Hooks customizados: `use-nome.ts` em `src/hooks/`
