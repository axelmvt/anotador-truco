import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Settings, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MatchSquare from './MatchSquare';

type TeamState = {
  points: number;
  stage: "malas" | "buenas";
};

const MAX_POINTS = 15;

const MatchCounter = () => {
  const [team1, setTeam1] = useState<TeamState>({ points: 0, stage: "malas" });
  const [team2, setTeam2] = useState<TeamState>({ points: 0, stage: "malas" });
  const [showControls, setShowControls] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    const checkGameEnd = () => {
      if (team1.stage === "buenas" && team1.points === MAX_POINTS) {
        toast("¡Nosotros ganamos!", {
          description: "La partida ha terminado",
          position: "top-center",
        });
        setGameEnded(true);
      } else if (team2.stage === "buenas" && team2.points === MAX_POINTS) {
        toast("¡Ellos ganaron!", {
          description: "La partida ha terminado",
          position: "top-center",
        });
        setGameEnded(true);
      }
    };
    
    checkGameEnd();
  }, [team1, team2]);

  const incrementTeam = (team: "team1" | "team2") => {
    // Si el juego ya terminó, no permitir más cambios
    if (gameEnded) {
      toast("La partida ha terminado. Reinicie para jugar de nuevo.", {
        position: "top-center",
      });
      return;
    }
    
    if (team === "team1") {
      if (team1.stage === "buenas" && team1.points === MAX_POINTS) return;
      
      if (team1.points < MAX_POINTS) {
        setTeam1({ ...team1, points: team1.points + 1 });
      } else {
        setTeam1({ points: 1, stage: "buenas" });
        toast("¡Nosotros están en buenas!", { position: "top-center" });
      }
    } else {
      if (team2.stage === "buenas" && team2.points === MAX_POINTS) return;
      
      if (team2.points < MAX_POINTS) {
        setTeam2({ ...team2, points: team2.points + 1 });
      } else {
        setTeam2({ points: 1, stage: "buenas" });
        toast("¡Ellos están en buenas!", { position: "top-center" });
      }
    }
  };

  const decrementTeam = (team: "team1" | "team2") => {
    // Si el juego ya terminó, no permitir más cambios
    if (gameEnded) {
      toast("La partida ha terminado. Reinicie para jugar de nuevo.", {
        position: "top-center",
      });
      return;
    }
    
    if (team === "team1") {
      if (team1.stage === "buenas" && team1.points === 1) {
        setTeam1({ points: MAX_POINTS, stage: "malas" });
      } else if (team1.points > 0) {
        setTeam1({ ...team1, points: team1.points - 1 });
      }
    } else {
      if (team2.stage === "buenas" && team2.points === 1) {
        setTeam2({ points: MAX_POINTS, stage: "malas" });
      } else if (team2.points > 0) {
        setTeam2({ ...team2, points: team2.points - 1 });
      }
    }
  };

  const resetGame = () => {
    setTeam1({ points: 0, stage: "malas" });
    setTeam2({ points: 0, stage: "malas" });
    setGameEnded(false);
    toast("Partida reiniciada", { position: "top-center" });
  };

  const getSquaresForTeam = (teamState: TeamState) => {
    const fullSquares = Math.floor(teamState.points / 5);
    const remainingPoints = teamState.points % 5;
    
    // Create array of squares
    const squares = [];
    
    // Full squares (5 points each)
    for (let i = 0; i < fullSquares; i++) {
      squares.push(5);
    }
    
    // Partial square (remaining points)
    if (remainingPoints > 0) {
      squares.push(remainingPoints);
    }
    
    return squares;
  };

  const team1Squares = getSquaresForTeam(team1);
  const team2Squares = getSquaresForTeam(team2);

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Header - Modified with responsive text sizes and centered text */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 animate-fade-in">
        <div className="w-1/2 flex justify-center">
          <h1 className={cn(
            "text-lg sm:text-xl md:text-2xl font-semibold text-white transform transition-all duration-300 text-center",
            team1.stage === "buenas" ? "text-yellow-200" : "text-white"
          )}>
            Nosotros {team1.stage === "buenas" ? "(Buenas)" : "(Malas)"}
          </h1>
        </div>
        <div className="w-1/2 flex justify-center">
          <h1 className={cn(
            "text-lg sm:text-xl md:text-2xl font-semibold text-white transform transition-all duration-300 text-center",
            team2.stage === "buenas" ? "text-yellow-200" : "text-white"
          )}>
            Ellos {team2.stage === "buenas" ? "(Buenas)" : "(Malas)"}
          </h1>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex relative">
          {/* Team 1 Side */}
          <div 
            className={cn(
              "w-1/2 p-2 sm:p-4 flex flex-col space-y-2 relative overflow-hidden",
              gameEnded && "pointer-events-none opacity-90"
            )}
            onClick={() => incrementTeam("team1")}
          >
            {team1Squares.map((points, index) => (
              <MatchSquare 
                key={`team1-${index}`} 
                points={points} 
                maxPoints={5}
                isAnimated={true}
              />
            ))}
            <div 
              className="absolute bottom-2 left-2 p-2 bg-black/10 rounded-full z-10" 
              onClick={(e) => {
                e.stopPropagation();
                decrementTeam("team1");
              }}
            >
              <span className="text-white text-2xl font-bold">-</span>
            </div>
          </div>

          {/* Center divider */}
          <div className="w-1 bg-truco-stick shadow-lg" />

          {/* Team 2 Side */}
          <div 
            className={cn(
              "w-1/2 p-2 sm:p-4 flex flex-col space-y-2 relative overflow-hidden",
              gameEnded && "pointer-events-none opacity-90"
            )}
            onClick={() => incrementTeam("team2")}
          >
            {team2Squares.map((points, index) => (
              <MatchSquare 
                key={`team2-${index}`} 
                points={points} 
                maxPoints={5}
                isAnimated={true}
              />
            ))}
            {/* Control buttons for Team 2 - Reposicionados */}
            <div className="absolute right-2 bottom-2 flex flex-col gap-3 items-end z-10">
              {/* Settings Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 mb-2 rounded-full bg-black/10 border-none text-white hover:bg-black/20 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowControls(!showControls);
                }}
              >
                <Settings className="h-6 w-6" />
              </Button>
              
              {/* Reset Button (shows when controls are visible or game ended) */}
              {(showControls || gameEnded) && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full bg-black/10 border-none text-white hover:bg-black/20 transition-all animate-fade-in",
                    gameEnded && "bg-red-500/30 hover:bg-red-500/50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                >
                  <RefreshCcw className="h-6 w-6" />
                </Button>
              )}
              
              {/* Minus Button */}
              <div 
                className="h-12 w-12 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-all" 
                onClick={(e) => {
                  e.stopPropagation();
                  decrementTeam("team2");
                }}
              >
                <span className="text-white text-2xl font-bold">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for game ended */}
      {gameEnded && (
        <div 
          className="absolute inset-0 bg-black/5 pointer-events-none flex items-center justify-center z-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-red-500/20 px-8 py-4 rounded-lg backdrop-blur-sm">
            <p className="text-white text-lg font-bold">Partida finalizada</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCounter;
