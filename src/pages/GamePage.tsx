// src/pages/GamePage.tsx
import React, { useState, useEffect, useCallback } from 'react'; 
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/hooks/useGameSession'; // Asegúrate que la ruta sea correcta
import InitialChoiceView from '@/components/game/InitialChoiceView';
import AdminView from '@/components/game/AdminView';

// Nuevas importaciones para el flujo del jugador
import JoinSessionView from '@/components/game/JoinSessionView';
import PlayerView from '@/components/game/PlayerView'; // Este es tu actual PuzzleView.tsx
import ResultsView from '@/components/game/ResultsView';
import WaitingRoom from '@/components/game/WaitingRoom';
import { Player } from '@/lib/types/game'; // Para WaitingRoom

const GamePage: React.FC = () => {
  const { isConnected, socket } = useGameSocket();
  const { user, profile } = useAuth();
  const [view, setView] = useState<'initial_choice' | 'player_view' | 'admin_view'>('initial_choice');

  // Usamos el hook useGameSession para obtener el estado del juego
  // isAdmin se pasa como false por defecto si no se especifica.
  const { gameState, currentPuzzle, showResultsView, resultsData, sessionPlayers, error: gameSessionError } = useGameSession();

  const isAdmin = profile?.roles?.site_admin === true; //
  // Tus console.log existentes de GamePage para depuración
  console.log('[GamePage] User object:', user); //
  console.log('[GamePage] Profile object:', profile); //
  console.log('[GamePage] Is admin?', isAdmin); //
  console.log('[GamePage] GameState from useGameSession:', gameState);
  console.log('[GamePage] CurrentPuzzle from useGameSession:', currentPuzzle);


  if (!isConnected) {
    return <div className="text-center p-8">Conectando al servidor de juego...</div>;
  }

  if (view === 'initial_choice') {
    return <InitialChoiceView onViewChange={setView} isAdmin={isAdmin} />; //
  }

  if (view === 'player_view') {
    // Aquí está la lógica crucial para el jugador
    if (!gameState.sessionId) {
      // 1. Si no hay ID de sesión, significa que el jugador necesita unirse a una.
      return <JoinSessionView />;
    } else if (gameState.puzzleActive && currentPuzzle) {
      // 2. Si hay un ID de sesión Y un puzzle está activo Y tenemos los datos del puzzle.
      return <PlayerView // PlayerView es tu PuzzleView.tsx
        position={currentPuzzle.position}
        points={currentPuzzle.points} // Esto viene de PlayerCurrentPuzzle
        endTime={gameState.endTime}
        onMoveAttempt={(moveSAN) => {
          if (socket && gameState.sessionId) {
            socket.emit('submit_answer', { sessionId: gameState.sessionId, move: moveSAN });
          }
        }}
        hasSubmittedOrCompleted={gameState.hasSubmittedOrCompleted}
        puzzleActive={gameState.puzzleActive}
        lastMoveCorrect={gameState.lastMoveCorrect}
        message={gameState.message}
        pointsAwarded={gameState.pointsAwarded}
        // Asegúrate que puzzleIndex y totalPuzzles vengan correctamente de currentPuzzle
        // El servidor envía puzzle.puzzleNumber (1-based) o puzzle.index (0-based)
        puzzleIndex={(currentPuzzle.puzzleNumber !== undefined ? currentPuzzle.puzzleNumber - 1 : currentPuzzle.index) ?? 0}
        totalPuzzles={currentPuzzle.totalPuzzles ?? 0}
      />;
    } else if (showResultsView && resultsData) {
      // 3. Si se deben mostrar los resultados.
      const currentPlayerNickname = profile?.display_name || user?.email || 'Yo';
      return <ResultsView results={resultsData} currentPlayerNickname={currentPlayerNickname} isFinalRanking={gameState.isFinalRankingActive} />;
    } else {
      // 4. Si está en una sesión, pero no hay puzzle activo ni resultados,
      //    entonces está en la sala de espera.
      return <WaitingRoom
                players={sessionPlayers as Player[]} // Hacer type assertion si es necesario
                currentPuzzleIndex={gameState.currentPuzzleServerIndex !== null ? gameState.currentPuzzleServerIndex : undefined}
                totalPuzzles={gameState.totalPuzzlesInSession > 0 ? gameState.totalPuzzlesInSession : undefined}
            />;
    }
  }

  if (view === 'admin_view') {
    if (!isAdmin) {
      console.log('[GamePage] Unauthorized admin access attempt, redirecting to initial choice'); //
      setView('initial_choice'); // O 'player_view' si prefieres
      // No renderizar nada aquí o un mensaje de "No autorizado" brevemente antes de la redirección de estado
      return <div className="text-center p-8">Acceso no autorizado. Redirigiendo...</div>;
    }
    return <AdminView />; //
  }

  // Fallback por si algo inesperado ocurre
  return (
    <div className="section-container p-8 text-center">
      <h1>Vista no implementada o estado del juego inesperado.</h1>
      <p>Por favor, intenta volver a la <button onClick={() => setView('initial_choice')} className="text-blue-500 underline">página de selección inicial</button>.</p>
    </div>
  );
};

export default GamePage;