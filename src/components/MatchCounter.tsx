import { useReducer, useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { Settings, RefreshCcw, Undo2, Share2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import VarIcon from "@/components/icons/VarIcon";
import VarPanel from "@/components/VarPanel";
import PhaseBand from "@/components/PhaseBand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import MatchSquare from './MatchSquare';
import { primeAudio, playWin, playBuenas, vibrate } from "@/lib/feedback";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  gameReducer,
  createInitialState,
  getSquaresForTeam,
  DEFAULT_NAMES,
  MAX_LOG,
  type GameState,
  type GameMode,
  type Team,
  type TeamState,
  type LogEntry,
} from "@/lib/gameReducer";

const STORAGE_KEY = "anotador-truco:partida";
const SOUND_KEY = "anotador-truco:sonido";
const SHARE_URL = "https://truco.mvt.ar";

// Preferencia de efectos (sonido + vibración). Por defecto activada.
const loadFeedbackPref = (): boolean => {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
};

// Puntaje total acumulado de un equipo (en "a 30", buenas suma 15 a la fase previa).
const totalPoints = (team: TeamState, mode: GameMode): number =>
  mode === 30 && team.stage === "buenas" ? 15 + team.points : team.points;

// Descarta entradas corruptas de un log guardado por otra versión y recorta al
// tope. Un log inválido no es un error: se arranca sin historial.
// El array se trata como unknown[] (no any[]) para que el predicado esté
// obligado a validar cada campo: Array.isArray por sí solo estrecha a any[],
// y con any el compilador deja pasar un predicado incompleto sin reclamar.
const sanearLog = (raw: unknown): LogEntry[] => {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .filter((e): e is LogEntry => {
      if (!e || typeof e !== "object") return false;
      const entry = e as Record<string, unknown>;
      const undoneTypeOk =
        entry.undoneType === undefined ||
        entry.undoneType === "suma" ||
        entry.undoneType === "resta" ||
        entry.undoneType === "deshacer";
      return (
        Number.isFinite(entry.at) &&
        typeof entry.id === "string" &&
        (entry.team === "team1" || entry.team === "team2") &&
        (entry.type === "suma" || entry.type === "resta" || entry.type === "deshacer") &&
        Number.isFinite(entry.delta) &&
        Number.isFinite(entry.points) &&
        (entry.stage === "malas" || entry.stage === "buenas") &&
        undoneTypeOk
      );
    })
    .slice(-MAX_LOG);
};

// El contador se recalcula del log en vez de confiar en lo guardado: así dos
// entradas nunca comparten id aunque el valor almacenado esté mal.
const siguienteLogId = (log: LogEntry[]): number =>
  log.reduce((max, e) => Math.max(max, Number(e.id.replace(/^L/, "")) || 0), 0) + 1;

// Lee la partida guardada y la normaliza; cae al estado inicial si no hay datos
// válidos o si localStorage no está disponible.
const loadSavedGame = (): GameState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const p = JSON.parse(raw);
    if (!p?.team1 || !p?.team2) return createInitialState();
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
  } catch {
    return createInitialState();
  }
};

