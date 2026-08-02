import { cn } from "@/lib/utils";
import type { Stage, Team } from "@/lib/gameReducer";

interface PhaseBandProps {
  stage: Stage;
  side: Team;
  /** Dispara el barrido y el brillo al pasar de malas a buenas. */
  flash: boolean;
}

// Banda de fase debajo del nombre. Teñida al 15 %, no dorado macizo: el oro
// pleno compite con los fósforos, que son el corazón visual del tablero.
const PhaseBand = ({ stage, side, flash }: PhaseBandProps) => {
  const buenas = stage === "buenas";

  return (
    <div
      className={cn(
        "relative flex h-6 w-full items-center justify-center overflow-hidden",
        "text-[10px] font-bold uppercase tracking-[0.22em] transition-colors duration-300",
        // Costura de verde alineada con el divisor: sin esto las dos bandas se
        // leen como una sola barra cuando ambos equipos están en la misma fase.
        side === "team1" ? "border-r-2 border-truco-green" : "border-l-2 border-truco-green",
        // Colores de texto elegidos por contraste real (WCAG, compuesto sobre
        // el fondo efectivo de la banda + el verde de la cancha), no a ojo:
        // text-white/60 y text-truco-stick sólido daban ~3.3:1 los dos, muy
        // por debajo de 4.5:1 (texto de 10px, no entra en el mínimo relajado
        // de "texto grande"). text-white/80 sobre bg-white/[0.06] da 4.56:1;
        // text-yellow-200 sobre bg-truco-stick/15 da 4.94:1 y mantiene la
        // familia de color del nombre en buenas (mismo text-yellow-200).
        buenas
          ? "bg-truco-stick/15 text-yellow-200 shadow-[inset_0_-2px_0_0_#FDB833]"
          : "bg-white/[0.06] text-white/80"
      )}
    >
      {flash && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-center bg-truco-stick/15 motion-safe:animate-band-wipe"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[38%] bg-gradient-to-r from-transparent via-white/55 to-transparent motion-safe:animate-band-shine"
          />
        </>
      )}
      <span className="relative z-10">{buenas ? "Buenas" : "Malas"}</span>
    </div>
  );
};

export default PhaseBand;
