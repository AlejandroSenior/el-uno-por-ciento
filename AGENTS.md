# AGENTS.md

Agent reference for `el-uno-por-ciento`. Only non-obvious facts are listed.

---

## Package manager

**pnpm only** (lockfile `pnpm-lock.yaml` v9). Never use npm or yarn.  
Node `>=22.12.0` required.

---

## Developer commands

| Purpose | Command |
|---|---|
| Frontend dev server | `pnpm dev` |
| PartyKit backend (local) | `pnpm partykit dev` (port 1999) |
| Production build | `pnpm build` → outputs to `./dist/` |
| Preview static build | `pnpm preview` |
| Deploy backend | `pnpm partykit deploy` |

**Full local dev requires two concurrent processes:** `pnpm dev` and `pnpm partykit dev`.  
There is no combined dev script.

There are **no** `test`, `lint`, or `typecheck` scripts. To type-check manually: `pnpm astro check` or `pnpm tsc --noEmit`.

---

## TypeScript quirk: `.astro/types.d.ts`

`.astro/types.d.ts` is **generated** and gitignored. On a fresh clone, TypeScript will show resolution errors until the dev server or build runs once (`pnpm dev` or `pnpm build`).

---

## Astro architecture

- `output: 'static'` — fully static, no SSR, no adapter.
- Vue components live in **`src/islands/`** (not `src/components/`). Two pages:
  - `src/pages/index.astro` → mounts `<Home client:load />`
  - `src/pages/sala.astro` → mounts `<Game client:only="vue" />` (uses `window.location` and `localStorage` — `client:only` is required here)
- Shared layout: `src/layouts/Layout.astro` (accepts optional `title` and `description` props, imports global CSS).
- Room navigation: `Home.vue` redirects to `/sala?c=CODE` (4-letter uppercase, excluding `I` and `O`). `Game.vue` reads code from `?c=` query param.
- Player name is persisted in `localStorage` under key `playerName` (max 20 chars, enforced client and server side).
- If `playerName` is absent from `localStorage` when `sala.astro` loads, `Game.vue` **silently redirects** to `/` with no error shown.

---

## README.md

The repo's `README.md` is the **default Astro starter template** — it documents `npm` commands and a generic project structure. Do not trust it; the actual project setup is different.

---

## Tailwind v4

No `tailwind.config.*` file exists — this is intentional. Tailwind v4 is configured via `@import "tailwindcss"` in `src/styles/global.css` and CSS custom properties on `:root`. Do not create a config file.

---

## Environment variable

`PUBLIC_PARTYKIT_HOST` — read client-side in `Game.vue`.  
Default (not set): `localhost:1999`.  
Production: set to the deployed PartyKit host (e.g., `el-uno-por-ciento.username.partykit.dev`).  
Must be set in Cloudflare Pages env vars **before** running `pnpm build` for production.  
There is no `.env.example`.

---

## PartyKit server (`src/party/game.ts`)

- State is **in-memory** only — no database. State resets if all players leave.
- The server broadcasts the **full `GameState`** to all clients on every change (`STATE_UPDATE` message).
- Timer runs **server-side** (`setInterval` 1s tick) — not the client.
- `NEXT_ROUND` is defined in `ClientMessage` types but is **not handled** in the server's switch statement.
- Host = first connected player; auto-reassigned to next player in object order on disconnect.
- `MAX_PLAYERS = 6`, `MIN_PLAYERS_TO_START = 2`.

---

## Questions bank (`src/data/questions.json`)

- 100 questions, IDs `q001`–`q100`, 10 per difficulty level.
- `timeLimit` is pre-calculated per question (already includes image time bonus).
- ~12 questions have images; SVG assets live in `public/images/questions/`.
- All questions are in Spanish.
- Single source of truth: this file is loaded directly by the PartyKit server at runtime.

---

## Vue state architecture

- **No Pinia, no Vuex, no composables directory, no `provide`/`inject`.** All game state flows via WebSocket → `Game.vue` → props.
- `Game.vue` owns the single `PartySocket` instance (plain module-level `let`, not reactive). Only `state`, `playerId`, `connectionError`, and `roomCode` are `ref`s.
- All child islands (`Lobby.vue`, `QuestionCard.vue`, `Results.vue`, etc.) are purely presentational — they receive props from `Game.vue` and emit events up.

---

## CONTEXT.md discrepancies (do not trust these)

`CONTEXT.md` exists but contains inaccuracies — trust the actual source files over it:
- Lists `tailwind.config.mjs` at root — **it does not exist** and should not be created.
- Describes image preloading in `Game.vue` during `REVEAL` phase — **not implemented** in current code.
- Claims "30–40% of questions have images" — actual count is **12/100 (12%)**.
- `NEXT_ROUND` message is described as functional — it is **dead code** (not handled in the server switch).

---

## Shared types (`src/types/game.ts`)

Shared between the PartyKit server and Vue islands. Do not duplicate types. Key exports: `Difficulty`, `GamePhase`, `Question`, `Player`, `GameState`, `ClientMessage`, `ServerMessage`, `DIFFICULTIES`, `PLAYER_COLORS`, `TIME_LIMITS`.

---

## CSS conventions

- Use `min-h-dvh` (dynamic viewport height), not `min-h-screen` — intentional for mobile browser chrome.
- All CSS custom properties live in `src/styles/global.css` `:root`. Full list:
  - Colors: `--color-bg`, `--color-surface`, `--color-surface2`, `--color-border`, `--color-gold`, `--color-gold-dim`, `--color-text`, `--color-muted`
  - Fonts: `--font-display` (Impact/Arial Narrow), `--font-body` (Inter/system-ui)
  - Use these; do not hardcode hex values.
- Tailwind is loaded via the Vite plugin (`@tailwindcss/vite`) — not PostCSS.
- Global CSS also defines reusable keyframe animations: `timer-drain`, `fade-eliminate`, `countdown-pulse`, `correct-flash`, `wrong-flash`. The `.player-eliminated` and `.countdown-number` utility classes apply two of them.

---

## Prettier config (`.prettierrc.json`)

`singleQuote: true`, `printWidth: 140`, `trailingComma: "none"`, `htmlWhitespaceSensitivity: "ignore"`. No ESLint config exists.

---

## Deployment (two separate steps)

1. **Backend:** `pnpm partykit deploy` — deploys `src/party/game.ts` to Cloudflare Durable Objects.
2. **Frontend:** `pnpm build`, then deploy `./dist/` to Cloudflare Pages (no adapter needed).
3. Set `PUBLIC_PARTYKIT_HOST` in Cloudflare Pages dashboard to the URL printed after step 1.

---

## What does not exist

- No tests (no Vitest, Jest, or Playwright).
- No ESLint or Biome config.
- No CI/CD (no `.github/` directory).
- No monorepo workspaces.
- No Supabase integration (future roadmap item in `CONTEXT.md`).
- No `wrangler.toml`, no Docker.
