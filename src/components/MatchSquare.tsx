
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MatchSquareProps {
  points: number;
  maxPoints: number;
  isAnimated?: boolean;
}

const MatchSquare = ({ points, maxPoints, isAnimated = false }: MatchSquareProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (isAnimated) {
      setMounted(true);
    }
  }, [isAnimated]);

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
          "absolute",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '-10px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          ...getDelayStyle(0)
        }}
      >
        <div className="relative">
          <div className="w-[2px] h-[40px] bg-[#e9d8a6]"></div>
          <div className="absolute top-0 w-[6px] h-[6px] rounded-full bg-[#e63946] transform -translate-x-1/2 left-1/2"></div>
        </div>
      </div>
    );
  }
  
  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div 
        key="right" 
        className={cn(
          "absolute",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '50%', 
          right: '-10px', 
          transform: 'translateY(-50%) rotate(90deg)',
          ...getDelayStyle(1)
        }}
      >
        <div className="relative">
          <div className="w-[2px] h-[40px] bg-[#e9d8a6]"></div>
          <div className="absolute top-0 w-[6px] h-[6px] rounded-full bg-[#e63946] transform -translate-x-1/2 left-1/2"></div>
        </div>
      </div>
    );
  }
  
  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div 
        key="bottom" 
        className={cn(
          "absolute",
          mounted && "animate-match-appear"
        )}
        style={{
          bottom: '-10px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          ...getDelayStyle(2)
        }}
      >
        <div className="relative">
          <div className="w-[2px] h-[40px] bg-[#e9d8a6]"></div>
          <div className="absolute top-0 w-[6px] h-[6px] rounded-full bg-[#e63946] transform -translate-x-1/2 left-1/2"></div>
        </div>
      </div>
    );
  }
  
  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div 
        key="left" 
        className={cn(
          "absolute",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '50%', 
          left: '-10px', 
          transform: 'translateY(-50%) rotate(90deg)',
          ...getDelayStyle(3)
        }}
      >
        <div className="relative">
          <div className="w-[2px] h-[40px] bg-[#e9d8a6]"></div>
          <div className="absolute top-0 w-[6px] h-[6px] rounded-full bg-[#e63946] transform -translate-x-1/2 left-1/2"></div>
        </div>
      </div>
    );
  }
  
  // Diagonal match
  if (points >= 5) {
    matchElements.push(
      <div 
        key="diagonal"
        className={cn(
          "absolute",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) rotate(45deg)',
          ...getDelayStyle(4)
        }}
      >
        <div className="relative">
          <div className="w-[2px] h-[40px] bg-[#e9d8a6]"></div>
          <div className="absolute top-0 w-[6px] h-[6px] rounded-full bg-[#e63946] transform -translate-x-1/2 left-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-square w-full relative match-square min-h-[60px]">
      {matchElements}
    </div>
  );
};

export default MatchSquare;
