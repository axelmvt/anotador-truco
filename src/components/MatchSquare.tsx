
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
          "absolute w-full",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '-5px', 
          left: '50%', 
          transform: 'translateX(-50%) rotate(90deg)',
          ...getDelayStyle(0)
        }}
      >
        <img 
          src="/match.svg" 
          alt="Match" 
          className="h-20 w-10"
        />
      </div>
    );
  }
  
  // Right vertical match
  if (points >= 2) {
    matchElements.push(
      <div 
        key="right" 
        className={cn(
          "absolute h-full",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '50%', 
          right: '-5px', 
          transform: 'translateY(-50%) rotate(0deg)',
          ...getDelayStyle(1)
        }}
      >
        <img 
          src="/match.svg" 
          alt="Match" 
          className="h-20 w-10"
        />
      </div>
    );
  }
  
  // Bottom horizontal match
  if (points >= 3) {
    matchElements.push(
      <div 
        key="bottom" 
        className={cn(
          "absolute w-full",
          mounted && "animate-match-appear"
        )}
        style={{
          bottom: '-5px', 
          left: '50%', 
          transform: 'translateX(-50%) rotate(90deg)',
          ...getDelayStyle(2)
        }}
      >
        <img 
          src="/match.svg" 
          alt="Match" 
          className="h-20 w-10"
        />
      </div>
    );
  }
  
  // Left vertical match
  if (points >= 4) {
    matchElements.push(
      <div 
        key="left" 
        className={cn(
          "absolute h-full",
          mounted && "animate-match-appear"
        )}
        style={{
          top: '50%', 
          left: '-5px', 
          transform: 'translateY(-50%) rotate(0deg)',
          ...getDelayStyle(3)
        }}
      >
        <img 
          src="/match.svg" 
          alt="Match" 
          className="h-20 w-10"
        />
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
        <img 
          src="/match.svg" 
          alt="Match" 
          className="h-20 w-10"
        />
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
