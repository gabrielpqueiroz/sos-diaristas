---
paths:
  - "src/**/*.{js,jsx,ts,tsx,css}"
  - "public/**"
---

# Regras — Landing Page (Next.js)

## Design System
- Cores: `brand.blue #1B5FA8`, `brand.navy #1A3A6B`, `brand.light #E8F1FB`
- Fonte: Inter (Google Fonts) — nunca trocar sem aprovação
- Sempre Tailwind — nunca CSS inline, nunca `<style>` avulso
- Responsividade mobile-first: testar em 375px antes de 1280px
- Imagens via `next/image` com `width`, `height` e `alt` sempre preenchidos

## Formulário e Rastreamento
- O submit deve sempre executar nesta ordem:
  1. `fbq('track', 'Lead')` — Meta Pixel client-side
  2. `gtag('event', 'conversion')` — Google Ads
  3. `POST /api/lead` — Meta CAPI server-side (não bloquear redirect se falhar)
  4. Redirecionar para WhatsApp (`wa.me/5545998183986`)
- Nunca expor `META_CAPI_ACCESS_TOKEN` no client — existe apenas em variáveis sem prefixo `NEXT_PUBLIC_`
- Dados enviados à Meta devem ser hasheados SHA-256 (feito no server em `/api/lead`)
- O redirect para WhatsApp deve abrir em nova aba (`target="_blank"`)

## Next.js
- App Router (`src/app/`) — nunca misturar com Pages Router
- `'use client'` apenas quando necessário (hooks, eventos) — preferir Server Components
- API Routes em `src/app/api/` com `export async function POST/GET`
- Metadados SEO definidos via `export const metadata` no `layout.js`
- Google Ads e Meta Pixel ficam no `layout.js` via `dangerouslySetInnerHTML` — nunca duplicar em outros arquivos

## Performance
- Fontes do Google via `@import` no CSS — não via tag `<link>` no HTML
- Não adicionar dependências externas desnecessárias — a landing deve ser leve
- Imagens otimizadas: logo em PNG com fundo transparente, ícones em SVG quando possível
