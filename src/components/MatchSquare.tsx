import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface MatchSquareProps {
  points: number;
  maxPoints: number;
  isAnimated?: boolean;
}

const MatchSquare = ({ points, maxPoints, isAnimated = false }: MatchSquareProps) => {
  const [mounted, setMounted] = useState(false);
  const prevPointsRef = useRef(0);
  
  useEffect(() => {
    if (isAnimated) {
      setMounted(true);
    }
  }, [isAnimated]);
  
  // Determinar si un punto específico es nuevo (para animar solo el nuevo)
  const isNewPoint = (index: number) => {
    return isAnimated && index >= prevPointsRef.current;
  };
  
  // Actualizar la referencia después del renderizado
  useEffect(() => {
    prevPointsRef.current = points;
  }, [points]);

  // Function to delay animations for a staggered effect
  const getDelayStyle = (index: number) => {
    if (!isAnimated) return {};
    const baseDelay = 0.05;
    return {
      animationDelay: `${baseDelay * index}s`
    };
  };

  // Create matches based on points
  const matchElements = [];
  
  // Top horizontal match
  if (points >= 1) {
    matchElements.push(
      <div 
        key="top" 
        className={cn(
          "absolute h-2 bg-[#FDB833] w-3/4 rounded-full",
          isNewPoint(0) && "animate-match-appear"
        )}
        style={{
          top: '10%', 
          left: '12.5%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)',
          ...getDelayStyle(0)
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div 
        key="right" 
        className={cn(
          "absolute w-2 bg-[#FDB833] h-3/4 rounded-full",
          isNewPoint(1) && "animate-match-appear"
        )}
        style={{
          top: '12.5%', 
          right: '10%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)',
          ...getDelayStyle(1)
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div 
        key="bottom" 
        className={cn(
          "absolute h-2 bg-[#FDB833] w-3/4 rounded-full",
          isNewPoint(2) && "animate-match-appear"
        )}
        style={{
          bottom: '10%', 
          left: '12.5%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)',
          ...getDelayStyle(2)
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div 
        key="left" 
        className={cn(
          "absolute w-2 bg-[#FDB833] h-3/4 rounded-full",
          isNewPoint(3) && "animate-match-appear"
        )}
        style={{
          top: '12.5%', 
          left: '10%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)',
          ...getDelayStyle(3)
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-[#e63946]" />
      </div>
    );
  }
  
  // Diagonal match - con animación mejorada
  if (points >= 5) {
    matchElements.push(
      <div 
        key="diagonal"
        className={cn(
          "absolute h-2 bg-[#FDB833] w-[90%] rounded-full origin-center rotate-45",
          isNewPoint(4) && "animate-match-fade"
        )}
        style={{
          top: '50%', 
          left: '5%',
          boxShadow: '0 0 5px rgba(253, 184, 51, 0.6)',
          ...getDelayStyle(4)
        }}
      >
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-3 h-3 rounded-full bg-[#e63946]" />
      </div>
    );
  }

  return (
    <div className="aspect-square w-full relative match-square min-h-[100px] border-2 border-[#FDB833]/50 rounded-lg">
      {matchElements}
    </div>
  );
};

export default MatchSquare;
