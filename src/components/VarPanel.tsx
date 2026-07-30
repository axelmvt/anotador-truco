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
    <span className={cn("h-px flex-1", hito ? "bg-truco-stick/40" : "bg-truco-cream/12")} />
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
            "h-3.5 w-3.5 shrink-0 text-truco-cream/40 transition-transform duration-[260ms]",
            abierta && "rotate-180"
          )}
        />
      </button>

      {/* grid 0fr→1fr: anima la altura sin conocerla de antemano */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
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
