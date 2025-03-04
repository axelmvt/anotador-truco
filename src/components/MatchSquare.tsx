
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
          "match-stick h-3 w-full rounded-full absolute top-0",
          mounted && "animate-match-appear"
        )}
        style={getDelayStyle(0)}
      >
        <div className="match-head absolute left-1/2 top-0 w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }
  
  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div 
        key="right" 
        className={cn(
          "match-stick w-3 h-full rounded-full absolute right-0",
          mounted && "animate-match-appear"
        )}
        style={getDelayStyle(1)}
      >
        <div className="match-head absolute top-1/2 right-0 w-5 h-5 rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }
  
  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div 
        key="bottom" 
        className={cn(
          "match-stick h-3 w-full rounded-full absolute bottom-0",
          mounted && "animate-match-appear"
        )}
        style={getDelayStyle(2)}
      >
        <div className="match-head absolute left-1/2 bottom-0 w-5 h-5 rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>
    );
  }
  
  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div 
        key="left" 
        className={cn(
          "match-stick w-3 h-full rounded-full absolute left-0",
          mounted && "animate-match-appear"
        )}
        style={getDelayStyle(3)}
      >
        <div className="match-head absolute top-1/2 left-0 w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }
  
  // Diagonal match
  if (points >= 5) {
    matchElements.push(
      <div 
        key="diagonal"
        className={cn(
          "match-stick h-3 w-[140%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center",
          "rotate-45 rounded-full",
          mounted && "animate-match-appear"
        )}
        style={getDelayStyle(4)}
      >
        <div className="match-head absolute right-0 w-5 h-5 rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }

  return (
    <div className="aspect-square w-full relative match-square">
      {matchElements}
    </div>
  );
};

export default MatchSquare;
