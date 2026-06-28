import { describe, it, expect } from "vitest";
import {
  gameReducer,
  createInitialState,
  getSquaresForTeam,
  type GameState,
} from "./gameReducer";

// Aplica una lista de acciones en secuencia partiendo de un estado.
const run = (state: GameState, actions: Parameters<typeof gameReducer>[1][]) =>
  actions.reduce(gameReducer, state);

const inc = (team: "team1" | "team2", times: number) =>
  Array.from({ length: times }, () => ({ type: "increment", team }) as const);

describe("modo largo (a 30)", () => {
  const initial = createInitialState(30);

  it("15 incrementos dejan a malas en 15 sin pasar a buenas ni ganar", () => {
    const s = run(initial, inc("team1", 15));
    expect(s.team1).toEqual({ points: 15, stage: "malas" });
    expect(s.winner).toBeNull();
  });

  it("el incremento 16 pasa a buenas con 1 punto", () => {
    const s = run(initial, inc("team1", 16));
    expect(s.team1).toEqual({ points: 1, stage: "buenas" });
    expect(s.winner).toBeNull();
  });

  it("se gana al completar buenas (30 toques en total)", () => {
    const s = run(initial, inc("team1", 30));
    expect(s.team1).toEqual({ points: 15, stage: "buenas" });
    expect(s.winner).toBe("team1");
  });

  it("decrementar en {1, buenas} vuelve a {15, malas} y es reversible", () => {
    const enBuenas = run(initial, inc("team1", 16));
    const back = gameReducer(enBuenas, { type: "decrement", team: "team1" });
    expect(back.team1).toEqual({ points: 15, stage: "malas" });
    const forward = gameReducer(back, { type: "increment", team: "team1" });
    expect(forward.team1).toEqual({ points: 1, stage: "buenas" });
  });
});

describe("modo corto (a 15)", () => {
  const initial = createInitialState(15);

  it("siempre en malas y gana al llegar a 15", () => {
    const s = run(initial, inc("team1", 15));
    expect(s.team1).toEqual({ points: 15, stage: "malas" });
    expect(s.winner).toBe("team1");
  });

  it("no pasa a buenas", () => {
    const s = run(initial, inc("team1", 10));
    expect(s.team1.stage).toBe("malas");
  });
});

describe("reglas comunes", () => {
  it("decrementar en {0, malas} no baja de cero", () => {
    const s = gameReducer(createInitialState(30), { type: "decrement", team: "team1" });
    expect(s.team1).toEqual({ points: 0, stage: "malas" });
  });

  it("no se puede incrementar tras ganar", () => {
    const won = run(createInitialState(15), inc("team1", 15));
    const after = gameReducer(won, { type: "increment", team: "team1" });
    expect(after).toEqual(won);
  });

  it("deshacer restaura el estado previo y reabre la partida", () => {
    const won = run(createInitialState(15), inc("team1", 15));
    expect(won.winner).toBe("team1");
    const undone = gameReducer(won, { type: "undo" });
    expect(undone.team1).toEqual({ points: 14, stage: "malas" });
    expect(undone.winner).toBeNull();
  });

  it("deshacer sin historial es no-op", () => {
    const initial = createInitialState(30);
    expect(gameReducer(initial, { type: "undo" })).toEqual(initial);
  });

  it("reset vuelve al inicio conservando modo y nombres", () => {
    const s = run(createInitialState(30, { team1: "Los Pibes", team2: "Los Viejos" }), inc("team1", 5));
    const r = gameReducer(s, { type: "reset" });
    expect(r.team1).toEqual({ points: 0, stage: "malas" });
    expect(r.names).toEqual({ team1: "Los Pibes", team2: "Los Viejos" });
    expect(r.mode).toBe(30);
  });

  it("setMode reinicia el tanteador conservando nombres", () => {
    const s = run(createInitialState(30, { team1: "A", team2: "B" }), inc("team1", 8));
    const m = gameReducer(s, { type: "setMode", mode: 15 });
    expect(m.mode).toBe(15);
    expect(m.team1.points).toBe(0);
    expect(m.names.team1).toBe("A");
  });

  it("setName actualiza solo el equipo indicado", () => {
    const s = gameReducer(createInitialState(30), { type: "setName", team: "team1", name: "Nosotros 💪" });
    expect(s.names.team1).toBe("Nosotros 💪");
    expect(s.names.team2).toBe("Ellos");
  });
});

describe("getSquaresForTeam", () => {
  it.each([
    [0, []],
    [3, [3]],
    [5, [5]],
    [7, [5, 2]],
    [15, [5, 5, 5]],
  ])("puntos=%i => %j", (points, expected) => {
    expect(getSquaresForTeam(points)).toEqual(expected);
  });
});
