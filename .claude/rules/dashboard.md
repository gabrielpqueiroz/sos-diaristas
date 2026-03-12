---
paths:
  - "src/app/dashboard/**"
---

# Regras — Dashboard Admin (Next.js + JavaScript)

## Linguagem
- JavaScript (sem TypeScript)
- Sem shadcn/ui — componentes customizados com Tailwind inline
- Sem React Query — fetch direto nos componentes com useEffect/useCallback

## Componentes e UI
- Estilos compartilhados em `src/app/dashboard/_components/styles.js` (GLASS, BG_GRADIENT, STATUS_COLORS)
- Ícones SVG em `src/app/dashboard/_components/icons.js`
- Estados de loading: spinner animado enquanto dados carregam
- Estados vazios: sempre mensagem descritiva
- A usuária principal é uma senhora — fontes grandes (text-sm mínimo), botões claros com texto descritivo

## Design System
- Tema escuro com glassmorphism
- Cores: `brand.blue #1B5FA8`, `brand.navy #1A3A6B`
- Cards: usar constante `GLASS` de styles.js
- Background: usar `BG_GRADIENT` de styles.js
- Fonte: Inter (Google Fonts)

## Padrões de Dados
- Fetch direto com `fetch('/api/dashboard/...')` nos componentes
- Auto-refresh: Hoje (20s), Pedidos (30s) via setInterval
- Auth: localStorage (`sos-auth`) verificado no layout

## Nomenclatura
- Páginas: `page.js` dentro da pasta da rota
- Layout: `layout.js`
- Rotas agrupadas em `(app)/` com sidebar
