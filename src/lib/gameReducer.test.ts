import { describe, it, expect, beforeEach } from "vitest";
import {
  gameReducer,
  createInitialState,
  getSquaresForTeam,
  MAX_LOG,
  type GameState,
} from "./gameReducer";

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
    const back = gameReducer(enBuenas, { type: "decrement", team: "team1", at: tick() });
    expect(back.team1).toEqual({ points: 15, stage: "malas" });
    const forward = gameReducer(back, { type: "increment", team: "team1", at: tick() });
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
    const s = gameReducer(createInitialState(30), { type: "decrement", team: "team1", at: tick() });
    expect(s.team1).toEqual({ points: 0, stage: "malas" });
  });

  it("no se puede incrementar tras ganar", () => {
    const won = run(createInitialState(15), inc("team1", 15));
    const after = gameReducer(won, { type: "increment", team: "team1", at: tick() });
    expect(after).toEqual(won);
  });

  it("deshacer restaura el estado previo y reabre la partida", () => {
    const won = run(createInitialState(15), inc("team1", 15));
    expect(won.winner).toBe("team1");
    const undone = gameReducer(won, { type: "undo", at: tick() });
    expect(undone.team1).toEqual({ points: 14, stage: "malas" });
    expect(undone.winner).toBeNull();
  });

  it("deshacer sin historial es no-op", () => {
    const initial = createInitialState(30);
    expect(gameReducer(initial, { type: "undo", at: tick() })).toEqual(initial);
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

  it("deshacer el salto malas->buenas registra undoneType 'suma' y vuelve a {15, malas}", () => {
    // points a secas bajaría de 1 a 15 acá: si jugadaRevertida comparara solo
    // points en vez del total con fase, confundiría la dirección del cambio.
    const s = run(createInitialState(30), inc("team1", 16)); // team1: {1, buenas}
    const undone = gameReducer(s, { type: "undo", at: tick() });
    const ultima = undone.log[undone.log.length - 1];
    expect(ultima.type).toBe("deshacer");
    expect(ultima.undoneType).toBe("suma");
    expect(undone.team1).toEqual({ points: 15, stage: "malas" });
  });

  it("deshacer la resta buenas->malas registra undoneType 'resta'", () => {
    const enBuenas = run(createInitialState(30), inc("team1", 16)); // {1, buenas}
    const bajado = gameReducer(enBuenas, { type: "decrement", team: "team1", at: tick() }); // {15, malas}
    const undone = gameReducer(bajado, { type: "undo", at: tick() });
    const ultima = undone.log[undone.log.length - 1];
    expect(ultima.type).toBe("deshacer");
    expect(ultima.undoneType).toBe("resta");
    expect(undone.team1).toEqual({ points: 1, stage: "buenas" });
  });

  it("un deshacer legítimo escribe entrada aunque su jugada haya sido expulsada del log", () => {
    // 3 sumas reales, después ~100 ciclos de suma+deshacer inmediato sobre el
    // mismo equipo. Cada ciclo neto no mueve el marcador ni `history` (empuja
    // y desapila la misma snapshot), pero sí agrega 2 entradas al log. Con
    // MAX_LOG=200, los 200 ciclos expulsan las 3 sumas originales del log,
    // aunque siguen vivas en `history`. Un cuarto undo "real" (no pareado con
    // ningún redo) tiene que poder reconstruir esa jugada igual, comparando
    // el snapshot contra el estado actual en vez de escanear el log.
    let s = run(createInitialState(30), inc("team1", 3)); // team1: {3, malas}
    for (let i = 0; i < 100; i++) {
      s = gameReducer(s, { type: "increment", team: "team1", at: tick() });
      s = gameReducer(s, { type: "undo", at: tick() });
    }
    expect(s.team1).toEqual({ points: 3, stage: "malas" }); // los ciclos no movieron el marcador
    expect(s.log).toHaveLength(MAX_LOG); // el log se llenó y recortó
    expect(s.log.some((e) => e.points === 1 || e.points === 2)).toBe(false); // las sumas originales, expulsadas
    const nextLogIdPrevio = s.nextLogId;

    const atFinal = tick();
    const final = gameReducer(s, { type: "undo", at: atFinal });
    expect(final.team1).toEqual({ points: 2, stage: "malas" }); // el undo sí surtió efecto
    // Estas dos aserciones son las que de verdad detectan el bug: si no se
    // escribió nada, la última entrada sigue siendo la del último ciclo (un
    // "deshacer" viejo, coincidentemente también de tipo "suma") con su
    // timestamp e id de antes, no uno nuevo con `atFinal`.
    expect(final.nextLogId).toBe(nextLogIdPrevio + 1);
    const ultima = final.log[final.log.length - 1];
    expect(ultima.at).toBe(atFinal);
    expect(ultima.type).toBe("deshacer");
    expect(ultima.undoneType).toBe("suma");
    expect(ultima.team).toBe("team1");
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
