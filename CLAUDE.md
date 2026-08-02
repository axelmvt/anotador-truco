# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first web app to keep score ("anotador") for **Argentine Truco**. The interactive scoreboard is the product; around it sit prerendered SEO content pages. UI strings and most comments are in **Spanish (rioplatense)** — keep new user-facing text in Spanish to match.

It ships as an installable, offline-capable **PWA**.

## Commands

```sh
npm i              # install (npm is the documented flow; a bun.lockb also exists)
npm run dev        # Vite dev server on http://localhost:8080 (host "::")
npm run build      # production build — vite-react-ssg, prerenders every route
npm run build:dev  # same, development mode
npm run lint       # eslint over the repo
npm run preview    # serve the production build
npm test           # vitest run
npm run test:watch # vitest in watch mode
```

## Architecture

Vite + React 18 + TypeScript (SWC), Tailwind + shadcn/ui (Radix primitives in `src/components/ui/`). Path alias `@/` → `src/`.

**Rendering is SSG, not plain SPA.** `src/main.tsx` boots `ViteReactSSG` from `vite-react-ssg`, and `npm run build` prerenders each route to static HTML. Two consequences that bite:

- Routes live in `src/App.tsx` as a **data-router `RouteRecord[]`**, not JSX `<Route>` elements. `src/Layout.tsx` is the shared shell (TooltipProvider, both Toasters, Vercel Analytics) and every page is a child of it.
- **Anything touching `localStorage`, `window` or `navigator` must not run during prerender.** The scoreboard is wrapped in `<ClientOnly>` inside `src/pages/Index.tsx` for exactly this reason. New browser-only code needs the same treatment, or a guard like the ones in `src/lib/feedback.ts`.

Per-page `<title>`, meta and JSON-LD go through the `Head` component from `vite-react-ssg`.

### The scoreboard

Game logic and presentation are deliberately split:

- **`src/lib/gameReducer.ts`** — a pure reducer with no React and no side effects. This is where game rules live, and it is covered by `src/lib/gameReducer.test.ts` (Vitest). Keep it pure: no `Date.now()`, no randomness, no storage access. Values that vary per call come in through the action.
- **`src/components/MatchCounter.tsx`** — drives that reducer with `useReducer` and owns everything else: persistence, toasts, sound, wake lock, dialogs, layout.

Rules encoded in the reducer:

- Two teams, `team1` and `team2`, each `{ points, stage }` with `stage` going `"malas"` → `"buenas"`. Names are **user-editable** (defaults "Nosotros" / "Ellos", max 20 chars) — never assume the defaults, and never key anything off a team's initial.
- Two modes. **A 15**: one phase, win at 15, no malas/buenas at all — hide phase UI in this mode. **A 30**: 15 in malas, then 15 in buenas. `PHASE_POINTS = 15`.
- `history` is a stack of `{team1, team2}` snapshots powering undo, capped at `MAX_HISTORY = 50`. Undo pops it. It is **not** a movement log and is deliberately excluded from what gets persisted.
- Points render as **fósforos (matchsticks)**: every 5 points is one square. `getSquaresForTeam` splits points into full squares plus a partial one.

`src/components/MatchSquare.tsx` draws 1–5 points as the four sides plus the diagonal of a square (the traditional tally). It uses **refs plus a `useEffect` diff against `prevPointsRef`** so only the newly-added matchstick animates (`animate-match-manual`), not the existing ones. Preserve that newest-only behavior when editing.

### Persistence

Two `localStorage` keys, both written defensively (private mode and quota errors are swallowed):

- `anotador-truco:partida` — the game, minus `history`. Read back through `loadSavedGame()`, which normalizes and falls back to a fresh game on anything unexpected.
- `anotador-truco:sonido` — `"on"` / `"off"` for the sound-and-vibration preference.

### PWA

`vite-plugin-pwa` in `vite.config.ts` with `registerType: "autoUpdate"`: Workbox checks for a new service worker on each load, precaches it, then `skipWaiting()` + `clientsClaim()` and reloads. **Users never need to reinstall after a deploy.** The first launch post-deploy may briefly show the old version and auto-refresh; on iOS a standalone PWA only checks when actually launched, not when resumed from the app switcher.

`src/components/InstallPrompt.tsx` shows a discreet install invitation. Manifest, icons and theme colors are configured in `vite.config.ts`, not in a separate `manifest.json`.

### Other modules

- `src/lib/feedback.ts` — win and "pasó a buenas" sounds synthesized with the Web Audio API (no audio files) plus vibration. `primeAudio()` must be called inside a user gesture; iOS requires it.
- `src/hooks/use-wake-lock.ts` — keeps the screen awake during a game via the Screen Wake Lock API, degrading silently where unsupported.
- `src/lib/seo.ts` — builds `FAQPage` JSON-LD. The markup must match the visible text; Google requires it.
- `src/components/ArticleLayout.tsx` / `ArticleFaq.tsx` — shell for the content pages (`ReglasDelTruco`, `ValoresDelEnvido`, `SenasDelTruco`, `ComoAnotarLosPuntos`).

### Theming and animations

- Custom colors live in `tailwind.config.ts` under `colors.truco`: `green #186634` (board), `stick #FDB833` (matchstick gold, also the divider), `head #F44336`. The gold and red are additionally hardcoded as hex in `MatchSquare.tsx`.
- Match animations (`match-appear`, `match-manual`, `match-fade`, `match-disappear`) are keyframes in `tailwind.config.ts`, not in CSS. `src/index.css` holds base styles and the `.match-square` transition.
- shadcn's `Dialog` already animates open and close through `tailwindcss-animate`; `Drawer` (vaul) animates its own transform and follows the drag.

### Conventions

- TypeScript is intentionally loose: `noImplicitAny: false`, `strictNullChecks: false`, unused locals and params allowed, and eslint disables `@typescript-eslint/no-unused-vars`. Don't expect the compiler to catch null or any issues.
- `src/components/ui/` is generated shadcn/ui — prefer regenerating via the shadcn CLI (`components.json`) over hand-editing, unless a change is genuinely app-specific.
- Commit messages are in Spanish, Conventional Commits style with a scope: `feat(juego):`, `fix(seo):`, `chore(deps):`.
- Design specs live in `docs/superpowers/specs/`.
