import { cn } from "@/lib/utils";

interface MatchSquareProps {
  points: number;
  maxPoints: number;
  isAnimated?: boolean;
}

const MatchSquare = ({ points, isAnimated = false }: MatchSquareProps) => {
  // Animación declarativa: cada fósforo se anima una sola vez al montarse
  // (cuando aparece su punto). Como React reusa los nodos existentes entre
  // renders, solo el fósforo recién agregado anima — sin refs ni classList.
  const matchClass = (extra: string) =>
    cn("absolute bg-[#FDB833] rounded-full", extra, isAnimated && "animate-match-manual");

  const head = "absolute w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]";
  const glow = { boxShadow: "0 0 5px rgba(253, 184, 51, 0.6)" } as const;

  const matchElements = [];

  // Top horizontal match
  if (points >= 1) {
    matchElements.push(
      <div key="top" className={matchClass("h-2 md:h-[6px] w-3/4")} style={{ top: "10%", left: "12.5%", ...glow }}>
        <div className={cn(head, "top-1/2 left-0 transform -translate-y-1/2")} />
      </div>
    );
  }

  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div key="right" className={matchClass("w-2 md:w-[6px] h-3/4")} style={{ top: "12.5%", right: "10%", ...glow }}>
        <div className={cn(head, "top-0 left-1/2 transform -translate-x-1/2")} />
      </div>
    );
  }

  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div key="bottom" className={matchClass("h-2 md:h-[6px] w-3/4")} style={{ bottom: "10%", left: "12.5%", ...glow }}>
        <div className={cn(head, "top-1/2 left-0 transform -translate-y-1/2")} />
      </div>
    );
  }

  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div key="left" className={matchClass("w-2 md:w-[6px] h-3/4")} style={{ top: "12.5%", left: "10%", ...glow }}>
        <div className={cn(head, "top-0 left-1/2 transform -translate-x-1/2")} />
      </div>
    );
  }

  // Diagonal match
  if (points >= 5) {
    matchElements.push(
      <div
        key="diagonal"
        className={matchClass("h-2 md:h-[6px] w-[90%] origin-center rotate-45")}
        style={{ top: "50%", left: "5%", transformOrigin: "center", ...glow }}
      >
        <div className={cn(head, "top-1/2 left-0 transform -translate-y-1/2")} />
      </div>
    );
  }

  return (
    <div className="aspect-square w-full md:max-w-[28vh] md:mx-auto relative match-square min-h-[100px] md:min-h-[150px] border-2 border-[#FDB833]/50 rounded-lg overflow-hidden pointer-events-none">
      <div className="w-full h-full absolute">{matchElements}</div>
    </div>
  );
};

export default MatchSquare;