const MatchCounter = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadSavedGame);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(loadFeedbackPref);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [flashTeam, setFlashTeam] = useState<Team | null>(null);

  // Evita que el teléfono apague la pantalla en medio de la partida.
  useWakeLock();

  // Al terminar de editar, si el nombre quedó vacío vuelve al valor por defecto.
  const finishEditing = (team: Team) => {
    if (!state.names[team].trim()) {
      dispatch({ type: "setName", team, name: DEFAULT_NAMES[team] });
    }
    setEditingTeam(null);
  };

  const gameEnded = state.winner !== null;

  // Persiste la preferencia de efectos.
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, feedbackEnabled ? "on" : "off");
    } catch {
      // localStorage no disponible: se ignora
    }
  }, [feedbackEnabled]);

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

  // Avisa cuando un equipo pasa a las buenas (solo en modo a 30).
  const t1Stage = state.team1.stage;
  const t2Stage = state.team2.stage;
  const { names } = state;
  const prevStages = useRef({ team1: t1Stage, team2: t2Stage });
  useEffect(() => {
    const stages = { team1: t1Stage, team2: t2Stage };
    (["team1", "team2"] as Team[]).forEach((t) => {
      if (prevStages.current[t] === "malas" && stages[t] === "buenas") {
        toast(`¡${names[t]} pasó a las buenas!`, { position: "top-center" });
        setFlashTeam(t);
        if (feedbackEnabled) {
          playBuenas();
          vibrate(80);
        }
      }
    });
    prevStages.current = stages;
  }, [t1Stage, t2Stage, names, feedbackEnabled]);

  // Apaga el destello por reloj, no por el evento de animación: con
  // `prefers-reduced-motion: reduce` las clases `motion-safe:animate-*` nunca
  // se aplican, así que `onAnimationEnd` no dispara jamás y `flashTeam`
  // quedaría pegado para siempre (el brillo blanco quedaba congelado sobre la
  // banda). El barrido dura 420ms y el brillo 900ms con 120ms de demora
  // (1020ms en total): 1100ms cubre ambos con margen sin importar qué modo de
  // movimiento esté activo. Si dos equipos cruzan a buenas casi juntos, el
  // timer viejo no debe apagar el destello nuevo: por eso se limpia en el
  // cleanup del efecto.
  useEffect(() => {
    if (flashTeam === null) return;
    const timer = setTimeout(() => setFlashTeam(null), 1100);
    return () => clearTimeout(timer);
  }, [flashTeam]);

  // Avisa el ganador una sola vez (no se re-dispara al recargar una partida ya cerrada).
  const prevWinner = useRef(state.winner);
  useEffect(() => {
    if (!prevWinner.current && state.winner) {
      toast(`¡Ganó ${state.names[state.winner]}!`, {
        description: "La partida ha terminado",
        position: "top-center",
      });
      if (feedbackEnabled) {
        playWin();
        vibrate([100, 50, 100, 50, 250]);
      }
    }
    prevWinner.current = state.winner;
  }, [state.winner, state.names, feedbackEnabled]);

  const incrementTeam = (team: Team) => {
    // Habilita el audio dentro de un gesto del usuario (lo necesita iOS).
    if (feedbackEnabled) primeAudio();
    if (gameEnded) {
      toast("La partida ha terminado. Reiniciá para jugar de nuevo.", { position: "top-center" });
      return;
    }
    dispatch({ type: "increment", team, at: Date.now() });
  };

  const decrementTeam = (team: Team) => {
    if (gameEnded) {
      toast("La partida ha terminado. Reiniciá para jugar de nuevo.", { position: "top-center" });
      return;
    }
    dispatch({ type: "decrement", team, at: Date.now() });
  };

  const undo = () => {
    if (state.history.length === 0) {
      toast("No hay jugadas para deshacer", { position: "top-center" });
      return;
    }
    dispatch({ type: "undo", at: Date.now() });
    toast("Jugada deshecha", { position: "top-center" });
  };

  const resetGame = () => {
    dispatch({ type: "reset" });
    toast("Partida reiniciada", { position: "top-center" });
  };

  const changeMode = (mode: GameMode) => {
    if (mode === state.mode) return;
    dispatch({ type: "setMode", mode });
    toast(`Modo cambiado: a ${mode}. Partida reiniciada.`, { position: "top-center" });
  };

  const shareResult = async () => {
    const t1 = totalPoints(state.team1, state.mode);
    const t2 = totalPoints(state.team2, state.mode);
    const winnerLine = state.winner
      ? `¡Ganó ${state.names[state.winner]}! 🎉`
      : "Partida en curso 🤜🤛";
    const text =
      `🃏 Truco: ${state.names.team1} ${t1} - ${t2} ${state.names.team2}\n` +
      `${winnerLine}\n\nAnotá tus partidas en ${SHARE_URL}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Anotador de Truco", text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      }
    } catch {
      // El usuario canceló el menú de compartir: no se hace nada
    }
  };

  const team1Squares = getSquaresForTeam(state.team1.points);
  const team2Squares = getSquaresForTeam(state.team2.points);

  // Sumar con teclado (Enter/Espacio) sobre la mitad del equipo.
  const handleIncrementKey = (team: Team) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      incrementTeam(team);
    }
  };

  // Texto que anuncia el marcador a los lectores de pantalla (los fósforos no se "leen").
  const scoreAnnouncement =
    `${state.names.team1}: ${totalPoints(state.team1, state.mode)} puntos. ` +
    `${state.names.team2}: ${totalPoints(state.team2, state.mode)} puntos.` +
    (state.winner ? ` Ganó ${state.names[state.winner]}.` : "");

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Marcador para lectores de pantalla (los fósforos son visuales) */}
      <div className="sr-only" role="status" aria-live="polite">
        {scoreAnnouncement}
      </div>

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
              />
            )}
          </div>
        ))}
      </div>

      {/* Game Board */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex relative">
          {/* Team 1 Side */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`Sumar punto a ${state.names.team1}`}
            className={cn(
              "w-1/2 p-2 sm:p-4 flex flex-col space-y-2 relative overflow-hidden cursor-pointer select-none transition-colors active:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40",
              gameEnded && "opacity-90"
            )}
            onClick={() => incrementTeam("team1")}
            onKeyDown={handleIncrementKey("team1")}
          >
            {team1Squares.map((points, index) => (
              <MatchSquare
                key={`team1-${index}`}
                points={points}
                maxPoints={5}
                isAnimated={true}
              />
            ))}
            {/* Hint de affordance cuando el equipo está en 0 */}
            {state.team1.points === 0 && !gameEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white/30">
                <Plus className="h-10 w-10" />
                <span className="text-sm mt-1">Tocá para sumar</span>
              </div>
            )}
            <button
              type="button"
              aria-label={`Restar punto a ${state.names.team1}`}
              className="absolute bottom-2 left-2 h-12 w-12 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full z-10 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25"
              onClick={(e) => {
                e.stopPropagation();
                decrementTeam("team1");
              }}
            >
              <span className="text-white text-2xl font-bold">-</span>
            </button>
          </div>

          {/* Center divider */}
          <div className="w-1 bg-truco-stick shadow-lg" />

          {/* Team 2 Side */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`Sumar punto a ${state.names.team2}`}
            className={cn(
              "w-1/2 p-2 sm:p-4 flex flex-col space-y-2 relative overflow-hidden cursor-pointer select-none transition-colors active:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40",
              gameEnded && "opacity-90"
            )}
            onClick={() => incrementTeam("team2")}
            onKeyDown={handleIncrementKey("team2")}
          >
            {team2Squares.map((points, index) => (
              <MatchSquare
                key={`team2-${index}`}
                points={points}
                maxPoints={5}
                isAnimated={true}
              />
            ))}
            {/* Hint de affordance cuando el equipo está en 0 */}
            {state.team2.points === 0 && !gameEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white/30">
                <Plus className="h-10 w-10" />
                <span className="text-sm mt-1">Tocá para sumar</span>
              </div>
            )}
            {/* Control buttons for Team 2 */}
            <div className="absolute right-2 bottom-2 flex flex-col gap-3 items-end z-30">
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

              {/* Undo Button (shows when there is at least one move to undo) */}
              {state.history.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Deshacer última jugada"
                  className="h-12 w-12 rounded-full bg-black/10 border-none text-white hover:bg-black/20 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25 animate-fade-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    undo();
                  }}
                >
                  <Undo2 className="h-6 w-6" />
                </Button>
              )}

              {/* Reset Button (shows when game ended) */}
              {gameEnded && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Reiniciar partida"
                  className="h-12 w-12 rounded-full bg-red-500/60 hover:bg-red-500/80 border-none text-white scale-110 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-red-500/90 animate-fade-in z-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                >
                  <RefreshCcw className="h-6 w-6" />
                </Button>
              )}

              {/* Minus Button */}
              <button
                type="button"
                aria-label={`Restar punto a ${state.names.team2}`}
                className="h-12 w-12 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-transform duration-150 ease-out active:scale-[0.88] active:bg-black/25"
                onClick={(e) => {
                  e.stopPropagation();
                  decrementTeam("team2");
                }}
              >
                <span className="text-white text-2xl font-bold">-</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for game ended */}
      {gameEnded && (
        <div
          className="absolute inset-0 bg-black/50 pointer-events-none flex items-center justify-center z-20 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-red-600/40 border border-white/20 px-8 py-6 rounded-xl backdrop-blur-md shadow-xl text-center">
            <p className="text-white text-lg font-bold">¡Ganó {state.winner && state.names[state.winner]}!</p>
            <Button
              variant="outline"
              size="lg"
              className="mt-3 bg-green-600/80 hover:bg-green-600 border-none text-white w-full pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                shareResult();
              }}
            >
              <Share2 className="h-5 w-5 mr-2" />
              Compartir resultado
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="mt-2 bg-white/10 hover:bg-white/20 border-none text-white w-full pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
            >
              Reiniciar Partida
            </Button>
          </div>
        </div>
      )}

      <VarPanel
        open={varOpen}
        onOpenChange={setVarOpen}
        log={state.log}
        names={state.names}
        mode={state.mode}
        team1={state.team1}
        team2={state.team2}
      />

      {/* Panel de configuración: modo de partida y nombres */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>Elegí la duración de la partida y los nombres de los equipos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Duración</Label>
              <div className="grid grid-cols-2 gap-2">
                {([15, 30] as GameMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={state.mode === mode ? "default" : "outline"}
                    onClick={() => changeMode(mode)}
                  >
                    {mode === 15 ? "Corto (15)" : "Largo (30)"}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Cambiar la duración reinicia la partida.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name-team1">Equipo 1</Label>
              <Input
                id="name-team1"
                value={state.names.team1}
                maxLength={20}
                onChange={(e) => dispatch({ type: "setName", team: "team1", name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name-team2">Equipo 2</Label>
              <Input
                id="name-team2"
                value={state.names.team2}
                maxLength={20}
                onChange={(e) => dispatch({ type: "setName", team: "team2", name: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="feedback">Sonido y vibración</Label>
              <Switch
                id="feedback"
                checked={feedbackEnabled}
                onCheckedChange={(checked) => {
                  setFeedbackEnabled(checked);
                  if (checked) {
                    primeAudio();
                    playBuenas(); // muestra cómo suena al activar
                  }
                }}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetGame();
                setSettingsOpen(false);
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reiniciar partida
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchCounter;
