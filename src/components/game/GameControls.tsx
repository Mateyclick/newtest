
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Eye, ArrowRight, RotateCcw } from 'lucide-react';

export interface GameControlsProps {
  puzzleActive: boolean;
  showResults: boolean;
  isLastPuzzle: boolean;
  isFinalRankingActive: boolean;
  onLaunchPuzzle: () => void;
  onRevealResults: () => void;
  onNextPuzzle: () => void;
  onResetSession: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  puzzleActive,
  showResults,
  isLastPuzzle,
  isFinalRankingActive,
  onLaunchPuzzle,
  onRevealResults,
  onNextPuzzle,
  onResetSession,
}) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center my-4">
      {isFinalRankingActive ? (
        <Button onClick={onResetSession} variant="destructive" className="bg-red-600 hover:bg-red-700">
          <RotateCcw size={20} className="mr-2" />
          Terminar Sesión Definitivamente
        </Button>
      ) : showResults ? (
        !isLastPuzzle ? (
          <Button onClick={onNextPuzzle} className="bg-purple-600 hover:bg-purple-700">
            <ArrowRight size={20} className="mr-2" />
            Siguiente Problema
          </Button>
        ) : (
          <Button onClick={onResetSession} variant="outline">
            <RotateCcw size={20} className="mr-2" />
            Terminar Sesión (Fallback)
          </Button>
        )
      ) : puzzleActive ? (
        <Button onClick={onRevealResults} className="bg-blue-600 hover:bg-blue-700">
          <Eye size={20} className="mr-2" />
          Revelar Resultados
        </Button>
      ) : (
        <Button onClick={onLaunchPuzzle} className="bg-green-600 hover:bg-green-700">
          <PlayCircle size={20} className="mr-2" />
          Lanzar Problema
        </Button>
      )}
    </div>
  );
};

export default GameControls;
