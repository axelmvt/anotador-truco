# IR AL VAR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "VAR" panel showing every point added, subtracted and undone during a game, plus the board redesign that came with it (gold rules, phase band under the team name, VAR button, micro-interactions).

**Architecture:** All game rules stay in the pure reducer `src/lib/gameReducer.ts`, which gains an append-only `log`. Because the reducer must stay pure and testable, timestamps arrive through the action and ids come from a counter in state. Grouping the log into "tandas" is a separate pure module, `src/lib/varLog.ts`, so it can be unit-tested without React. The panel itself is presentation only — it dispatches nothing.

**Tech Stack:** React 18 + TypeScript (SWC), Vite with `vite-react-ssg` prerendering, Tailwind + shadcn/ui, `vaul` for the bottom sheet, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-07-30-var-historial-y-rediseno-tablero-design.md`

**Branch:** `feat/var-historial` (already created, already holds the spec commits).

## Global Constraints

- **All user-facing text is Spanish (rioplatense).** "Reiniciá", "Tocá", "Anotá" — voseo, not "Reinicia"/"Toca".
- **The reducer stays pure.** No `Date.now()`, no `Math.random()`, no `crypto.randomUUID()`, no storage access inside `src/lib/gameReducer.ts` or `src/lib/varLog.ts`. Anything that varies per call arrives through a parameter.
- **Nothing browser-only runs at import time.** Routes are prerendered by `vite-react-ssg`. `localStorage`, `window` and `navigator` may only be touched inside effects, event handlers, or code already under `<ClientOnly>`.
- **Every animation is prefixed `motion-safe:`.**
- **Colors come from `colors.truco` in `tailwind.config.ts`.** No new arbitrary hex in components except where the codebase already does it (`MatchSquare.tsx`).
- **Two Tailwind classes compile to nothing here — avoid both.** Tailwind 3.4's opacity scale steps by 5, so `/12` (and any other off-scale value) silently yields no CSS; use `/15`. And `duration-*` / `ease-*` with arbitrary values are **ambiguous** with `tailwindcss-animate`, which registers the same prefixes for `animation-*` — Tailwind drops both candidates and warns only on the CLI, never in the Vite build. Write them as arbitrary properties instead: `[transition-duration:260ms]`, `[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]`. Neither failure surfaces in lint, `tsc` or `npm run build`; the only way to catch them is to grep the compiled CSS in `dist/`.
- **Team names are user-editable and may share an initial.** Never identify a team by the first letter of its name.
- **Phase (Malas/Buenas) only exists in mode 30.** In mode 15 no phase UI renders at all.
- `MAX_LOG = 200`, `UMBRAL_TANDA_MS = 120_000` (2 minutes), `MAX_HISTORY = 50` (unchanged).
- **Commits in Spanish**, Conventional Commits with scope: `feat(var):`, `feat(juego):`, `fix(ui):`.
- **No component-level test infrastructure exists** (`@testing-library` and `jsdom` are not installed, and this plan does not add them). Pure modules get Vitest tests; component tasks are verified with `npm run lint`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build` and an explicit manual checklist.
- **Type-check with `npx tsc -p tsconfig.app.json --noEmit`, nothing else.** `npm test` does not type-check, and neither does `npm run build` — Vite/SWC strips types without validating them, so the build goes green over broken types. A bare `npx tsc --noEmit` also checks nothing: the root `tsconfig.json` is a solution-style config with references and no files of its own. Only the `-p tsconfig.app.json` form is a real gate.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/gameReducer.ts` | *modify* — game rules + the append-only log |
| `src/lib/gameReducer.test.ts` | *modify* — existing 18 tests keep passing, plus log tests |
| `src/lib/varLog.ts` | *create* — pure grouping/formatting for the panel |
| `src/lib/varLog.test.ts` | *create* |
| `src/components/icons/VarIcon.tsx` | *create* — the VAR glyph, nothing else |
| `src/components/PhaseBand.tsx` | *create* — the Malas/Buenas band under a team name |
| `src/components/VarPanel.tsx` | *create* — the panel: container, header, both views |
| `src/components/MatchCounter.tsx` | *modify* — wiring: timestamps, persistence, FAB, header, rules |
| `src/components/Footer.tsx` | *modify* — drop `border-t`, animate expansion |
| `src/components/ui/drawer.tsx` | *modify* — fade + blur on the overlay |
| `tailwind.config.ts` | *modify* — panel colors, new keyframes |
| `src/index.css` | *modify* — `prefers-reduced-motion` safety net |

`PhaseBand` is its own file because `MatchCounter.tsx` is already ~470 lines and the band carries its own animation state. `VarPanel` holds the header and both views together: they share layout and always change together.

---

### Task 1: The log in the reducer

**Files:**
- Modify: `src/lib/gameReducer.ts`
- Test: `src/lib/gameReducer.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `LogType`, `LogEntry`, `MAX_LOG`, `entradaRevertida(log: LogEntry[]): LogEntry | undefined`. `GameState` gains `log: LogEntry[]` and `nextLogId: number`. `GameAction` variants `increment`, `decrement` and `undo` gain a required `at: number`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/gameReducer.test.ts`. Note the helper changes at the top of the file — `run` and `inc` must inject an increasing `at`, otherwise every existing test fails to compile.

Replace the existing helpers (lines 9–14) with:

```ts
// Aplica una lista de acciones en secuencia partiendo de un estado.
const run = (state: GameState, actions: Parameters<typeof gameReducer>[1][]) =>
  actions.reduce(gameReducer, state);

// Reloj falso: el reducer es puro, así que el timestamp entra por la acción.
const T0 = 1_770_000_000_000;
let reloj = T0;
const tick = (ms = 1000) => (reloj += ms);
const resetReloj = () => { reloj = T0; };

const inc = (team: "team1" | "team2", times: number) =>
  Array.from({ length: times }, () => ({ type: "increment", team, at: tick() }) as const);
```

Then append this block:

```ts
describe("log del VAR", () => {
  beforeEach(resetReloj);

  it("cada suma y cada resta escriben una entrada", () => {
    const s = run(createInitialState(30), [
      { type: "increment", team: "team1", at: 100 },
      { type: "increment", team: "team1", at: 200 },
      { type: "decrement", team: "team1", at: 300 },
    ]);
    expect(s.log).toHaveLength(3);
    expect(s.log.map((e) => e.type)).toEqual(["suma", "suma", "resta"]);
    expect(s.log.map((e) => e.points)).toEqual([1, 2, 1]);
    expect(s.log.map((e) => e.at)).toEqual([100, 200, 300]);
    expect(s.log.map((e) => e.delta)).toEqual([1, 1, -1]);
  });

  it("los ids son únicos y correlativos", () => {
    const s = run(createInitialState(30), inc("team1", 4));
    expect(s.log.map((e) => e.id)).toEqual(["L1", "L2", "L3", "L4"]);
    expect(s.nextLogId).toBe(5);
  });

  it("un movimiento sin efecto no escribe nada", () => {
    // restar en cero no cambia el marcador, así que tampoco el log
    const s = gameReducer(createInitialState(30), { type: "decrement", team: "team1", at: 100 });
    expect(s.log).toHaveLength(0);
  });

  it("con la partida terminada no se escribe nada", () => {
    const ganada = run(createInitialState(15), inc("team1", 15));
    const largo = ganada.log.length;
    const s = gameReducer(ganada, { type: "increment", team: "team2", at: 9_999 });
    expect(s.log).toHaveLength(largo);
  });

  it("la entrada guarda la fase resultante, no la anterior", () => {
    const s = run(createInitialState(30), inc("team1", 16));
    const ultima = s.log[s.log.length - 1];
    expect(ultima.stage).toBe("buenas");
    expect(ultima.points).toBe(1);
  });

  it("deshacer agrega una entrada y no borra la anterior", () => {
    const s = run(createInitialState(30), [
      { type: "increment", team: "team1", at: 100 },
      { type: "increment", team: "team1", at: 200 },
      { type: "undo", at: 300 },
    ]);
    expect(s.log).toHaveLength(3);
    const ultima = s.log[2];
    expect(ultima.type).toBe("deshacer");
    expect(ultima.undoneType).toBe("suma");
    expect(ultima.team).toBe("team1");
    expect(ultima.delta).toBe(-1);
    expect(ultima.points).toBe(1); // el marcador quedó en 1
    expect(s.team1.points).toBe(1);
  });

  it("deshacer dos veces seguidas apunta a la jugada correcta", () => {
    // Sin saltar los deshacer ya consumidos, el segundo undo diría
    // undoneType: "deshacer" en vez de "suma".
    const s = run(createInitialState(30), [
      { type: "increment", team: "team1", at: 100 },
      { type: "decrement", team: "team1", at: 200 },
      { type: "undo", at: 300 },
      { type: "undo", at: 400 },
    ]);
    expect(s.log.map((e) => e.type)).toEqual(["suma", "resta", "deshacer", "deshacer"]);
    expect(s.log[2].undoneType).toBe("resta");
    expect(s.log[3].undoneType).toBe("suma");
    expect(s.team1.points).toBe(0);
  });

  it("deshacer sin historial no toca el log", () => {
    const s = gameReducer(createInitialState(30), { type: "undo", at: 100 });
    expect(s.log).toHaveLength(0);
    expect(s.nextLogId).toBe(1);
  });

  it("reset y setMode vacían el log", () => {
    const jugada = run(createInitialState(30), inc("team1", 3));
    expect(gameReducer(jugada, { type: "reset" }).log).toHaveLength(0);
    expect(gameReducer(jugada, { type: "reset" }).nextLogId).toBe(1);
    expect(gameReducer(jugada, { type: "setMode", mode: 15 }).log).toHaveLength(0);
  });

  it("setName no toca el log", () => {
    const jugada = run(createInitialState(30), inc("team1", 2));
    const s = gameReducer(jugada, { type: "setName", team: "team1", name: "Los Pibes" });
    expect(s.log).toHaveLength(2);
  });

  it("el log se recorta a MAX_LOG conservando las más nuevas", () => {
    // Una partida a 30 tiene techo de 30 sumas por equipo, y al ganar el
    // reducer deja de escribir. Para superar 200 entradas sin terminarla se
    // alterna suma y resta sobre el mismo equipo: el marcador oscila 1-0-1-0
    // y cada acción sí cambia el estado, así que cada una escribe.
    const acciones = Array.from({ length: 220 }, (_, i) =>
      i % 2 === 0
        ? ({ type: "increment", team: "team1", at: 1000 + i } as const)
        : ({ type: "decrement", team: "team1", at: 1000 + i } as const)
    );
    const s = run(createInitialState(30), acciones);
    expect(s.log).toHaveLength(MAX_LOG);
    expect(s.log[s.log.length - 1].at).toBe(1000 + 219);
    expect(s.winner).toBeNull();
    // el contador de ids no se recorta: siguió contando las 220
    expect(s.nextLogId).toBe(221);
  });
});
```

Update the import at the top of the test file to pull in `MAX_LOG`, and add `beforeEach` to the vitest import:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  gameReducer,
  createInitialState,
  getSquaresForTeam,
  MAX_LOG,
  type GameState,
} from "./gameReducer";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — TypeScript errors on `at` not existing in the action type, and `MAX_LOG` / `s.log` / `s.nextLogId` not existing.

- [ ] **Step 3: Implement**

In `src/lib/gameReducer.ts`:

Add the types after the existing `Stage` / `GameMode` declarations:

```ts
export type LogType = "suma" | "resta" | "deshacer";

