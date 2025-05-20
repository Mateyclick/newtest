import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Eye, RotateCcw, Award } from 'lucide-react'; // Eliminado ArrowRight

export interface GameControlsProps {
  puzzleActive: boolean;
  showResults: boolean;
  
  // Props necesarias para la lógica del botón de lanzamiento
  currentPuzzleIndexForSetup: number;
  launchedPuzzlesHistory: number[];

  isLastPuzzle: boolean;
  isFinalRankingActive: boolean;
  hasPuzzlesBeenPlayed: boolean; 

  onLaunchPuzzle: () => void;
  onRevealResults: () => void;
  // ELIMINADA: onPrepareNextStepByStepPuzzle: () => void; 
  onShowFinalRanking: () => void;
  onResetSession: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  puzzleActive,
  showResults,
  currentPuzzleIndexForSetup,
  launchedPuzzlesHistory,
  isLastPuzzle,
  isFinalRankingActive,
  hasPuzzlesBeenPlayed,
  onLaunchPuzzle,
  onRevealResults,
  // ELIMINADA: onPrepareNextStepByStepPuzzle,
  onShowFinalRanking,
  onResetSession,
}) => {
  const baseButtonClass = "px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold";

  // Lógica para el botón "Lanzar Problema Configurado":
  // 1. No debe haber un puzzle activo en la sesión globalmente.
  // 2. El puzzle que se está configurando (currentPuzzleIndexForSetup) NO debe estar en launchedPuzzlesHistory.
  // 3. No se debe estar mostrando el ranking final.
  const canLaunchCurrentSetup = 
    !puzzleActive &&                                  
    !launchedPuzzlesHistory.includes(currentPuzzleIndexForSetup) && 
    !isFinalRankingActive;                            

  // Lógica para "Revelar Resultados":
  const showRevealButton = puzzleActive && !showResults && !isFinalRankingActive;
  
  // ELIMINADA: showNextStepByStepButton y su lógica asociada.

  const showFinalRankingButton = !isFinalRankingActive && (showResults || (!puzzleActive && hasPuzzlesBeenPlayed));
  const showResetButton = isFinalRankingActive;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center my-6 p-3 bg-muted/30 dark:bg-muted/50 rounded-lg border shadow-sm">
      {canLaunchCurrentSetup && (
        <Button
          onClick={onLaunchPuzzle}
          className={`bg-green-600 hover:bg-green-700 text-green-foreground ${baseButtonClass}`}
          // Se podría añadir un disabled aquí si currentPuzzleIndexForSetup >= numPuzzlesInput,
          // pero AdminView debería prevenir que se llegue a ese estado para lanzar.
        >
          <PlayCircle size={18} className="mr-2" />
          Lanzar Problema Configurado
        </Button>
      )}

      {showRevealButton && (
        <Button
          onClick={onRevealResults}
          className={`bg-blue-600 hover:bg-blue-700 text-blue-foreground ${baseButtonClass}`}
        >
          <Eye size={18} className="mr-2" />
          Revelar Resultados
        </Button>
      )}

      {/* BOTÓN "SIGUIENTE PROBLEMA (PREPARAR)" Y SU LÓGICA ELIMINADOS */}
      
      {showFinalRankingButton && (
         <Button
          onClick={onShowFinalRanking}
          variant="outline"
          className={`${baseButtonClass} border-amber-500 text-amber-600 hover:bg-amber-500/10`}
        >
          <Award size={18} className="mr-2" />
          Terminar y Ver Ranking
        </Button>
      )}

      {showResetButton && (
        <Button
          onClick={onResetSession}
          variant="destructive"
          className={`${baseButtonClass} bg-red-600 hover:bg-red-700`}
        >
          <RotateCcw size={18} className="mr-2" />
          Reiniciar Sesión
        </Button>
      )}
    </div>
  );
};

export default GameControls;