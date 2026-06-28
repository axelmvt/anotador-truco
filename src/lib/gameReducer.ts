// Lógica pura del tanteador de truco (sin React ni efectos), para poder testearla.

export type Team = "team1" | "team2";
export type Stage = "malas" | "buenas";
// Modo de partida: corto (a 15) o largo (a 30 = 15 malas + 15 buenas)
export type GameMode = 15 | 30;

export interface TeamState {
  points: number;
  stage: Stage;
}

export interface GameState {
  mode: GameMode;
  names: Record<Team, string>;
  team1: TeamState;
  team2: TeamState;
  winner: Team | null;
  history: { team1: TeamState; team2: TeamState }[];
}

export type GameAction =
  | { type: "increment"; team: Team }
  | { type: "decrement"; team: Team }
  | { type: "undo" }
  | { type: "reset" }
  | { type: "setMode"; mode: GameMode }
  | { type: "setName"; team: Team; name: string };

// Puntos por fase. En "a 30" cada fase (malas/buenas) vale 15; en "a 15" hay una sola fase.
export const PHASE_POINTS = 15;
const MAX_HISTORY = 50;

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
});

const snapshot = (state: GameState) => ({ team1: state.team1, team2: state.team2 });

const withMove = (state: GameState, team: Team, next: TeamState, winner: Team | null): GameState => ({
  ...state,
  [team]: next,
  winner,
  history: [...state.history, snapshot(state)].slice(-MAX_HISTORY),
});

const incrementTeam = (state: GameState, team: Team): GameState => {
  if (state.winner) return state; // partida terminada: no se modifica
  const current = state[team];

  // Modo corto: una sola fase, se gana al llegar a 15
  if (state.mode === 15) {
    if (current.points >= PHASE_POINTS) return state;
    const next: TeamState = { points: current.points + 1, stage: "malas" };
    return withMove(state, team, next, next.points === PHASE_POINTS ? team : null);
  }

  // Modo largo (a 30): malas -> buenas, se gana al completar buenas
  if (current.stage === "malas") {
    const next: TeamState =
      current.points < PHASE_POINTS
        ? { points: current.points + 1, stage: "malas" }
        : { points: 1, stage: "buenas" };
    return withMove(state, team, next, null);
  }

  // stage === "buenas"
  if (current.points >= PHASE_POINTS) return state;
  const next: TeamState = { points: current.points + 1, stage: "buenas" };
  return withMove(state, team, next, next.points === PHASE_POINTS ? team : null);
};

const decrementTeam = (state: GameState, team: Team): GameState => {
  if (state.winner) return state;
  const current = state[team];

  if (state.mode === 15) {
    if (current.points <= 0) return state;
    return withMove(state, team, { points: current.points - 1, stage: "malas" }, null);
  }

  // Modo largo: inverso exacto de la transición malas->buenas
  if (current.stage === "buenas" && current.points === 1) {
    return withMove(state, team, { points: PHASE_POINTS, stage: "malas" }, null);
  }
  if (current.points > 0) {
    return withMove(state, team, { ...current, points: current.points - 1 }, null);
  }
  return state;
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "increment":
      return incrementTeam(state, action.team);
    case "decrement":
      return decrementTeam(state, action.team);
    case "undo": {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      // Deshacer también reabre la partida si el último punto la había cerrado
      return { ...state, ...last, winner: null, history: state.history.slice(0, -1) };
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