// Entrada del historial del VAR. Es append-only: deshacer agrega, nunca borra.
export interface LogEntry {
  id: string;            // "L1", "L2", … — contador monótono, key estable para React
  team: Team;
  type: LogType;
  delta: number;         // +1 | -1 (en "deshacer", el inverso de lo revertido)
  points: number;        // puntos del equipo DESPUÉS del movimiento
  stage: Stage;          // fase del equipo DESPUÉS del movimiento
  at: number;            // timestamp en ms, lo inyecta quien despacha
  undoneType?: LogType;  // solo cuando type === "deshacer"
}
```

Extend `GameState`:

```ts
export interface GameState {
  mode: GameMode;
  names: Record<Team, string>;
  team1: TeamState;
  team2: TeamState;
  winner: Team | null;
  history: { team1: TeamState; team2: TeamState }[];
  log: LogEntry[];
  nextLogId: number;
}
```

Extend `GameAction` — `at` is required, no default, so a caller that forgets it fails to compile:

```ts
export type GameAction =
  | { type: "increment"; team: Team; at: number }
  | { type: "decrement"; team: Team; at: number }
  | { type: "undo"; at: number }
  | { type: "reset" }
  | { type: "setMode"; mode: GameMode }
  | { type: "setName"; team: Team; name: string };
```

Add the cap next to `MAX_HISTORY`:

```ts
export const MAX_LOG = 200;
```

Extend `createInitialState` to seed the new fields:

```ts
export const createInitialState = (
  mode: GameMode = 30,
  names: Record<Team, string> = DEFAULT_NAMES
): GameState => ({
  mode,
  names: { ...names },
  team1: { points: 0, stage: "malas" },
  team2: { points: 0, stage: "malas" },
  winner: null,
  history: [],
  log: [],
  nextLogId: 1,
});
```

Rewrite `withMove` so every real move writes exactly one entry:

```ts
const withMove = (
  state: GameState,
  team: Team,
  next: TeamState,
  winner: Team | null,
  type: Exclude<LogType, "deshacer">,
  at: number
): GameState => ({
  ...state,
  [team]: next,
  winner,
  history: [...state.history, snapshot(state)].slice(-MAX_HISTORY),
  log: [
    ...state.log,
    {
      id: `L${state.nextLogId}`,
      team,
      type,
      delta: type === "suma" ? 1 : -1,
      points: next.points,
      stage: next.stage,
      at,
    },
  ].slice(-MAX_LOG),
  nextLogId: state.nextLogId + 1,
});
```

Thread `at` through the two movers and pass the type. `incrementTeam` becomes:

```ts
const incrementTeam = (state: GameState, team: Team, at: number): GameState => {
  if (state.winner) return state; // partida terminada: no se modifica
  const current = state[team];

  // Modo corto: una sola fase, se gana al llegar a 15
  if (state.mode === 15) {
    if (current.points >= PHASE_POINTS) return state;
    const next: TeamState = { points: current.points + 1, stage: "malas" };
    return withMove(state, team, next, next.points === PHASE_POINTS ? team : null, "suma", at);
  }

  // Modo largo (a 30): malas -> buenas, se gana al completar buenas
  if (current.stage === "malas") {
    const next: TeamState =
      current.points < PHASE_POINTS
        ? { points: current.points + 1, stage: "malas" }
        : { points: 1, stage: "buenas" };
    return withMove(state, team, next, null, "suma", at);
  }

  // stage === "buenas"
  if (current.points >= PHASE_POINTS) return state;
  const next: TeamState = { points: current.points + 1, stage: "buenas" };
  return withMove(state, team, next, next.points === PHASE_POINTS ? team : null, "suma", at);
};
```

`decrementTeam` becomes:

```ts
const decrementTeam = (state: GameState, team: Team, at: number): GameState => {
  if (state.winner) return state;
  const current = state[team];

  if (state.mode === 15) {
    if (current.points <= 0) return state;
    return withMove(state, team, { points: current.points - 1, stage: "malas" }, null, "resta", at);
  }

  // Modo largo: inverso exacto de la transición malas->buenas
  if (current.stage === "buenas" && current.points === 1) {
    return withMove(state, team, { points: PHASE_POINTS, stage: "malas" }, null, "resta", at);
  }
  if (current.points > 0) {
    return withMove(state, team, { ...current, points: current.points - 1 }, null, "resta", at);
  }
  return state;
};
```

Add the helper that finds what an undo actually reverts. It is exported so it can be tested or reused directly; for now its behavior is covered through the "deshacer dos veces seguidas" test above. This is the subtle part of the task:

```ts
// Qué jugada revierte un deshacer: recorre el log hacia atrás salteando las
// que ya fueron deshechas. Sin esto, deshacer dos veces seguidas reportaría
// "se deshizo un deshacer" en vez de la jugada original.
export const entradaRevertida = (log: LogEntry[]): LogEntry | undefined => {
  let pendientes = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.type === "deshacer") {
      pendientes++;
      continue;
    }
    if (pendientes === 0) return e;
    pendientes--;
  }
  return undefined;
};
```

Rewrite the reducer's switch:

```ts
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "increment":
      return incrementTeam(state, action.team, action.at);
    case "decrement":
      return decrementTeam(state, action.team, action.at);
    case "undo": {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      const revertida = entradaRevertida(state.log);
      // Deshacer también reabre la partida si el último punto la había cerrado
      const base: GameState = {
        ...state,
        ...last,
        winner: null,
        history: state.history.slice(0, -1),
      };
      if (!revertida) return base;
      const entrada: LogEntry = {
        id: `L${state.nextLogId}`,
        team: revertida.team,
        type: "deshacer",
        delta: -revertida.delta,
        points: last[revertida.team].points,
        stage: last[revertida.team].stage,
        at: action.at,
        undoneType: revertida.type,
      };
      return {
        ...base,
        log: [...state.log, entrada].slice(-MAX_LOG),
        nextLogId: state.nextLogId + 1,
      };
    }
    case "reset":
      return createInitialState(state.mode, state.names);
    case "setMode":
      // Cambiar la duración reinicia el tanteador (conserva los nombres)
      return createInitialState(action.mode, state.names);
    case "setName":
      return { ...state, names: { ...state.names, [action.team]: action.name } };
    default:
      return state;
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all previous tests plus the 11 new ones. `src/components/MatchCounter.tsx` will now show TypeScript errors about the missing `at`; that is expected and gets fixed in Task 3. `npm test` does not type-check the app, so it stays green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gameReducer.ts src/lib/gameReducer.test.ts
git commit -m "feat(juego): agrega el log append-only del VAR al reducer

El timestamp entra por la accion y el id sale de un contador en el estado
para que el reducer siga siendo puro. Deshacer agrega una entrada en vez
de borrar, y saltea los deshacer ya consumidos para apuntar a la jugada
original.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Grouping the log into tandas

**Files:**
- Create: `src/lib/varLog.ts`
- Test: `src/lib/varLog.test.ts`

**Interfaces:**
- Consumes: `LogEntry`, `LogType`, `Team`, `Stage`, `GameMode` from `./gameReducer`
- Produces: `UMBRAL_TANDA_MS`, `Tanda`, `agruparEnTandas(log, umbralMs?)`, `Bucket`, `bucketDeTiempo(at, ahora)`, `hitosDeBuenas(log, mode)`

- [ ] **Step 1: Write the failing test**

