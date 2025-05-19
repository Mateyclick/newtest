import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useGameSocket } from '@/contexts/GameSocketContext';
import { PuzzleState, Player, PlayerResultDetail } from '@/lib/types/game';

interface GameSessionState {
  puzzleActive: boolean;
  endTime: number;
  hasSubmittedOrCompleted: boolean;
  sessionId: string | null;
  lastMoveCorrect?: boolean;
  pointsAwarded?: number;
  message?: string;
  showResults: boolean;
  totalPuzzlesInSession: number;
  currentPuzzleServerIndex: number | null;
  isFinalRankingActive: boolean;
}

interface PlayerProgressInfo {
  id: string;
  nickname: string;
  lastAttemptedMove?: string;
  status: 'solving' | 'completed' | 'failed' | 'waiting' | 'correct_step';
  time?: number;
  opponentMoveSAN?: string;
}

interface ResultsData {
  solution: string;
  leaderboard: Player[];
  playerResults: Record<string, PlayerResultDetail>;
  position?: string;
  puzzleIndex?: number;
  puzzleTimer?: number;
  puzzlePoints?: number;
}

export const useGameSession = (isAdmin: boolean = false) => {
  const { socket, isConnected } = useGameSocket();
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([]);
  const [playerProgressView, setPlayerProgressView] = useState<Record<string, PlayerProgressInfo>>({});
  const [showResultsView, setShowResultsView] = useState(false);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameSessionState>({
    puzzleActive: false,
    endTime: 0,
    hasSubmittedOrCompleted: false,
    sessionId: null,
    showResults: false,
    totalPuzzlesInSession: 0,
    currentPuzzleServerIndex: null,
    isFinalRankingActive: false
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('session_created', ({ sessionId, initialPlayers, numPuzzles }) => {
      setGameState(prev => ({ 
        ...prev, 
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        currentPuzzleServerIndex: null,
        isFinalRankingActive: false
      }));
      setSessionPlayers(initialPlayers || []);
    });

    socket.on('session_joined', ({ sessionId, players, currentPuzzleData, numPuzzles, puzzleActiveState, currentEndTime }) => {
      setGameState(prev => ({
        ...prev,
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        puzzleActive: puzzleActiveState || false,
        endTime: currentEndTime || 0,
        currentPuzzleServerIndex: currentPuzzleData && typeof currentPuzzleData.puzzleNumber === 'number' 
          ? currentPuzzleData.puzzleNumber - 1
          : null,
        isFinalRankingActive: false
      }));
      if (Array.isArray(players)) {
        setSessionPlayers(players);
      }
      if (currentPuzzleData) {
        setCurrentPuzzle(currentPuzzleData);
      }
    });

    socket.on('puzzle_launched', (data) => {
      const { puzzle, endTime } = data;
      if (!data) {
        console.error('[CLIENT_HOOK useGameSession] ERROR: No se recibieron datos');
        return;
      }

      if (!puzzle || typeof puzzle.position !== 'string') {
        console.error('[CLIENT_HOOK useGameSession] ERROR: Datos del puzzle inválidos:', puzzle);
        return;
      }

      if (typeof endTime !== 'number') {
        console.error('[CLIENT_HOOK useGameSession] ERROR: endTime inválido:', endTime);
        return;
      }

      setCurrentPuzzle(puzzle);
      setShowResultsView(false);
      setResultsData(null);
      setGameState(prev => ({
        ...prev,
        puzzleActive: true,
        endTime,
        hasSubmittedOrCompleted: false,
        lastMoveCorrect: undefined,
        pointsAwarded: undefined,
        message: undefined,
        showResults: false,
        totalPuzzlesInSession: puzzle.totalPuzzles || prev.totalPuzzlesInSession,
        currentPuzzleServerIndex: (typeof puzzle.puzzleNumber === 'number') ? puzzle.puzzleNumber - 1 : null,
        isFinalRankingActive: false
      }));
    });

    socket.on('move_result', ({ correct, nextPosition, message, pointsAwarded }) => {
      if (correct && nextPosition) {
        setCurrentPuzzle(prev => {
          if (!prev) {
            console.error("[useGameSession] Cannot update currentPuzzle.position when currentPuzzle is null");
            return null;
          }
          return { ...prev, position: nextPosition };
        });
      }
      setGameState(prev => ({
        ...prev,
        lastMoveCorrect: correct,
        message,
        pointsAwarded: correct ? pointsAwarded : undefined,
        hasSubmittedOrCompleted: !nextPosition
      }));
    });

    socket.on('puzzle_step_success_opponent_moved', ({ newPosition }) => {
      setCurrentPuzzle(prev => {
        if (!prev) {
          console.error("[useGameSession] Intento de actualizar posición del oponente cuando 'currentPuzzle' es null.");
          return null;
        }
        return { ...prev, position: newPosition };
      });
    });

    socket.on('player_completed_sequence', ({ points, message }) => {
      setGameState(prev => ({
        ...prev,
        hasSubmittedOrCompleted: true,
        lastMoveCorrect: true,
        pointsAwarded: points,
        message
      }));
    });

    socket.on('player_failed_sequence', ({ message }) => {
      setGameState(prev => ({
        ...prev,
        hasSubmittedOrCompleted: true,
        lastMoveCorrect: false,
        message
      }));
    });

    socket.on('leaderboard_updated', ({ leaderboard }) => {
      setSessionPlayers(leaderboard);
      const newProgressView: Record<string, PlayerProgressInfo> = {};
      leaderboard.forEach((player: Player) => {
        const existingProgress = playerProgressView[player.id] || {};
        newProgressView[player.id] = {
          ...existingProgress,
          id: player.id,
          nickname: player.nickname,
          status: existingProgress.status || 'waiting'
        };
      });
      setPlayerProgressView(newProgressView);
    });

    socket.on('player_joined', ({ player }) => {
      setSessionPlayers(prev => {
        if (!prev.find(p => p.id === player.id)) {
          return [...prev, player];
        }
        return prev;
      });
      setPlayerProgressView(prev => ({
        ...prev,
        [player.id]: { id: player.id, nickname: player.nickname, status: 'waiting' }
      }));
    });

    socket.on('player_left', ({ playerId }) => {
      setSessionPlayers(prev => prev.filter(p => p.id !== playerId));
      setPlayerProgressView(prev => {
        const newProgress = { ...prev };
        delete newProgress[playerId];
        return newProgress;
      });
    });

    socket.on('custom_error', ({ message }) => {
      setError(message);
    });

    if (isAdmin) {
      socket.on('admin_player_progress', ({ playerId, progress }) => {
        setPlayerProgressView(prev => ({
          ...prev,
          [playerId]: { ...prev[playerId], ...progress }
        }));
      });
    }

    socket.on('results_revealed', ({ 
      solution, 
      leaderboard, 
      playerResults, 
      puzzleIndex,
      position, 
      puzzleTimer, 
      puzzlePoints 
    }) => {
      console.log(`%c[CLIENT_HOOK useGameSession] Evento "results_revealed" RECIBIDO. Payload: ${JSON.stringify({ puzzleIndex, position, etc: '...' }, null, 2)}`, 'color: deeppink; font-weight: bold;');

      if (typeof puzzleIndex !== 'number') {
        console.error('%c[CLIENT_HOOK useGameSession] ERROR en results_revealed: puzzleIndex inválido o no recibido.', 'color: #dc3545; font-weight: bold;', puzzleIndex);
        return;
      }

      setSessionPlayers(leaderboard);
      setResultsData({ 
        solution, 
        leaderboard, 
        playerResults,
        puzzleIndex, 
        position,
        puzzleTimer,
        puzzlePoints
      });
      setShowResultsView(true);

      setGameState(prevGameState => {
        const isLast = (prevGameState.totalPuzzlesInSession > 0 && 
                       puzzleIndex === prevGameState.totalPuzzlesInSession - 1);
        
        console.log(`%c[CLIENT_HOOK useGameSession] Dentro de setGameState para results_revealed: puzzleIndex=${puzzleIndex}, prevGameState.totalPuzzlesInSession=${prevGameState.totalPuzzlesInSession}, Calculado isLast=${isLast}`, 'color: orange; font-weight:bold;');
        
        const newState = { 
          ...prevGameState, 
          puzzleActive: false, 
          showResults: true,
          isFinalRankingActive: isLast,
          currentPuzzleServerIndex: puzzleIndex
        };
        console.log(`%c[CLIENT_HOOK useGameSession] Nuevo gameState tras results_revealed: ${JSON.stringify(newState, null, 2)}`, 'color: orange; font-weight:bold;');
        return newState;
      });
    });

    return () => {
      socket.off('session_created');
      socket.off('session_joined');
      socket.off('puzzle_launched');
      socket.off('move_result');
      socket.off('puzzle_step_success_opponent_moved');
      socket.off('player_completed_sequence');
      socket.off('player_failed_sequence');
      socket.off('leaderboard_updated');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('custom_error');
      socket.off('admin_player_progress');
      socket.off('results_revealed');
    };
  }, [socket, isConnected, isAdmin]);

  return {
    gameState,
    setGameState,
    sessionPlayers,
    currentPuzzle,
    showResultsView,
    setShowResultsView,
    resultsData,
    error
  };
};