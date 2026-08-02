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