Create `src/lib/varLog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { agruparEnTandas, bucketDeTiempo, hitosDeBuenas, UMBRAL_TANDA_MS } from "./varLog";
import type { LogEntry } from "./gameReducer";

const MIN = 60_000;

// Constructor corto de entradas. `at` va en minutos desde un origen arbitrario.
let n = 0;
const e = (
  team: "team1" | "team2",
  type: "suma" | "resta" | "deshacer",
  atMin: number,
  points = 1,
  extra: Partial<LogEntry> = {}
): LogEntry => ({
  id: `L${++n}`,
  team,
  type,
  delta: type === "resta" ? -1 : 1,
  points,
  stage: "malas",
  at: atMin * MIN,
  ...extra,
});

describe("agruparEnTandas", () => {
  it("junta movimientos consecutivos del mismo equipo dentro del umbral", () => {
    const t = agruparEnTandas([e("team1", "suma", 0, 1), e("team1", "suma", 0.5, 2), e("team1", "suma", 1, 3)]);
    expect(t).toHaveLength(1);
    expect(t[0].delta).toBe(3);
    expect(t[0].points).toBe(3);
    expect(t[0].items).toHaveLength(3);
  });

  it("parte la tanda cuando se pasa del umbral", () => {
    const t = agruparEnTandas([e("team1", "suma", 0, 1), e("team1", "suma", 5, 2)]);
    expect(t).toHaveLength(2);
  });

  it("el otro equipo corta la tanda", () => {
    const t = agruparEnTandas([
      e("team1", "suma", 0, 1),
      e("team2", "suma", 0.2, 1),
      e("team1", "suma", 0.4, 2),
    ]);
    expect(t).toHaveLength(3);
    expect(t.map((x) => x.team)).toEqual(["team1", "team2", "team1"]);
  });

  it("una resta se agrupa con las sumas y resta del delta", () => {
    const t = agruparEnTandas([e("team1", "suma", 0, 1), e("team1", "suma", 0.2, 2), e("team1", "resta", 0.4, 1)]);
    expect(t).toHaveLength(1);
    expect(t[0].delta).toBe(1);
    expect(t[0].points).toBe(1);
  });

  it("un deshacer nunca se agrupa: va suelto y corta la tanda", () => {
    const t = agruparEnTandas([
      e("team1", "suma", 0, 1),
      e("team1", "deshacer", 0.2, 0, { undoneType: "suma", delta: -1 }),
      e("team1", "suma", 0.4, 1),
    ]);
    expect(t).toHaveLength(3);
    expect(t[1].tipo).toBe("deshacer");
    expect(t[1].undoneType).toBe("suma");
    expect(t[0].tipo).toBe("tanda");
    expect(t[2].tipo).toBe("tanda");
  });

  it("respeta un umbral distinto al de por defecto", () => {
    const entradas = [e("team1", "suma", 0, 1), e("team1", "suma", 1.5, 2)];
    expect(agruparEnTandas(entradas, 30_000)).toHaveLength(2);
    expect(agruparEnTandas(entradas, UMBRAL_TANDA_MS)).toHaveLength(1);
  });

  it("el umbral se mide contra el último movimiento, no contra el primero", () => {
    // 0 → 1.5 → 3 min: cada salto entra en el umbral de 2 min, así que va todo junto
    const t = agruparEnTandas([
      e("team1", "suma", 0, 1),
      e("team1", "suma", 1.5, 2),
      e("team1", "suma", 3, 3),
    ]);
    expect(t).toHaveLength(1);
  });

  it("un log vacío da una lista vacía", () => {
    expect(agruparEnTandas([])).toEqual([]);
  });

  it("la tanda expone desde, hasta y la fase final", () => {
    const t = agruparEnTandas([
      e("team1", "suma", 1, 15),
      e("team1", "suma", 1.5, 1, { stage: "buenas" }),
    ]);
    expect(t[0].desde).toBe(1 * MIN);
    expect(t[0].hasta).toBe(1.5 * MIN);
    expect(t[0].stage).toBe("buenas");
  });
});

describe("bucketDeTiempo", () => {
  const ahora = 100 * MIN;
  it("clasifica por antigüedad", () => {
    expect(bucketDeTiempo(ahora, ahora).label).toBe("Recién");
    expect(bucketDeTiempo(ahora - 3 * MIN, ahora).label).toBe("Hace unos minutos");
    expect(bucketDeTiempo(ahora - 12 * MIN, ahora).label).toBe("Hace 10 minutos");
    expect(bucketDeTiempo(ahora - 20 * MIN, ahora).label).toBe("Hace media hora");
    expect(bucketDeTiempo(ahora - 60 * MIN, ahora).label).toBe("Al principio");
  });

  it("dos momentos del mismo tramo comparten k", () => {
    expect(bucketDeTiempo(ahora - 6 * MIN, ahora).k).toBe(bucketDeTiempo(ahora - 12 * MIN, ahora).k);
  });
});

describe("hitosDeBuenas", () => {
  it("marca la primera suma en buenas de cada equipo", () => {
    const log = [
      e("team1", "suma", 0, 15),
      e("team1", "suma", 1, 1, { stage: "buenas" }),
      e("team1", "suma", 2, 2, { stage: "buenas" }),
      e("team2", "suma", 3, 1, { stage: "buenas" }),
    ];
    const h = hitosDeBuenas(log, 30);
    expect(Object.keys(h)).toHaveLength(2);
    expect(h[log[1].id]).toBe("team1");
    expect(h[log[3].id]).toBe("team2");
  });

  it("en modo 15 no hay hitos", () => {
    const log = [e("team1", "suma", 0, 1, { stage: "buenas" })];
    expect(hitosDeBuenas(log, 15)).toEqual({});
  });

  it("una resta que deja en buenas no cuenta como hito", () => {
    const log = [e("team1", "resta", 0, 2, { stage: "buenas" })];
    expect(hitosDeBuenas(log, 30)).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/lib/varLog.test.ts`
Expected: FAIL — "Failed to resolve import ./varLog".

- [ ] **Step 3: Implement**

Create `src/lib/varLog.ts`:

```ts
// Agrupación y formateo del historial del VAR. Lógica pura, sin React ni
// efectos, para poder testearla igual que el reducer.
import type { GameMode, LogEntry, LogType, Stage, Team } from "./gameReducer";

// Dos minutos: los puntos de una misma mano se cargan seguidos. Más ancho que
// esto junta manos distintas; más angosto parte una mano si alguien se distrae.
export const UMBRAL_TANDA_MS = 120_000;

export interface Tanda {
  id: string;            // id de la primera entrada: key estable para React
  team: Team;
  tipo: "tanda" | "deshacer";
  items: LogEntry[];
  desde: number;         // at del primer movimiento
  hasta: number;         // at del último
  delta: number;         // suma de los deltas del grupo
  points: number;        // puntos del equipo al cerrar la tanda
  stage: Stage;
  undoneType?: LogType;  // solo cuando tipo === "deshacer"
}

const nuevaTanda = (e: LogEntry): Tanda => ({
  id: e.id,
  team: e.team,
  tipo: e.type === "deshacer" ? "deshacer" : "tanda",
  items: [e],
  desde: e.at,
  hasta: e.at,
  delta: e.delta,
  points: e.points,
  stage: e.stage,
  undoneType: e.undoneType,
});

// Junta movimientos consecutivos del mismo equipo separados por menos del
// umbral. Un deshacer nunca se agrupa: corta la tanda y va como fila propia,
// porque es una corrección, no puntos que entraron.
export const agruparEnTandas = (log: LogEntry[], umbralMs = UMBRAL_TANDA_MS): Tanda[] => {
  const out: Tanda[] = [];
  for (const e of log) {
    const prev = out[out.length - 1];
    const agrupable =
      prev !== undefined &&
      prev.tipo === "tanda" &&
      e.type !== "deshacer" &&
      prev.team === e.team &&
      e.at - prev.hasta <= umbralMs;

    if (agrupable) {
      prev.items.push(e);
      prev.hasta = e.at;
      prev.delta += e.delta;
      prev.points = e.points;
      prev.stage = e.stage;
    } else {
      out.push(nuevaTanda(e));
    }
  }
  return out;
};

export interface Bucket {
  k: number;      // clave del tramo: dos entradas con el mismo k van juntas
  label: string;
}

// Tramos de antigüedad para los separadores de la lista.
export const bucketDeTiempo = (at: number, ahora: number): Bucket => {
  const min = Math.floor((ahora - at) / 60_000);
  if (min < 1) return { k: 0, label: "Recién" };
  if (min < 5) return { k: 5, label: "Hace unos minutos" };
  if (min < 15) return { k: 15, label: "Hace 10 minutos" };
  if (min < 30) return { k: 30, label: "Hace media hora" };
  return { k: 99, label: "Al principio" };
};

// La primera vez que cada equipo suma estando en buenas, para el separador
// "▸ Los Pibes pasó a las buenas". Solo aplica al modo a 30.
export const hitosDeBuenas = (log: LogEntry[], mode: GameMode): Record<string, Team> => {
  if (mode !== 30) return {};
  const visto: Partial<Record<Team, true>> = {};
  const out: Record<string, Team> = {};
  for (const e of log) {
    if (e.type === "suma" && e.stage === "buenas" && !visto[e.team]) {
      visto[e.team] = true;
      out[e.id] = e.team;
    }
  }
  return out;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — every reducer test plus 15 new ones in `varLog.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/varLog.ts src/lib/varLog.test.ts
git commit -m "feat(var): agrupa el historial en tandas

Los puntos consecutivos de un mismo equipo dentro de 2 minutos se juntan
en una tanda. Un deshacer nunca se agrupa: corta y va suelto.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire timestamps and persist the log

**Files:**
- Modify: `src/components/MatchCounter.tsx`

**Interfaces:**
- Consumes: `LogEntry`, `MAX_LOG` from Task 1
- Produces: a compiling `MatchCounter` whose game log survives a reload. No UI change yet.

This task has no automated test — the persistence path touches `localStorage` and there is no jsdom. It is verified by build plus a manual reload check.

- [ ] **Step 1: Add `at` to every dispatch**

In `src/components/MatchCounter.tsx`, the three call sites inside `incrementTeam`, `decrementTeam` and `undo`:

```ts
    dispatch({ type: "increment", team, at: Date.now() });
```
```ts
    dispatch({ type: "decrement", team, at: Date.now() });
```
```ts
    dispatch({ type: "undo", at: Date.now() });
```

