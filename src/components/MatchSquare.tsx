import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface MatchSquareProps {
  points: number;
  maxPoints: number;
  isAnimated?: boolean;
}

const MatchSquare = ({ points, maxPoints, isAnimated = false }: MatchSquareProps) => {
  // Referencias a los elementos DOM para aplicar animaciones directamente
  const matchRefs = {
    top: useRef<HTMLDivElement>(null),
    right: useRef<HTMLDivElement>(null),
    bottom: useRef<HTMLDivElement>(null),
    left: useRef<HTMLDivElement>(null),
    diagonal: useRef<HTMLDivElement>(null)
  };
  
  // Registrar cuántos puntos se han mostrado anteriormente
  const prevPointsRef = useRef(0);
  
  // Aplicar animaciones solo a los nuevos elementos cuando cambian los puntos
  useEffect(() => {
    if (!isAnimated) return;
    
    // Solo animar elementos nuevos
    if (points > prevPointsRef.current) {
      // Determinar qué elementos son nuevos
      for (let i = prevPointsRef.current + 1; i <= points; i++) {
        switch (i) {
          case 1:
            matchRefs.top.current?.classList.add("animate-match-manual");
            break;
          case 2:
            matchRefs.right.current?.classList.add("animate-match-manual");
            break;
          case 3:
            matchRefs.bottom.current?.classList.add("animate-match-manual");
            break;
          case 4:
            matchRefs.left.current?.classList.add("animate-match-manual");
            break;
          case 5:
            matchRefs.diagonal.current?.classList.add("animate-match-manual");
            break;
        }
      }
    }
    
    // Actualizar el contador de puntos previos
    prevPointsRef.current = points;
  }, [points, isAnimated]);

  // Create matches based on points
  const matchElements = [];
  
  // Top horizontal match
  if (points >= 1) {
    matchElements.push(
      <div 
        ref={matchRefs.top}
        key="top" 
        className="absolute h-2 md:h-[6px] bg-[#FDB833] w-3/4 rounded-full"
        style={{
          top: '10%', 
          left: '12.5%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)'
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div 
        ref={matchRefs.right}
        key="right" 
        className="absolute w-2 md:w-[6px] bg-[#FDB833] h-3/4 rounded-full"
        style={{
          top: '12.5%', 
          right: '10%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)'
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div 
        ref={matchRefs.bottom}
        key="bottom" 
        className="absolute h-2 md:h-[6px] bg-[#FDB833] w-3/4 rounded-full"
        style={{
          bottom: '10%', 
          left: '12.5%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)'
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div 
        ref={matchRefs.left}
        key="left" 
        className="absolute w-2 md:w-[6px] bg-[#FDB833] h-3/4 rounded-full"
        style={{
          top: '12.5%', 
          left: '10%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)'
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Diagonal match
  if (points >= 5) {
    matchElements.push(
      <div 
        ref={matchRefs.diagonal}
        key="diagonal"
        className="absolute h-2 md:h-[6px] bg-[#FDB833] w-[90%] rounded-full origin-center rotate-45"
        style={{
          top: '50%', 
          left: '5%',
          transformOrigin: 'center',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)'
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 md:w-2 md:h-2 rounded-full bg-[#e63946]" />
      </div>
    );
  }

  return (
    <div className="aspect-square w-full relative match-square min-h-[100px] md:min-h-[150px] border-2 border-[#FDB833]/50 rounded-lg overflow-hidden">
      <div className="w-full h-full absolute">
        {matchElements}
      </div>
    </div>
  );
};

export default MatchSquare;
