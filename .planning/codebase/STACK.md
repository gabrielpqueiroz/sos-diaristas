# Technology Stack

**Analysis Date:** 2026-03-16

## Languages

**Primary:**
- JavaScript (ES2022+) - All source files, no TypeScript

**Secondary:**
- SQL - Raw parameterized queries in API routes (no ORM)
- CSS - Via Tailwind utility classes only (no separate .css files except `globals.css`)

## Runtime

**Environment:**
- Node.js (version not pinned; inferred from Next.js 14 compatibility, ~18+)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 14.2.5 - Full-stack React framework; App Router used exclusively
- React 18 - UI library

**Build/Dev:**
- Tailwind CSS 3.4.4 - Utility-first CSS (dark glassmorphism theme)
- PostCSS 8.4.38 - CSS processing (autoprefixer included)
- Autoprefixer 10.4.19 - CSS vendor prefixes

**Testing:**
- Not detected

## Key Dependencies

**Critical:**
- `next` 14.2.5 - Framework (App Router, server components, API routes)
- `pg` ^8.20.0 - PostgreSQL client; singleton pool in `src/lib/db.js`
- `react` ^18 - UI rendering
- `react-dom` ^18 - DOM rendering

**Infrastructure:**
- None beyond `pg` for backend

## Configuration

**Environment:**
- Loaded via `.env.local` (not committed)
- Required vars:
  - `DATABASE_URL` - PostgreSQL connection string
  - `NEXT_PUBLIC_META_PIXEL_ID` - Meta Pixel ID (browser-side)
  - `META_PIXEL_ID` - Meta Pixel ID (server-side)
  - `META_CAPI_ACCESS_TOKEN` - Meta Conversions API token (server only, never exposed to browser)
  - `NEXT_PUBLIC_GOOGLE_ADS_ID` - Google Ads tag ID (format `AW-XXXXXXXXX`)

**Build:**
- `next.config.js` - `output: 'standalone'` (for Vercel/VPS Docker deployment)
- `tailwind.config.js` - Custom brand colors, custom font family (`Plus Jakarta Sans`)
- `jsconfig.json` - Path alias `@/*` → `./src/*`
- `postcss.config.js` - Standard PostCSS + Tailwind setup

## Platform Requirements

**Development:**
- Node.js ~18+
- PostgreSQL instance accessible via `DATABASE_URL`
- `npm run dev` starts dev server at `http://localhost:3000`

**Production:**
- Hosted on Vercel (`sistemasos.queirozautomacoes.com.br`)
- PostgreSQL on VPS at `31.97.174.85`
- Standalone output mode enables self-contained deployment bundle

---

*Stack analysis: 2026-03-16*