`Date.now()` here is correct: this is an event handler, never prerender.

- [ ] **Step 2: Persist the log**

Extend the import from `@/lib/gameReducer` with `MAX_LOG` and `type LogEntry`.

Add above `loadSavedGame`:

```ts
// Descarta entradas corruptas de un log guardado por otra versión y recorta al
// tope. Un log inválido no es un error: se arranca sin historial.
const sanearLog = (raw: unknown): LogEntry[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e): e is LogEntry =>
        !!e &&
        typeof e.at === "number" &&
        typeof e.id === "string" &&
        (e.team === "team1" || e.team === "team2") &&
        (e.type === "suma" || e.type === "resta" || e.type === "deshacer")
    )
    .slice(-MAX_LOG);
};

// El contador se recalcula del log en vez de confiar en lo guardado: así dos
// entradas nunca comparten id aunque el valor almacenado esté mal.
const siguienteLogId = (log: LogEntry[]): number =>
  log.reduce((max, e) => Math.max(max, Number(e.id.replace(/^L/, "")) || 0), 0) + 1;
```

Inside `loadSavedGame`, replace the returned object's tail. It currently ends with `history: []`; it becomes:

```ts
    const log = sanearLog(p.log);
    return {
      mode: p.mode === 15 ? 15 : 30,
      names: {
        team1: p.names?.team1 ?? DEFAULT_NAMES.team1,
        team2: p.names?.team2 ?? DEFAULT_NAMES.team2,
      },
      team1: p.team1,
      team2: p.team2,
      winner: p.winner ?? null,
      history: [],
      log,
      nextLogId: siguienteLogId(log),
    };
```

The early-return `createInitialState()` branches already seed `log: []` and `nextLogId: 1`, so they need no change.

- [ ] **Step 3: Exclude `nextLogId` from what gets written**

In the persistence effect, `nextLogId` joins `history` in the discard list — it is recomputed on load, so storing it only invites drift:

```ts
  // Persiste la partida (sin la pila de deshacer, y sin el contador de ids que
  // se recalcula al leer) en cada cambio, para no perderla al refrescar.
  useEffect(() => {
    try {
      const { history, nextLogId, ...persistable } = state;
      void history;
      void nextLogId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // localStorage no disponible (modo privado / cuota llena): se ignora
    }
  }, [state]);
```

- [ ] **Step 4: Verify it compiles and builds**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: all three succeed. The `tsc` step is the real type gate: `npm test` does not type-check components, and `npm run build` does not either — Vite/SWC strips types without checking them, so a build can go green over broken types. Note the `-p tsconfig.app.json`: a bare `npx tsc --noEmit` checks nothing, because the root `tsconfig.json` is a solution-style config with references and no files of its own.

- [ ] **Step 5: Verify persistence by hand**

Run: `npm run dev`, open http://localhost:8080

1. Add 4 points to one team and 2 to the other, then press undo once.
2. Open DevTools → Application → Local Storage → `anotador-truco:partida`.
3. Confirm the JSON has a `log` array with 7 entries, the last one `"type":"deshacer"`, and **no** `history` and **no** `nextLogId` key.
4. Reload the page. The score is unchanged and the stored `log` still has its 7 entries.
5. Press "Reiniciar partida". The stored `log` is now `[]`.

- [ ] **Step 6: Commit**

```bash
git add src/components/MatchCounter.tsx
git commit -m "feat(juego): persiste el log del VAR en localStorage

El timestamp se inyecta al despachar. Al leer se descartan las entradas
corruptas y el contador de ids se recalcula del log en vez de confiar en
lo guardado.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Design tokens, keyframes and reduced motion

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`

**Interfaces:**
- Produces: colors `truco.sheet`, `truco.cream`, `truco.headSoft`; animations `animate-rule-draw`, `animate-rule-draw-y`, `animate-band-wipe`, `animate-band-shine`, `animate-stage-pop`, `animate-fab-in`, `animate-var-row-in`. Tasks 5–10 consume these by name.

No test: this is configuration. Verified by build and by the classes actually taking effect in later tasks.

- [ ] **Step 1: Add the panel colors**

In `tailwind.config.ts`, extend the existing `colors.truco` block. Note `cream` and `headSoft` are named so they never collide with the board's `stick` / `head`:

```ts
				truco: {
					'green': '#186634',
					'stick': '#FDB833',
					'head': '#F44336',
					'sheet': '#0C1F14',     // fondo del panel del VAR: verde de tiza
					'cream': '#F5EFE1',     // tinta del panel
					'headSoft': '#FF8A80',  // rojo legible como texto chico sobre el panel
				}
```

- [ ] **Step 2: Add the keyframes**

Inside `theme.extend.keyframes`, after the existing `'glow'` entry:

```ts
				'rule-draw': {
					'0%': { transform: 'scaleX(0)', opacity: '0' },
					'100%': { transform: 'scaleX(1)', opacity: '1' }
				},
				'rule-draw-y': {
					'0%': { transform: 'scaleY(0)', opacity: '0' },
					'100%': { transform: 'scaleY(1)', opacity: '1' }
				},
				'band-wipe': {
					'0%': { transform: 'scaleX(0)' },
					'100%': { transform: 'scaleX(1)' }
				},
				'band-shine': {
					'0%': { transform: 'translateX(-140%)', opacity: '0' },
					'12%': { opacity: '1' },
					'100%': { transform: 'translateX(300%)', opacity: '0' }
				},
				'stage-pop': {
					'0%, 100%': { transform: 'scale(1)' },
					'35%': { transform: 'scale(1.06)' }
				},
				'fab-in': {
					'0%': { opacity: '0', transform: 'scale(0.7) translateY(6px)' },
					'100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
				},
				'var-row-in': {
					'0%': { opacity: '0', transform: 'translateY(9px)' },
					'100%': { opacity: '1', transform: 'none' }
				}
```

- [ ] **Step 3: Register the animations**

Inside `theme.extend.animation`, after `'glow'`:

```ts
				'rule-draw': 'rule-draw 0.52s cubic-bezier(0.22, 1, 0.36, 1) both',
				'rule-draw-y': 'rule-draw-y 0.52s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both',
				'band-wipe': 'band-wipe 0.42s cubic-bezier(0.65, 0, 0.35, 1) forwards',
				'band-shine': 'band-shine 0.9s ease-out 0.12s 1',
				'stage-pop': 'stage-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'fab-in': 'fab-in 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) both',
				'var-row-in': 'var-row-in 0.24s cubic-bezier(0.4, 0, 0.2, 1) both'
```

- [ ] **Step 4: Add the reduced-motion safety net**

Append to the end of `src/index.css`. The `motion-safe:` prefix already covers the new animations; this catches the plain `transition-*` utilities and the pre-existing `animate-match-manual`:

```css
/* Red de seguridad: motion-safe: cubre las animaciones nuevas, pero no las
   transition-* sueltas ni el animate-match-manual que ya existía. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/index.css
git commit -m "feat(ui): tokens del panel del VAR, keyframes y movimiento reducido

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The VAR icon and its button

**Files:**
- Create: `src/components/icons/VarIcon.tsx`
- Modify: `src/components/MatchCounter.tsx`

**Interfaces:**
- Consumes: `animate-fab-in` from Task 4
- Produces: default export `VarIcon` accepting `React.SVGProps<SVGSVGElement>`; local state `varOpen` / `setVarOpen` in `MatchCounter`, consumed by Task 6.

- [ ] **Step 1: Create the icon**

Create `src/components/icons/VarIcon.tsx`. The letters are drawn as strokes, not text: it does not depend on the loaded font and it is not the trademarked FIFA logo.

```tsx
// Recuadro con "VAR" dibujado como trazos. No usa tipografía (no depende de la
// fuente cargada) ni reproduce el logo oficial del VAR, que es marca registrada.
const VarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="7" width="26" height="18" rx="4.5" strokeWidth={2.2} />
    <path d="M7 12l2.2 8 2.2-8" />
    <path d="M13.8 20l2.2-8 2.2 8M14.6 17.2h2.8" />
    <path d="M20.6 20v-8h2.4a2.1 2.1 0 0 1 0 4.2h-2.4M22.3 16.2 25 20" />
  </svg>
);

export default VarIcon;
```

- [ ] **Step 2: Add the state and the button**

In `src/components/MatchCounter.tsx`, import the icon:

```ts
import VarIcon from "@/components/icons/VarIcon";
```

Add next to the other `useState` calls:

```ts
  const [varOpen, setVarOpen] = useState(false);
```

In the FAB column (`<div className="absolute right-2 bottom-2 flex flex-col gap-3 items-end z-30">`), insert the VAR button **before** the settings button so it renders above it, and drop the settings button's `mb-2` so the column keeps an even `gap-3`:

```tsx
              {/* Botón VAR — primero en la columna, arriba del engranaje */}
              <Button
                variant="outline"
                size="icon"
                aria-label="VAR — revisar las jugadas"
                className="h-12 w-12 rounded-full bg-black/10 border-none text-white hover:bg-black/20 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25 motion-safe:animate-fab-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setVarOpen(true);
                }}
              >
                <VarIcon className="h-6 w-6" />
              </Button>

              {/* Settings Button */}
              <Button
                variant="outline"
                size="icon"
                aria-label="Configuración"
                className="h-12 w-12 rounded-full bg-black/10 border-none text-white hover:bg-black/20 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
              >
                <Settings className="h-6 w-6" />
              </Button>
