import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import GameSessionInfo from './GameSessionInfo';
import PuzzleView from './PuzzleView';
import WaitingRoom from './WaitingRoom';
import ResultsView from './ResultsView';
import { useState } from 'react';

const PlayerView: React.FC = () => {
  const { socket } = useGameSocket();
  const { user, profile } = useAuth();
  const { gameState, sessionPlayers, showResultsView, resultsData, currentPuzzle } = useGameSession();

  const [availableSessions, setAvailableSessions] = useState<Array<{
    id: string;
    name: string;
    playerCount: number;
  }>>([]);
  const [joinSessionIdInput, setJoinSessionIdInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinSession = (sessionIdToJoin: string) => {
    setJoinError(null);
    socket?.emit('join_session', { sessionId: sessionIdToJoin });
  };

  const handleRefreshSessions = () => {
    socket?.emit('get_available_sessions');
  };

  const handleMoveAttempt = (moveSAN: string) => {
    if (gameState.sessionId && !gameState.hasSubmittedOrCompleted) {
      socket?.emit('submit_answer', {
        sessionId: gameState.sessionId,
        answer: moveSAN
      });
    }
  };

  console.log('[PlayerView] Renderizando. gameState:', {
    sessionId: gameState.sessionId,
    puzzleActive: gameState.puzzleActive,
    currentPuzzle,
    showResultsView,
    isFinalRankingActive: gameState.isFinalRankingActive
  });

  if (!gameState.sessionId) {
    console.log('[PlayerView] DECISIÓN: Mostrando UI para Unirse a Sesión.');
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Unirse a una Sesión de Tácticas
        </h1>

        <div className="max-w-md mx-auto space-y-8">
          {availableSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sesiones Disponibles</h2>
                <Button onClick={handleRefreshSessions} variant="outline" size="sm">
                  Actualizar Lista
                </Button>
              </div>
              <div className="space-y-3">
                {availableSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">{session.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {session.id} • {session.playerCount} jugadores
                      </div>
                    </div>
                    <Button onClick={() => handleJoinSession(session.id)}>
                      Unirse
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold">Unirse por ID de Sesión</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={joinSessionIdInput}
                onChange={(e) => setJoinSessionIdInput(e.target.value)}
                placeholder="Ingresa el ID de la sesión"
                className="w-full rounded-md border p-2"
              />
              <Button
                onClick={() => handleJoinSession(joinSessionIdInput)}
                className="w-full"
              >
                Unirse con ID
              </Button>
            </div>
            {joinError && (
              <div className="text-red-500 text-sm mt-2">{joinError}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <GameSessionInfo
        sessionId={gameState.sessionId}
        currentPuzzleIndex={gameState.currentPuzzleServerIndex !== null ? gameState.currentPuzzleServerIndex : -1}
        totalPuzzles={gameState.totalPuzzlesInSession}
        puzzleActive={gameState.puzzleActive}
        showResults={showResultsView}
      />

      {showResultsView && resultsData ? (
        <ResultsView
          results={resultsData}
          currentPlayerNickname={profile?.display_name || user?.email || 'Jugador'}
          isFinalRanking={gameState.isFinalRankingActive}
        />
      ) : gameState.puzzleActive && currentPuzzle?.position ? (
        <PuzzleView
          position={currentPuzzle.position}
          points={currentPuzzle.points}
          endTime={gameState.endTime}
          onMoveAttempt={handleMoveAttempt}
          hasSubmittedOrCompleted={gameState.hasSubmittedOrCompleted}
          puzzleActive={gameState.puzzleActive}
          lastMoveCorrect={gameState.lastMoveCorrect}
          message={gameState.message}
          pointsAwarded={gameState.pointsAwarded}
        />
      ) : (
        <WaitingRoom 
          players={sessionPlayers}
          currentPuzzleIndex={gameState.currentPuzzleServerIndex !== null ? gameState.currentPuzzleServerIndex : -1}
          totalPuzzles={gameState.totalPuzzlesInSession}
        />
      )}
    </div>
  );
};

export default PlayerView;