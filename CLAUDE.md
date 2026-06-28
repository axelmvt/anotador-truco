# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first web app to keep score ("anotador") for **Argentine Truco**. The whole app is a single interactive scoreboard plus a static blog. UI strings and most comments are in **Spanish** — keep new user-facing text in Spanish to match.

## Commands

```sh
npm i              # install (npm is the documented flow; a bun.lockb also exists)
npm run dev        # Vite dev server on http://localhost:8080 (host "::")
npm run build      # production build
npm run build:dev  # build with development mode
npm run lint       # eslint over the repo
npm run preview    # serve the production build
```

There is **no test suite** and no test runner configured.

## Architecture

Vite + React 18 + TypeScript (SWC), routing via `react-router-dom`, styling via Tailwind + shadcn/ui (Radix primitives in `src/components/ui/`). `@tanstack/react-query` and `TooltipProvider` are wired in `App.tsx` but the app currently has no data fetching. `@vercel/analytics` is mounted globally.

Routes (`src/App.tsx`): `/` → `pages/Index` (the scoreboard), `/blog` → `pages/Blog` (static articles via `components/TrucoBlog`), `*` → `pages/NotFound`. Path alias `@/` → `src/`.

### The scoreboard (the core of the app)

`components/MatchCounter.tsx` holds all game state and logic — this is where real work happens. The rest is presentation.

- Two teams, **"Nosotros"** (team1) and **"Ellos"** (team2), each `{ points, stage }` where `stage` is `"malas"` then `"buenas"`. `MAX_POINTS = 15` per stage; a team wins at `buenas` + 15.
- Tapping a team's half calls `incrementTeam`; the small `-` button calls `decrementTeam`. Crossing 15 in malas rolls over to `buenas` at 1 point. `gameEnded` locks input until reset.
- Points render as **fósforos (matchsticks)**: every 5 points = one full square. `getSquaresForTeam` splits `points` into full squares (value 5) plus one partial. Each square is a `components/MatchSquare.tsx`.

`MatchSquare.tsx` draws 1–5 points as the four sides + diagonal of a square (the traditional truco tally). It uses **refs + an `useeffect` diff against `prevPointsRef`** to animate only the newly-added matchstick (`animate-match-manual`), not re-animate existing ones. Preserve this newest-only animation behavior when editing.

### Theming & animations

- Custom colors live in `tailwind.config.ts` under `colors.truco`: `green #186634` (board), `stick #FDB833`, `head #F44336`. The matchstick gold/red are also hardcoded as hex in `MatchSquare.tsx`.
- Match animations (`match-appear`, `match-manual`, `match-fade`, `match-disappear`) are defined as keyframes/animations in `tailwind.config.ts`, not in CSS. `src/index.css` holds base styles and the `.match-square` transition.

### Other notes

- `components/AdBanner.tsx` renders placeholder/mock ad slots (no real ad network wired up).
- TypeScript is intentionally loose: `tsconfig.json` sets `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals/Parameters: false`, and eslint disables `@typescript-eslint/no-unused-vars`. Don't expect the compiler to catch null/any issues.
- `src/components/ui/` is generated shadcn/ui — regenerate via the shadcn CLI (`components.json`) rather than hand-editing unless necessary.
