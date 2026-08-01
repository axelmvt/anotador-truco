import { useMemo, useRef, useState } from "react";
import { X, Undo2, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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

// role="presentation": no es un ítem de la lista, es un separador visual.
// Los hijos directos de un role="list" que no son "listitem" tienen que
// declararlo así, o el rol del contenedor deja de ser fiable para lectores
// de pantalla.
const Separador = ({ children, hito = false }: { children: React.ReactNode; hito?: boolean }) => (
  <div
    role="presentation"
    className={cn(
      "mt-3.5 mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] first:mt-0.5",
      hito ? "text-truco-stick" : "text-truco-cream/55"
    )}
  >
    <span>{children}</span>
    <span className={cn("h-px flex-1", hito ? "bg-truco-stick/40" : "bg-truco-cream/15")} />
  </div>
);

const FilaDeshacer = ({ t, nombre }: { t: Tanda; nombre: string }) => (
  <div className="mb-1.5 flex items-center gap-2 rounded-[10px] border border-dashed border-truco-cream/20 px-2.5 py-2 opacity-75">
    <Undo2 className="h-3.5 w-3.5 shrink-0 text-truco-cream/55" />
    <span className="min-w-0 text-[12.5px] italic leading-tight text-truco-cream/65">
      Se deshizo{" "}
      <span className="font-mono not-italic line-through text-truco-cream/55">
        {t.undoneType === "suma" ? "+1" : "−1"}
      </span>{" "}
      de {nombre} · queda en {t.points}
    </span>
    <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-truco-cream/55">
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
  // Id estable y único por tarjeta (derivado de t.id) para enlazar el botón
  // con su detalle vía aria-controls.
  const detalleId = `var-detalle-${t.id}`;

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
        aria-controls={detalleId}
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
              className="rounded border border-truco-cream/15 px-1 py-0.5 text-[9.5px] tracking-wider text-truco-cream/55"
            >
              {fase.slice(0, 1)}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-truco-cream/55 transition-transform [transition-duration:260ms]",
            abierta && "rotate-180"
          )}
        />
      </button>

      {/* grid 0fr→1fr: anima la altura sin conocerla de antemano.
          aria-hidden cuando está cerrada: el recorte visual (grid-rows-[0fr] +
          overflow-hidden) no saca el contenido del árbol de accesibilidad por
          sí solo, así que sin esto un lector de pantalla leería las horas de
          cada movimiento aunque la tarjeta esté colapsada. */}
      <div
        id={detalleId}
        aria-hidden={!abierta}
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
                <span className="text-truco-cream/55">→</span>
                <span>{x.points}</span>
                {mostrarFase && (
                  <span className="text-truco-cream/55">
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

interface Stats {
  sumas: number;
  restas: number;
  mejorRacha: number;
  total: number;
}

// Cuenta por equipo. La mejor racha son sumas propias consecutivas sin que el
// rival anote en el medio. Dos cosas NO cortan la racha, a propósito:
// - los deshacer, que solo corrigen, no son una jugada del rival;
// - una resta del propio equipo, que se asume corrección de un toque de más
//   (no que el rival haya anotado). Por eso tiene su propia rama abajo, que
//   no hace nada: se deja explícita para que no se lea como un olvido.
const statsDe = (log: LogEntry[], team: Team): Stats => {
  const propias = log.filter((e) => e.team === team);
  let mejorRacha = 0;
  let actual = 0;
  for (const e of log) {
    if (e.type === "deshacer") continue;
    if (e.team === team && e.type === "suma") {
      actual += 1;
      mejorRacha = Math.max(mejorRacha, actual);
    } else if (e.team === team && e.type === "resta") {
      // No-op intencional: una resta propia no corta la racha (ver comentario
      // de arriba). `actual` queda como está.
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
          <span className="font-mono text-[9.5px] uppercase tracking-widest text-truco-cream/55">
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
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-widest text-truco-cream/55">
            {k}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Vista de resumen: dos tarjetas por equipo más el reparto de la partida.
// Se usa tanto en la vista alternable del bottom sheet (mobile) como en la
// barra lateral fija del diálogo (desktop) — el JSX es idéntico en ambos
// casos, solo cambia el contenedor que lo envuelve.
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
      <div className="mt-2 flex justify-between font-mono text-[10px] text-truco-cream/55">
        <span className="max-w-[45%] truncate">
          {names.team1} · {reparto.t1}
        </span>
        <span className="max-w-[45%] truncate">
          {reparto.t2} · {names.team2}
        </span>
      </div>
      <div className="mt-3 flex justify-between border-t border-truco-cream/15 pt-2.5 font-mono text-[11px] text-truco-cream/55">
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
);

const VarPanel = ({ open, onOpenChange, log, names, mode, team1, team2 }: VarPanelProps) => {
  const mostrarFase = mode === 30;
  // `useIsMobile` ya devuelve un booleano (coerciona con `!!` internamente),
  // pero en el primer render —antes de que corra su efecto— ese booleano es
  // `false` sin importar el ancho real de la ventana. Como VarPanel se monta
  // una sola vez y de entrada (ver MatchCounter), ese primer render ocurre
  // con el panel cerrado y no se nota: el efecto ya corrigió el valor mucho
  // antes de que el usuario llegue a abrirlo. De todos modos tratamos
  // cualquier valor que no sea estrictamente `true` como desktop, tal como
  // pide la tarea, así que un futuro cambio en el hook no nos rompe.
  const isMobile = useIsMobile();
  const [vista, setVista] = useState<"movimientos" | "resumen">("movimientos");
  // Refs a los dos botones del tablist, para mover el foco junto con la
  // selección (patrón APG de Tabs: foco y selección viajan juntos).
  const tabRefs = useRef<Record<"movimientos" | "resumen", HTMLButtonElement | null>>({
    movimientos: null,
    resumen: null,
  });

  // El "ahora" se fija al abrir: si se recalculara en cada render, los
  // separadores de tiempo saltarían mientras el panel está abierto.
  //
  // Se recalcula DURANTE el render y no en un `useEffect`. Con el efecto había
  // un commit intermedio con el `ahora` del montaje: si la app venía abierta un
  // rato, ese valor es anterior a las jugadas, `ahora - at` da negativo y todas
  // las filas caen en "Recién". No pudimos reproducir ese estado en pantalla
  // —React vacía los efectos pasivos antes de que el navegador pinte, así que
  // en la práctica no se llega a ver— pero asignar el estado en el render lo
  // vuelve imposible por construcción y ahorra el render de más.
  const [ahora, setAhora] = useState(() => Date.now());
  const estabaAbierta = useRef(open);
  if (open !== estabaAbierta.current) {
    estabaAbierta.current = open;
    if (open) setAhora(Date.now());
  }

  const tandas = useMemo(() => agruparEnTandas(log).reverse(), [log]);
  const hitos = useMemo(() => hitosDeBuenas(log, mode), [log, mode]);
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

  const filas: React.ReactNode[] = [];
  let bucketPrevio: number | null = null;
  tandas.forEach((t, i) => {
    const b = bucketDeTiempo(t.hasta, ahora);
    if (b.k !== bucketPrevio) {
      bucketPrevio = b.k;
      filas.push(<Separador key={`sep-${t.id}`}>{b.label}</Separador>);
    }
    filas.push(
      <div
        key={t.id}
        role="listitem"
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
    // El hito va DESPUÉS de la tarjeta: la lista está invertida (más nuevo
    // arriba), así que todo lo que queda por encima del separador ya está en
    // buenas — incluida esta misma tanda, que es la que cruzó.
    const hito = t.items.find((x) => hitos[x.id]);
    if (hito) {
      filas.push(
        <Separador key={`hito-${t.id}`} hito>
          ▸ {names[hitos[hito.id]]} pasó a las buenas
        </Separador>
      );
    }
  });

  // Arriba de md el bottom sheet se reemplaza por un diálogo centrado a dos
  // columnas: la lista a la izquierda y el Resumen como barra lateral fija
  // (no hay tabs acá, no es una vista alternable). `isMobile !== true` se
  // trata como desktop a propósito (ver comentario junto a `useIsMobile`).
  if (isMobile !== true) {
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
            <span className="font-mono text-[11.5px] text-truco-cream/55">
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
                {filas}
              </div>
              <div className="min-h-0 overflow-y-auto border-l border-truco-cream/15 bg-black/15 px-4 pb-5">
                <p className="mb-3 mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-truco-cream/55">
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
          <span className="font-mono text-[11.5px] text-truco-cream/55">
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
              ref={(el) => {
                tabRefs.current[v] = el;
              }}
              type="button"
              role="tab"
              aria-selected={vista === v}
              tabIndex={vista === v ? 0 : -1}
              onClick={() => setVista(v)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  // Con exactamente 2 tabs, "anterior" y "siguiente" circulares
                  // son el mismo elemento: no hace falta mirar qué flecha fue.
                  const siguiente = vista === "movimientos" ? "resumen" : "movimientos";
                  setVista(siguiente);
                  // Roving tabindex: el foco tiene que seguir a la selección,
                  // no quedarse en el botón que dejó de estar activo. El botón
                  // ya existe en el DOM (ambos tabs están siempre montados), así
                  // que no hace falta esperar al re-render para enfocarlo.
                  tabRefs.current[siguiente]?.focus();
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

        <DrawerDescription className="sr-only">
          Historial de solo lectura de los puntos sumados, restados y deshechos en la partida.
        </DrawerDescription>

        <div
          role={vista === "movimientos" && log.length > 0 ? "list" : undefined}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
        >
          {log.length === 0 ? (
            <Vacio onClose={() => onOpenChange(false)} />
          ) : vista === "movimientos" ? (
            filas
          ) : (
            <VistaResumen {...{ log, names, mode, team1, team2, reparto }} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default VarPanel;
