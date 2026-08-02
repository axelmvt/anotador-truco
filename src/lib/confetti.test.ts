import { describe, expect, it } from "vitest";
import { planDeAndanada } from "./confetti";

describe("planDeAndanada", () => {
  it("saca ceil(duracion / intervalo) disparos", () => {
    expect(planDeAndanada(2500, 200)).toHaveLength(13);
    expect(planDeAndanada(1000, 250)).toHaveLength(4);
  });

  it("arranca en atMs 0", () => {
    expect(planDeAndanada(2500, 200)[0].atMs).toBe(0);
  });

  it("no programa ningún disparo en o después de la duración", () => {
    const plan = planDeAndanada(2500, 200);
    expect(Math.max(...plan.map((d) => d.atMs))).toBeLessThan(2500);
  });

  it("separa los disparos por el intervalo pedido", () => {
    const plan = planDeAndanada(1000, 250);
    expect(plan.map((d) => d.atMs)).toEqual([0, 250, 500, 750]);
  });

  it("baja las partículas de forma monótona, sin repuntes", () => {
    const plan = planDeAndanada(2500, 200);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].particulas).toBeLessThanOrEqual(plan[i - 1].particulas);
    }
    expect(plan[plan.length - 1].particulas).toBeLessThan(plan[0].particulas);
  });

  it("nunca tira un disparo vacío", () => {
    for (const d of planDeAndanada(2500, 200)) {
      expect(d.particulas).toBeGreaterThan(0);
    }
  });

  it("con una duración menor al intervalo sale un solo disparo, no cero", () => {
    const plan = planDeAndanada(100, 200);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toEqual({ atMs: 0, particulas: 34 });
  });

  it("aguanta una duración de cero sin devolver una andanada vacía", () => {
    expect(planDeAndanada(0, 200)).toHaveLength(1);
  });
});
