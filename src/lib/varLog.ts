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
