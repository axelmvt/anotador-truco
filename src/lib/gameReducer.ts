// Lógica pura del tanteador de truco (sin React ni efectos), para poder testearla.

export type Team = "team1" | "team2";
export type Stage = "malas" | "buenas";
// Modo de partida: corto (a 15) o largo (a 30 = 15 malas + 15 buenas)
export type GameMode = 15 | 30;

export interface TeamState {
  points: number;
  stage: Stage;
}

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

export type GameAction =
  | { type: "increment"; team: Team; at: number }
  | { type: "decrement"; team: Team; at: number }
  | { type: "undo"; at: number }
  | { type: "reset" }
  | { type: "setMode"; mode: GameMode }
  | { type: "setName"; team: Team; name: string };

// Puntos por fase. En "a 30" cada fase (malas/buenas) vale 15; en "a 15" hay una sola fase.
export const PHASE_POINTS = 15;
const MAX_HISTORY = 50;
export const MAX_LOG = 200;

export const DEFAULT_NAMES: Record<Team, string> = {
  team1: "Nosotros",
  team2: "Ellos",
};

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

const snapshot = (state: GameState) => ({ team1: state.team1, team2: state.team2 });

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

// Divide los puntos de una fase en cuadros de 5 fósforos (4 lados + diagonal).
export const getSquaresForTeam = (points: number): number[] => {
  const fullSquares = Math.floor(points / 5);
  const remainingPoints = points % 5;
  const squares: number[] = [];
  for (let i = 0; i < fullSquares; i++) squares.push(5);
  if (remainingPoints > 0) squares.push(remainingPoints);
  return squares;
};