```

Apply the same press treatment to the undo, reset and both minus buttons — replace each one's `transition-all` with:

```
transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25
```

For the reset button, which is red, use `active:bg-red-500/90` instead of `active:bg-black/25`.

- [ ] **Step 3: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed. `varOpen` is set but never read yet — that is fine, eslint has `@typescript-eslint/no-unused-vars` disabled.

- [ ] **Step 4: Verify by hand**

Run: `npm run dev`

1. The VAR button sits directly above the gear, same size and color as the rest.
2. The glyph reads as a boxed "VAR" at 24px — zoom the browser to 200% and confirm the letters are legible, not mush.
3. Pressing any FAB visibly shrinks it and springs back.
4. Tapping the VAR button does **not** add a point to the team below it (the `stopPropagation` works).
5. The column has even spacing with no double gap where the gear's `mb-2` used to be.

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/VarIcon.tsx src/components/MatchCounter.tsx
git commit -m "feat(var): boton VAR arriba del engranaje

Icono propio dibujado como trazos, monocromo, mismo tratamiento que el
resto de los FABs. Suma el press con scale a toda la columna.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The VAR panel — container and Movimientos view

**Files:**
- Create: `src/components/VarPanel.tsx`
- Modify: `src/components/MatchCounter.tsx`
- Modify: `src/components/ui/drawer.tsx`

**Interfaces:**
- Consumes: `agruparEnTandas`, `bucketDeTiempo`, `hitosDeBuenas`, `Tanda` from Task 2; `LogEntry`, `GameMode`, `Team`, `TeamState` from Task 1; `animate-var-row-in`, `truco.sheet`, `truco.cream`, `truco.headSoft` from Task 4; `varOpen` / `setVarOpen` from Task 5
- Produces: default export `VarPanel` with props `{ open: boolean; onOpenChange: (v: boolean) => void; log: LogEntry[]; names: Record<Team, string>; mode: GameMode; team1: TeamState; team2: TeamState }`

- [ ] **Step 1: Give the drawer overlay a fade**

In `src/components/ui/drawer.tsx`, the overlay currently appears instantly while the sheet slides up. Replace its className:

```tsx
    className={cn(
      "fixed inset-0 z-50 bg-black/[.66] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
```

Also remove the hardcoded handle from `DrawerContent` — `VarPanel` draws its own, styled as a matchstick, and two handles would stack. Delete this line from `DrawerContent`:

```tsx
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
```

- [ ] **Step 2: Create the panel**

Create `src/components/VarPanel.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { X, Undo2, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import VarIcon from "@/components/icons/VarIcon";
import { agruparEnTandas, bucketDeTiempo, hitosDeBuenas, type Tanda } from "@/lib/varLog";
import type { GameMode, LogEntry, Team, TeamState } from "@/lib/gameReducer";

interface VarPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  log: LogEntry[];
  names: Record<Team, string>;
  mode: GameMode;
  team1: TeamState;
  team2: TeamState;
}

const hhmm = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

const hms = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

// El equipo se identifica por un fósforo en miniatura: el objeto que ya está
// dibujado en el tablero, no un color inventado. Nunca por la inicial del
// nombre, que el usuario puede editar y puede colisionar.
const Fosforo = ({ team, vertical = false }: { team: Team; vertical?: boolean }) => (
  <span
    aria-hidden="true"
    className={cn("block shrink-0 rounded-full", vertical ? "h-[18px] w-[5px]" : "h-[5px] w-4")}
    style={{
      background:
        team === "team1"
          ? "#FDB833"
          : `linear-gradient(${vertical ? "180deg" : "90deg"}, #F44336 0 32%, #FDB833 32% 100%)`,
    }}
  />
);

const Separador = ({ children, hito = false }: { children: React.ReactNode; hito?: boolean }) => (
  <div
    className={cn(
      "mt-3.5 mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] first:mt-0.5",
      hito ? "text-truco-stick" : "text-truco-cream/40"
    )}
  >
    <span>{children}</span>
    <span className={cn("h-px flex-1", hito ? "bg-truco-stick/40" : "bg-truco-cream/15")} />
  </div>
);

const FilaDeshacer = ({ t, nombre }: { t: Tanda; nombre: string }) => (
  <div className="mb-1.5 flex items-center gap-2 rounded-[10px] border border-dashed border-truco-cream/20 px-2.5 py-2 opacity-75">
    <Undo2 className="h-3.5 w-3.5 shrink-0 text-truco-cream/40" />
    <span className="min-w-0 text-[12.5px] italic leading-tight text-truco-cream/65">
      Se deshizo{" "}
      <span className="font-mono not-italic line-through text-truco-cream/40">
        {t.undoneType === "suma" ? "+1" : "−1"}
      </span>{" "}
      de {nombre} · queda en {t.points}
    </span>
    <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-truco-cream/40">
      {hhmm(t.hasta)}
    </span>
  </div>
);

const TarjetaTanda = ({
  t,
  nombre,
  mostrarFase,
}: {
  t: Tanda;
  nombre: string;
  mostrarFase: boolean;
}) => {
  const [abierta, setAbierta] = useState(false);
  const fase = t.stage === "buenas" ? "Buenas" : "Malas";
  const signo = t.delta > 0 ? "+" : "−";

  return (
    <div
      className={cn(
        "mb-1.5 overflow-hidden rounded-xl border-l-[3px] bg-white/[0.055] transition-colors hover:bg-white/10",
        t.team === "team1" ? "border-l-truco-stick" : "border-l-truco-head"
      )}
    >
      <button
        type="button"
        aria-expanded={abierta}
        onClick={() => setAbierta((v) => !v)}
        aria-label={`${nombre} ${t.delta > 0 ? "sumó" : "restó"} ${Math.abs(t.delta)} ${
          Math.abs(t.delta) === 1 ? "punto" : "puntos"
        }, quedó en ${t.points}${mostrarFase ? ` ${fase.toLowerCase()}` : ""}. Ver los ${
          t.items.length
        } movimientos`}
        className="flex w-full items-center gap-2.5 p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-truco-stick"
      >
        <Fosforo team={t.team} />
        <span className="max-w-[110px] truncate text-[13.5px] font-bold" title={nombre}>
          {nombre}
        </span>
        <span
          className={cn(
            "font-mono text-[15px] font-extrabold tabular-nums",
            t.delta < 0 ? "text-truco-headSoft" : "text-truco-cream"
          )}
        >
          {signo}
          {Math.abs(t.delta)}
        </span>
        <span className="flex gap-[3px]" aria-hidden="true">
          {t.items.map((x) => (
            <span
              key={x.id}
              className={cn(
                "h-[13px] w-1 rounded-sm",
                x.delta < 0
                  ? "border border-dashed border-truco-headSoft"
                  : t.team === "team1"
                    ? "bg-truco-stick/85"
                    : "bg-truco-head/85"
              )}
            />
          ))}
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[13px] font-bold tabular-nums text-truco-cream/65">
          → {t.points}
          {mostrarFase && (
            <span
              title={fase}
              className="rounded border border-truco-cream/15 px-1 py-0.5 text-[9.5px] tracking-wider text-truco-cream/45"
            >
              {fase.slice(0, 1)}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-truco-cream/40 transition-transform [transition-duration:260ms]",
            abierta && "rotate-180"
          )}
        />
      </button>

      {/* grid 0fr→1fr: anima la altura sin conocerla de antemano */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <ul className="px-2.5 pb-2.5">
            {t.items.map((x) => (
              <li
                key={x.id}
                className="flex items-center gap-2 border-t border-truco-cream/10 py-1.5 font-mono text-[11.5px] tabular-nums text-truco-cream/65"
              >
                <span className={x.delta < 0 ? "text-truco-headSoft" : "text-truco-cream"}>
                  {x.delta > 0 ? "+1" : "−1"}
                </span>
                <span className="text-truco-cream/40">→</span>
                <span>{x.points}</span>
                {mostrarFase && (
                  <span className="text-truco-cream/40">
                    {x.stage === "buenas" ? "Buenas" : "Malas"}
                  </span>
                )}
                <span className="ml-auto">{hms(x.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Vacio = ({ onClose }: { onClose: () => void }) => (
  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
    {/* un cuadro de fósforos sin usar */}
    <div className="relative mb-5 h-16 w-16 opacity-50" aria-hidden="true">
      <span className="absolute left-0 top-0 h-[3px] w-16 rounded-sm bg-truco-cream/25" />
      <span className="absolute bottom-0 left-0 h-[3px] w-16 rounded-sm bg-truco-cream/25" />
      <span className="absolute left-0 top-0 h-16 w-[3px] rounded-sm bg-truco-cream/25" />
      <span className="absolute right-0 top-0 h-16 w-[3px] rounded-sm bg-truco-cream/25" />
    </div>
    <h4 className="mb-2 text-[17px] font-bold text-truco-cream">Todavía no hay jugadas</h4>
    <p className="max-w-[26ch] text-[13px] leading-relaxed text-truco-cream/65">
      Cada punto que sumen o resten queda anotado acá, con la hora. Después no se discute.
    </p>
    <button
      type="button"
      onClick={onClose}
      className="mt-5 rounded-[10px] border border-truco-stick/50 bg-truco-stick/10 px-5 py-2.5 text-[13px] font-bold text-truco-stick transition-colors hover:bg-truco-stick/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-truco-stick"
    >
      Volver al tablero
    </button>
  </div>
);

const VarPanel = ({ open, onOpenChange, log, names, mode, team1, team2 }: VarPanelProps) => {
  const mostrarFase = mode === 30;

  // El "ahora" se fija al abrir: si se recalculara en cada render, los
  // separadores de tiempo saltarían mientras el panel está abierto.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (open) setAhora(Date.now());
  }, [open]);

  const tandas = useMemo(() => agruparEnTandas(log).reverse(), [log]);
  const hitos = useMemo(() => hitosDeBuenas(log, mode), [log, mode]);

  const filas: React.ReactNode[] = [];
  let bucketPrevio: number | null = null;
  tandas.forEach((t, i) => {
    const b = bucketDeTiempo(t.hasta, ahora);
    if (b.k !== bucketPrevio) {
      bucketPrevio = b.k;
      filas.push(<Separador key={`sep-${t.id}`}>{b.label}</Separador>);
    }
    const hito = t.items.find((x) => hitos[x.id]);
    if (hito) {
      filas.push(
        <Separador key={`hito-${t.id}`} hito>
          ▸ {names[hitos[hito.id]]} pasó a las buenas
        </Separador>
      );
    }
    filas.push(
      <div
        key={t.id}
        className="motion-safe:animate-var-row-in"
        style={{ animationDelay: `${Math.min(i * 24, 260)}ms` }}
      >
        {t.tipo === "deshacer" ? (
          <FilaDeshacer t={t} nombre={names[t.team]} />
        ) : (
          <TarjetaTanda t={t} nombre={names[t.team]} mostrarFase={mostrarFase} />
        )}
      </div>
    );
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="h-[72%] rounded-t-[22px] border-x border-t-2 border-x-truco-stick/35 border-t-truco-stick bg-truco-sheet text-truco-cream">
        {/* handle: un fósforo horizontal */}
        <div className="flex shrink-0 justify-center pb-1 pt-2.5" aria-hidden="true">
          <span
            className="h-[5px] w-12 rounded-full"
            style={{ background: "linear-gradient(90deg, #F44336 0 18%, rgba(253,184,51,.75) 18% 100%)" }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2.5 px-4">
          <DrawerTitle className="text-[19px] font-extrabold tracking-wide text-truco-cream">
            HISTORIAL
          </DrawerTitle>
          <span className="rounded bg-truco-head px-1.5 py-1 font-mono text-[10px] font-extrabold tracking-widest text-white">
            VAR
          </span>
          <span className="font-mono text-[11.5px] text-truco-cream/40">
            {log.length} {log.length === 1 ? "jugada" : "jugadas"}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar el VAR"
            className="ml-auto grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-truco-cream/65 transition-colors hover:bg-white/10 hover:text-truco-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-truco-stick"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        </div>

        <DrawerDescription className="sr-only">
          Historial de solo lectura de los puntos sumados, restados y deshechos en la partida.
        </DrawerDescription>

        <div
          role="list"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
        >
          {log.length === 0 ? <Vacio onClose={() => onOpenChange(false)} /> : filas}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default VarPanel;
```

Note: the `Resumen` tab is deliberately absent here. Task 7 adds it, so this task lands a panel that already works.

- [ ] **Step 3: Mount it**

In `src/components/MatchCounter.tsx`, import it:

```ts
import VarPanel from "@/components/VarPanel";
```

Render it just before the settings `<Dialog>` near the end of the JSX:

```tsx
      <VarPanel
        open={varOpen}
        onOpenChange={setVarOpen}
        log={state.log}
        names={state.names}
        mode={state.mode}
        team1={state.team1}
        team2={state.team2}
      />
```

`team1` and `team2` are unused until Task 7; passing them now keeps the prop contract stable across both tasks.

- [ ] **Step 4: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify by hand**

Run: `npm run dev`

1. Add 3 points to team 1 in quick succession, then 2 to team 2, then press undo.
2. Open the VAR. The sheet slides up over a blurred, dimmed board; the overlay fades rather than snapping in.
3. The three quick points show as **one** card reading `+3 → 3` with three gold pips. Team 2's two points are a second card with red-headed matchstick and red pips.
4. The undo shows as a separate dashed, dimmed row reading "Se deshizo +1 de …".
5. Tap a card — it expands smoothly to per-move rows with `hh:mm:ss`. Tap again to collapse. The chevron rotates.
6. Drag the handle down: the sheet follows your finger and closes.
7. Press Escape: it closes. Focus returns to the VAR button.
8. Press "Reiniciar partida", reopen the VAR: the empty state shows with the matchstick square.
9. Switch to mode 15 in Configuración, add points, open the VAR: **no** `M`/`B` chips anywhere.
10. Rename a team to "Los Pibes de la Esquina Verde" and confirm the name truncates with an ellipsis instead of breaking the row.
11. In DevTools, enable "Emulate CSS prefers-reduced-motion: reduce". Reopen — no slide, no stagger.

- [ ] **Step 6: Commit**

```bash
git add src/components/VarPanel.tsx src/components/MatchCounter.tsx src/components/ui/drawer.tsx
git commit -m "feat(var): panel de historial con las jugadas agrupadas en tandas

Bottom sheet con vaul. El equipo se identifica por fosforo en miniatura y
nombre completo, nunca por la inicial. Suma el fade que le faltaba al
overlay del Drawer.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The Resumen view

**Files:**
- Modify: `src/components/VarPanel.tsx`

**Interfaces:**
- Consumes: everything from Task 6
- Produces: no new exports; `VarPanel` gains an internal `vista` state toggling `"movimientos"` / `"resumen"`

- [ ] **Step 1: Add the stats helper**

In `src/components/VarPanel.tsx`, above the `VarPanel` component:

```tsx
interface Stats {
  sumas: number;
  restas: number;
  mejorRacha: number;
  total: number;
}

// Cuenta por equipo. La mejor racha son sumas consecutivas sin que el rival
// anote en el medio; los deshacer no cortan la racha, solo corrigen.
const statsDe = (log: LogEntry[], team: Team): Stats => {
  const propias = log.filter((e) => e.team === team);
  let mejorRacha = 0;
  let actual = 0;
  for (const e of log) {
    if (e.type === "deshacer") continue;
    if (e.team === team && e.type === "suma") {
      actual += 1;
      mejorRacha = Math.max(mejorRacha, actual);
    } else if (e.team !== team) {
      actual = 0;
    }
  }
  return {
    sumas: propias.filter((e) => e.type === "suma").length,
    restas: propias.filter((e) => e.type === "resta").length,
    mejorRacha,
    total: propias.length,
  };
};

// En "a 30" las buenas suman 15 a la fase previa.
const puntosTotales = (t: TeamState, mode: GameMode): number =>
  mode === 30 && t.stage === "buenas" ? 15 + t.points : t.points;

const TarjetaResumen = ({
  team,
  nombre,
  estado,
  stats,
  mode,
}: {
  team: Team;
  nombre: string;
  estado: TeamState;
  stats: Stats;
  mode: GameMode;
}) => (
  <div
    className={cn(
      "mb-2.5 rounded-2xl border-t-2 bg-white/[0.055] p-3.5",
      team === "team1" ? "border-t-truco-stick" : "border-t-truco-head"
    )}
  >
    <div className="mb-3 flex items-center gap-2.5">
      <Fosforo team={team} vertical />
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold" title={nombre}>
        {nombre}
      </span>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-mono text-[26px] font-extrabold leading-none tabular-nums">
          {puntosTotales(estado, mode)}
        </span>
        {mode === 30 && (
          <span className="font-mono text-[9.5px] uppercase tracking-widest text-truco-cream/40">
            {estado.stage === "buenas" ? "Buenas" : "Malas"}
          </span>
        )}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {([
        ["Sumas", stats.sumas, false],
        ["Restas", stats.restas, true],
        ["Mejor racha", stats.mejorRacha, false],
      ] as const).map(([k, n, neg]) => (
        <div key={k} className="rounded-[9px] bg-black/25 px-2 py-2.5 text-center">
          <span
            className={cn(
              "block font-mono text-[19px] font-extrabold leading-none tabular-nums",
              neg && n > 0 && "text-truco-headSoft"
            )}
          >
            {n}
          </span>
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-widest text-truco-cream/40">
            {k}
          </span>
        </div>
      ))}
    </div>
  </div>
);
```

- [ ] **Step 2: Add the view state and the tabs**

Inside `VarPanel`, next to the `mostrarFase` line:

```tsx
  const [vista, setVista] = useState<"movimientos" | "resumen">("movimientos");
```

Add the segmented control right below the header row (after the closing `</div>` of the title row, before `DrawerDescription`):

```tsx
        <div
          role="tablist"
          aria-label="Vista del historial"
          className="relative mx-4 mt-3 flex shrink-0 rounded-[11px] border border-truco-cream/15 bg-black/35 p-[3px]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-lg bg-truco-stick transition-transform [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
              vista === "resumen" && "translate-x-full"
            )}
          />
          {(["movimientos", "resumen"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setVista(vista === "movimientos" ? "resumen" : "movimientos");
                }
              }}
              className={cn(
                "relative z-10 flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-truco-cream",
                vista === v ? "text-[#1A1206]" : "text-truco-cream/65"
              )}
            >
              {v === "movimientos" ? "Movimientos" : "Resumen"}
            </button>
          ))}
        </div>
```

- [ ] **Step 3: Render the chosen view**

Replace the scrollable body's children:

```tsx
          {log.length === 0 ? (
            <Vacio onClose={() => onOpenChange(false)} />
          ) : vista === "movimientos" ? (
            filas
          ) : (
            <div className="motion-safe:animate-var-row-in">
              <TarjetaResumen
                team="team1"
                nombre={names.team1}
                estado={team1}
                stats={statsDe(log, "team1")}
                mode={mode}
              />
              <TarjetaResumen
                team="team2"
                nombre={names.team2}
                estado={team2}
                stats={statsDe(log, "team2")}
                mode={mode}
              />
              <div className="rounded-2xl bg-white/[0.055] p-3.5">
                <div className="flex h-2 overflow-hidden rounded-full bg-black/30">
                  <span
                    className="block bg-truco-stick transition-[width] duration-500"
                    style={{ width: `${reparto.pct1}%` }}
                  />
                  <span
                    className="block bg-truco-head transition-[width] duration-500"
                    style={{ width: `${100 - reparto.pct1}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-truco-cream/40">
                  <span className="max-w-[45%] truncate">
                    {names.team1} · {reparto.t1}
                  </span>
                  <span className="max-w-[45%] truncate">
                    {reparto.t2} · {names.team2}
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t border-truco-cream/15 pt-2.5 font-mono text-[11px] text-truco-cream/40">
                  <span>
                    {log.length} movimientos
                    <br />
                    <span className="text-truco-cream/65">{reparto.deshechos} deshechos</span>
                  </span>
                  <span className="text-right">
                    {reparto.minutos} min de partida
                    <br />
                    <span className="text-truco-cream/65">
                      {hhmm(log[0].at)} – {hhmm(log[log.length - 1].at)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
```

And add `reparto` next to the other `useMemo` calls in `VarPanel`:

```tsx
  const reparto = useMemo(() => {
    const t1 = log.filter((e) => e.team === "team1").length;
    const t2 = log.filter((e) => e.team === "team2").length;
    const total = t1 + t2 || 1;
    return {
      t1,
      t2,
      pct1: Math.round((t1 / total) * 100),
      deshechos: log.filter((e) => e.type === "deshacer").length,
      minutos: log.length
        ? Math.max(1, Math.round((log[log.length - 1].at - log[0].at) / 60_000))
        : 0,
    };
  }, [log]);
```

- [ ] **Step 4: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify by hand**

Run: `npm run dev`

1. Play a game to roughly 8–3 with at least one subtraction and one undo, then open the VAR.
2. Tap "Resumen". The gold thumb slides right, the view fades in.
3. Each team card shows its current total (in mode 30 with a team in buenas, the total includes the 15 — a team at 2 in buenas reads **17**, not 2), plus Sumas / Restas / Mejor racha.
4. The participation bar's gold and red segments roughly match each team's share of the moves.
5. Focus a tab and press ← / →: the view switches.
6. Tap "Movimientos" and confirm you return to the list with the same scroll behavior.
7. In mode 15, the "Malas"/"Buenas" line under the score does not render.

- [ ] **Step 6: Commit**

```bash
git add src/components/VarPanel.tsx
git commit -m "feat(var): vista Resumen con sumas, restas y mejor racha

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Phase band under the team name

**Files:**
- Create: `src/components/PhaseBand.tsx`
- Modify: `src/components/MatchCounter.tsx`

**Interfaces:**
- Consumes: `animate-band-wipe`, `animate-band-shine`, `animate-stage-pop` from Task 4
- Produces: default export `PhaseBand` with props `{ stage: Stage; side: Team; flash: boolean; onFlashEnd: () => void }`

- [ ] **Step 1: Create the band**

Create `src/components/PhaseBand.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { Stage, Team } from "@/lib/gameReducer";

interface PhaseBandProps {
  stage: Stage;
  side: Team;
  /** Dispara el barrido y el brillo al pasar de malas a buenas. */
  flash: boolean;
  onFlashEnd: () => void;
}

// Banda de fase debajo del nombre. Teñida al 15 %, no dorado macizo: el oro
// pleno compite con los fósforos, que son el corazón visual del tablero.
const PhaseBand = ({ stage, side, flash, onFlashEnd }: PhaseBandProps) => {
  const buenas = stage === "buenas";

  return (
    <div
      className={cn(
        "relative flex h-6 w-full items-center justify-center overflow-hidden",
        "text-[10px] font-bold uppercase tracking-[0.22em] transition-colors duration-300",
        // Costura de verde alineada con el divisor: sin esto las dos bandas se
        // leen como una sola barra cuando ambos equipos están en la misma fase.
        side === "team1" ? "border-r-2 border-truco-green" : "border-l-2 border-truco-green",
        buenas
          ? "bg-truco-stick/15 text-truco-stick shadow-[inset_0_-2px_0_0_#FDB833]"
          : "bg-white/[0.06] text-white/60"
      )}
    >
      {flash && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-center bg-truco-stick/15 motion-safe:animate-band-wipe"
          />
          <span
            aria-hidden="true"
            onAnimationEnd={onFlashEnd}
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[38%] bg-gradient-to-r from-transparent via-white/55 to-transparent motion-safe:animate-band-shine"
          />
        </>
      )}
      <span className="relative z-10">{buenas ? "Buenas" : "Malas"}</span>
    </div>
  );
};

export default PhaseBand;
```

- [ ] **Step 2: Track which team just crossed**

In `src/components/MatchCounter.tsx`, import it and add state:

```ts
import PhaseBand from "@/components/PhaseBand";
```
```ts
  const [flashTeam, setFlashTeam] = useState<Team | null>(null);
```

The effect that already detects malas → buenas (the one with `prevStages`) also triggers the flash. Add one line inside its `forEach` body, right after the existing `toast(...)`:

```ts
      if (prevStages.current[t] === "malas" && stages[t] === "buenas") {
        toast(`¡${names[t]} pasó a las buenas!`, { position: "top-center" });
        setFlashTeam(t);
        if (feedbackEnabled) {
          playBuenas();
          vibrate(80);
        }
      }
```

- [ ] **Step 3: Restructure the header**

Replace the whole header block. The phase leaves the `<h2>` and becomes the band; `stageLabel` is deleted along with it.

Delete this helper:

```ts
  // El rótulo malas/buenas solo aplica al modo a 30.
  const stageLabel = (team: Team) =>
    state.mode === 30 ? (state[team].stage === "buenas" ? " (Buenas)" : " (Malas)") : "";
```

Replace the header JSX with:

```tsx
      {/* Header - nombres de cada equipo + banda de fase */}
      <div className="flex shrink-0 animate-fade-in">
        {(["team1", "team2"] as Team[]).map((team) => (
          <div key={team} className="flex w-1/2 min-w-0 flex-col">
            <div className="flex min-w-0 justify-center px-2 pb-2 pt-3">
              {editingTeam === team ? (
                <input
                  autoFocus
                  value={state.names[team]}
                  maxLength={20}
                  aria-label="Editar nombre del equipo"
                  onChange={(e) => dispatch({ type: "setName", team, name: e.target.value })}
                  onBlur={() => finishEditing(team)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
                  }}
                  className="w-full max-w-[12rem] rounded-md border border-white/40 bg-white/15 px-2 py-0.5 text-center text-lg font-semibold text-white outline-none focus:border-white/80 sm:text-xl md:text-2xl"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTeam(team)}
                  aria-label={`Editar nombre: ${state.names[team]}`}
                  className="group flex max-w-full items-center gap-1.5 px-1"
                >
                  <h2
                    className={cn(
                      "truncate text-center text-lg font-semibold transition-all duration-300 sm:text-xl md:text-2xl",
                      state[team].stage === "buenas" && state.mode === 30
                        ? "text-yellow-200"
                        : "text-white",
                      flashTeam === team && "motion-safe:animate-stage-pop"
                    )}
                  >
                    {state.names[team]}
                  </h2>
                  <Pencil className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white/80" />
                </button>
              )}
            </div>

            {/* La fase solo existe en el modo a 30 */}
            {state.mode === 30 && (
              <PhaseBand
                stage={state[team].stage}
                side={team}
                flash={flashTeam === team}
                onFlashEnd={() => setFlashTeam(null)}
              />
            )}
          </div>
        ))}
      </div>
```

- [ ] **Step 4: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed. If the build complains that `stageLabel` is undefined, a reference was left behind — search for it and remove it.

- [ ] **Step 5: Verify by hand**

Run: `npm run dev`

1. In mode 30, each name has a thin band under it reading "MALAS", with a 2px green seam splitting the two bands down the middle — they must not read as one bar.
2. Tap one team 16 times. On the 16th, the band sweeps, a highlight passes across it, the name pulses once, and the band settles into the tinted gold "BUENAS" with a solid gold underline.
3. The name in buenas is `yellow-200` and clearly readable against the green.
4. Switch to mode 15: **no band at all**, and the header is correspondingly shorter.
5. Tap a name — editing still works, and the input does not overlap the band.
6. Set a 20-character name and confirm it truncates rather than pushing the band around.
7. Enable reduced motion: crossing to buenas changes the band with no sweep or shine.

- [ ] **Step 6: Commit**

```bash
git add src/components/PhaseBand.tsx src/components/MatchCounter.tsx
git commit -m "feat(juego): la fase pasa a una banda debajo del nombre

Teñida al 15 % para no competir con el oro de los fosforos, con costura
verde para que las dos bandas no se lean como una sola barra. En modo a
15 no se renderiza.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: The gold rules

**Files:**
- Modify: `src/components/MatchCounter.tsx`

**Interfaces:**
- Consumes: `animate-rule-draw`, `animate-rule-draw-y` from Task 4; the header from Task 8

- [ ] **Step 1: Add both horizontal rules**

In `src/components/MatchCounter.tsx` the top rule goes immediately after the header block, and the bottom rule becomes the **last flex child** — after the board wrapper, before the `{gameEnded && …}` overlay, which is absolutely positioned and therefore outside the flow.

Insert this line directly after the header block's closing `</div>` and directly before the existing `{/* Game Board */}` comment. Do not touch the board wrapper itself:

```tsx
      {/* Raya superior — cierra el marco contra el divisor vertical */}
      <div className="h-1 w-full shrink-0 origin-center bg-truco-stick shadow-[0_0_10px_rgba(253,184,51,0.35)] motion-safe:animate-rule-draw" />
```

Insert this line directly after the board wrapper's closing `</div>` (the one that closes `<div className="flex-1 overflow-hidden">`) and directly before the `{/* Overlay for game ended */}` comment:

```tsx
      {/* Raya inferior — al expandirse el pie, el flex-1 del tablero se achica y
          esta raya sube pegada al borde del pie. No hace falta código. */}
      <div className="h-1 w-full shrink-0 origin-center bg-truco-stick shadow-[0_0_10px_rgba(253,184,51,0.35)] motion-safe:animate-rule-draw" />
```

`shrink-0` is not optional: without it the board's `flex-1` compresses the rules to about 3px.

- [ ] **Step 2: Animate the vertical divider**

The center divider already exists inside the board. Add the draw animation so all three strokes appear together:

```tsx
          {/* Center divider */}
          <div className="w-1 origin-center bg-truco-stick shadow-lg motion-safe:animate-rule-draw-y" />
```

- [ ] **Step 3: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Verify by hand**

Run: `npm run dev`

1. On load, the two horizontal rules draw outward from the center and the vertical one draws down 120ms later.
2. The vertical divider **touches** both horizontal rules — the board reads as a closed rectangle with no gap at the corners.
3. All three strokes are the same gold and the same 4px weight.
4. On a 375×667 viewport (iPhone SE in device toolbar), the board still fits a full matchstick square without clipping.
5. Tap "Más info ↓" in the footer. The footer grows and **the bottom rule rides up with it**, staying flush against the footer's top edge. Collapse it and the rule comes back down.
6. Resize to desktop width: the rules go edge to edge and still line up with the divider.

- [ ] **Step 5: Commit**

```bash
git add src/components/MatchCounter.tsx
git commit -m "feat(juego): rayas doradas que cierran el marco del tablero

Dos rayas horizontales del mismo color y grosor que el divisor central.
La de abajo es el ultimo hijo flex, asi que sigue al pie cuando se
expande.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Footer — drop the border, animate the expansion

**Files:**
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: the bottom rule from Task 9

- [ ] **Step 1: Remove the competing border**

In `src/components/Footer.tsx`, the `<footer>` element carries `border-t border-white/20`. With the gold rule directly above it, that stacks a 1px white line under a 4px gold one. The gold rule becomes the only separator:

```tsx
    <footer className="w-full bg-truco-green py-2 px-3 text-white text-xs">
```

- [ ] **Step 2: Animate the mobile expansion**

The mobile block currently swaps between two JSX trees with no transition. Replace the whole `<div className="md:hidden">` block with a version where both parts always render and the expandable part animates its height with the same `0fr → 1fr` grid technique used by the VAR cards, so the gesture feels identical across the app:

```tsx
      {/* Versión móvil colapsada */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-xs">
            © {currentYear} Anotador de Truco
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-white/60 text-xs"
          >
            {expanded ? "Mostrar menos ↑" : "Más info ↓"}
          </button>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows] [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="mb-2">
                <h3 className="font-semibold text-sm mb-1">Sobre el Truco</h3>
                <ul className="space-y-1 text-white/80">
                  <li><Link to="/reglas-del-truco" className="hover:text-white">Reglas del Truco</Link></li>
                  <li><Link to="/valores-del-envido" className="hover:text-white">Valores del Envido</Link></li>
                  <li><Link to="/senas-del-truco" className="hover:text-white">Señas del Truco</Link></li>
                  <li><Link to="/como-anotar-los-puntos-del-truco" className="hover:text-white">Cómo anotar los puntos</Link></li>
                  <li><Link to="/blog" className="hover:text-white">Blog sobre Truco</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">Enlaces útiles</h3>
                <ul className="space-y-1 text-white/80">
                  <li>
                    <a
                      href="https://github.com/axelmvt/anotador-truco"
                      className="flex items-center hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-3 w-3 mr-1" />
                      <span>Código fuente</span>
                    </a>
                  </li>
                  <li><a href="mailto:info@mvt.ar" className="hover:text-white">Contacto</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
```

Add the `cn` import at the top of the file:

```ts
import { cn } from "@/lib/utils";
```

Note the collapsed links stay in the DOM. That is deliberate: it keeps them crawlable, which is the point of the SEO pages they link to.

- [ ] **Step 3: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Verify by hand**

Run: `npm run dev`, in the device toolbar at 375×667

1. Only the gold rule separates the board from the footer — no thin white line beneath it.
2. Tap "Más info ↓": the footer grows smoothly over ~260ms, the label flips to "Mostrar menos ↑", and the gold rule rides up in step with it.
3. Tap again: it collapses just as smoothly.
4. With the footer collapsed, "Reglas del Truco" is not visible on screen but **is** present in the DOM (check via Inspect).
5. At desktop width the full footer renders as before, with the gold rule above it.
6. Enable reduced motion: the expansion is instant, not animated.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "fix(ui): el pie no compite con la raya dorada y se expande animado

Sale el border-t, que apilaba una linea blanca debajo de la dorada. La
expansion en mobile usa el mismo grid 0fr->1fr que las tarjetas del VAR.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Desktop — centered two-column dialog

**Files:**
- Modify: `src/components/VarPanel.tsx`

**Interfaces:**
- Consumes: everything from Tasks 6 and 7. Only touches `VarPanel`, so it can be done any time after Task 7.

The spec calls for the bottom sheet to become a centered dialog above `md`, with the list on the left and Resumen as a permanent sidebar instead of an alternate view. A full-height sheet on a 1400px screen wastes the space, and on desktop there is no thumb to reach.

- [ ] **Step 1: Extract the two views**

In `src/components/VarPanel.tsx`, the list and the summary are currently built inline. Pull them into two local components declared just above `VarPanel`, so both the sheet and the dialog render the same thing:

```tsx
const ListaMovimientos = ({ filas }: { filas: React.ReactNode[] }) => <>{filas}</>;
```

For the summary, move the entire `<div className="motion-safe:animate-var-row-in">…</div>` block from Task 7 Step 3 into:

```tsx
const VistaResumen = ({
  log,
  names,
  mode,
  team1,
  team2,
  reparto,
}: {
  log: LogEntry[];
  names: Record<Team, string>;
  mode: GameMode;
  team1: TeamState;
  team2: TeamState;
  reparto: { t1: number; t2: number; pct1: number; deshechos: number; minutos: number };
}) => (
  /* … el mismo JSX que ya está en la rama vista === "resumen" … */
);
```

Then the mobile body becomes:

```tsx
          {log.length === 0 ? (
            <Vacio onClose={() => onOpenChange(false)} />
          ) : vista === "movimientos" ? (
            <ListaMovimientos filas={filas} />
          ) : (
            <VistaResumen {...{ log, names, mode, team1, team2, reparto }} />
          )}
```

- [ ] **Step 2: Detect the breakpoint**

The repo already ships `src/hooks/use-mobile.tsx`. Use it rather than adding a second implementation:

```ts
import { useIsMobile } from "@/hooks/use-mobile";
```

Inside `VarPanel`:

```tsx
  const isMobile = useIsMobile();
```

`use-mobile` reads `window.matchMedia`, so confirm it guards against SSR before relying on it. `VarPanel` only ever renders inside `<ClientOnly>`, so prerender is not a concern here, but the hook returns `undefined` on its first render — treat any non-`true` value as desktop.

- [ ] **Step 3: Render a Dialog above md**

Import the dialog primitives already used by the settings panel:

```ts
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
```

Wrap the return so the sheet is mobile-only and the dialog is the desktop path. The dialog has no tabs: Resumen is a sidebar, always visible.

```tsx
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl gap-0 border-truco-stick/35 border-t-2 border-t-truco-stick bg-truco-sheet p-0 text-truco-cream">
          <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 px-5 pb-3 pt-5">
            <DialogTitle className="text-[19px] font-extrabold tracking-wide text-truco-cream">
              HISTORIAL
            </DialogTitle>
            <span className="rounded bg-truco-head px-1.5 py-1 font-mono text-[10px] font-extrabold tracking-widest text-white">
              VAR
            </span>
            <span className="font-mono text-[11.5px] text-truco-cream/40">
              {log.length} {log.length === 1 ? "jugada" : "jugadas"}
            </span>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Historial de solo lectura de los puntos sumados, restados y deshechos en la partida.
          </DialogDescription>

          {log.length === 0 ? (
            <div className="h-[380px]">
              <Vacio onClose={() => onOpenChange(false)} />
            </div>
          ) : (
            <div className="grid h-[440px] grid-cols-[1fr_300px]">
              <div role="list" className="min-h-0 overflow-y-auto px-5 pb-5">
                <ListaMovimientos filas={filas} />
              </div>
              <div className="min-h-0 overflow-y-auto border-l border-truco-cream/15 bg-black/15 px-4 pb-5">
                <p className="mb-3 mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-truco-cream/40">
                  Resumen
                </p>
                <VistaResumen {...{ log, names, mode, team1, team2, reparto }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
```

The existing `Drawer` return stays as the mobile branch below this.

- [ ] **Step 4: Verify build**

Run: `npm run lint && npx tsc -p tsconfig.app.json --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify by hand**

Run: `npm run dev`

1. At a desktop width, open the VAR: a centered dialog appears with the shadcn zoom-and-fade, not a bottom sheet.
2. The list is on the left, Resumen is a permanent right-hand column. There is **no** Movimientos/Resumen toggle.
3. Both columns scroll independently; neither makes the page scroll sideways.
4. Escape closes it and focus returns to the VAR button.
5. Narrow the window below `md` with the panel closed, reopen: you get the bottom sheet with the toggle back.
6. Resize from desktop to mobile **while the panel is open** and confirm it does not crash — it swaps container.
7. With an empty log at desktop width, the empty state fills the dialog without collapsing its height.

- [ ] **Step 6: Commit**

```bash
git add src/components/VarPanel.tsx
git commit -m "feat(var): dialogo centrado a dos columnas en desktop

Arriba de md el bottom sheet pasa a dialogo y el Resumen deja de ser una
vista alternativa para ser barra lateral fija.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

After Task 10, before opening a PR:

- [ ] `npm test` — all reducer and varLog tests pass
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds, prerender included
- [ ] `npm run preview` — open the built app and replay a full game to 30 with subtractions and undos, checking the VAR at several points
- [ ] Lighthouse accessibility pass on `/` with the VAR panel open
- [ ] Confirm `git log --oneline main..feat/var-historial` reads as a clean, reviewable sequence
