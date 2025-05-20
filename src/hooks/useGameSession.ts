import { useState, useEffect } from 'react'; // Importaciones de React necesarias
import { Socket } from 'socket.io-client'; 
import { useGameSocket } from '@/contexts/GameSocketContext';
import { PlayerCurrentPuzzle as PuzzleState, Player, PlayerPuzzleResultDetail } from '@/lib/types/game';

// Definiciones de Interfaces (como en tu archivo original)
interface GameSessionState {
  puzzleActive: boolean;
  endTime: number;
  hasSubmittedOrCompleted: boolean;
  sessionId: string | null;
  lastMoveCorrect?: boolean;
  pointsAwarded?: number;
  message?: string;
  showResults: boolean; // Para el estado interno del juego
  totalPuzzlesInSession: number;
  currentPuzzleServerIndex: number | null;
  isFinalRankingActive: boolean;
  waitingForNextPuzzle: boolean;
  stayInResultsView: boolean;
}

interface PlayerProgressInfo {
  id: string;
  nickname: string;
  lastAttemptedMove?: string;
  status: 'solving' | 'completed' | 'failed' | 'waiting' | 'correct_step';
  time?: number;
  opponentMoveSAN?: string;
  moveHistory?: string[];
}

interface ResultsData {
  solution?: string;
  solutionLines?: Array<{ id: string; moves: string[] | string; points: number; label?: string }>;
  leaderboard: Player[];
  playerResults: Record<string, PlayerPuzzleResultDetail>;
  position?: string;
  puzzleIndex?: number;
  puzzleTimer?: number;
  puzzlePoints?: number;
  hasMultipleSolutions?: boolean;
}

export const useGameSession = (isAdmin: boolean = false) => {
  const { socket, isConnected } = useGameSocket();
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([]);
  const [playerProgressView, setPlayerProgressView] = useState<Record<string, PlayerProgressInfo>>({});
  const [showResultsView, setShowResultsView] = useState(false); // Estado local para controlar la vista de resultados en GamePage
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
    isFinalRankingActive: false,
    waitingForNextPuzzle: false,
    stayInResultsView: false
  });

  console.log('%c[useGameSession Hook Values]', 'color: dodgerblue; font-weight: bold;', {
    gs_sessionId: gameState.sessionId,
    gs_puzzleActive: gameState.puzzleActive,
    gs_showResults_in_gameState: gameState.showResults,
    gs_currentPuzzleServerIndex: gameState.currentPuzzleServerIndex,
    gs_waitingForNextPuzzle: gameState.waitingForNextPuzzle,
    gs_stayInResultsView: gameState.stayInResultsView,
    cp_currentPuzzle: currentPuzzle,
    srs_showResultsView_localState: showResultsView, 
    isConnected: isConnected,
    isAdmin: isAdmin,
  });

  useEffect(() => {
    if (!socket) {
      console.warn('[useGameSession] No socket instance. Waiting for socket.');
      return;
    }

    if (!isConnected) {
      console.warn('[useGameSession] Socket disconnected. Potentially resetting non-persistent state.');
      if (gameState.sessionId) {
        setGameState(prev => ({
          ...prev,
          puzzleActive: false,
          endTime: 0,
          hasSubmittedOrCompleted: false,
          lastMoveCorrect: undefined,
          pointsAwarded: undefined,
          message: undefined,
          showResults: false,
          isFinalRankingActive: false,
          waitingForNextPuzzle: true, 
          stayInResultsView: false,
        }));
        setCurrentPuzzle(null);
        setError("Conexión perdida. Intentando reconectar...");
      }
      return;
    } else {
      if (error === "Conexión perdida. Intentando reconectar...") {
        setError(null); 
      }
    }

    console.log('[useGameSession] useEffect: Setting up socket listeners. isConnected:', isConnected);

    const handleSessionCreated = ({ sessionId, initialPlayers, numPuzzles }: { sessionId: string; initialPlayers: Player[]; numPuzzles: number }) => {
      console.log('%c[CLIENT EVENT] session_created', 'color: green; font-weight: bold;', { sessionId, numPuzzles });
      setGameState(prev => ({
        ...prev,
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        currentPuzzleServerIndex: null,
        isFinalRankingActive: false,
        puzzleActive: false,
        showResults: false,
        waitingForNextPuzzle: false,
        stayInResultsView: false,
        message: undefined, lastMoveCorrect: undefined, pointsAwarded: undefined, hasSubmittedOrCompleted: false,
      }));
      setSessionPlayers(initialPlayers || []);
      setCurrentPuzzle(null);
      setResultsData(null);
      setShowResultsView(false);
      setError(null);
    };

    const handleSessionJoined = ({ sessionId, players, currentPuzzleData, numPuzzles, puzzleActiveState, currentEndTime }: { sessionId: string; players: Player[]; currentPuzzleData: PuzzleState | null; numPuzzles: number; puzzleActiveState: boolean; currentEndTime: number }) => {
      console.log('%c[CLIENT EVENT] session_joined', 'color: green; font-weight: bold;', { sessionId, puzzleActiveState, numPuzzles, currentPuzzleData });
      setGameState(prev => ({
        ...prev,
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        puzzleActive: puzzleActiveState || false,
        endTime: currentEndTime || 0,
        currentPuzzleServerIndex: currentPuzzleData?.index ?? (currentPuzzleData?.puzzleNumber !== undefined ? currentPuzzleData.puzzleNumber - 1 : null),
        isFinalRankingActive: false,
        showResults: false, 
        waitingForNextPuzzle: !!sessionId && !puzzleActiveState,
        stayInResultsView: false,
        message: undefined, lastMoveCorrect: undefined, pointsAwarded: undefined, hasSubmittedOrCompleted: false,
      }));
      if (Array.isArray(players)) {
        setSessionPlayers(players);
      }
      if (currentPuzzleData && puzzleActiveState) {
        setCurrentPuzzle(currentPuzzleData);
      } else {
        setCurrentPuzzle(null);
      }
      setResultsData(null);
      setShowResultsView(false);
      setError(null);
    };

    const handlePuzzleLaunched = (data: { puzzle: PuzzleState; endTime: number }) => {
      console.log('%c[CLIENT EVENT] puzzle_launched', 'color: green; font-weight: bold;', data); //
      const { puzzle, endTime } = data;
      if (!puzzle || typeof puzzle.position !== 'string' || typeof endTime !== 'number') {
        console.error('[useGameSession] ERROR en puzzle_launched: Datos inválidos.', data);
        setError("Error al lanzar el puzzle: datos inválidos del servidor.");
        return;
      }
      console.log('[useGameSession] puzzle_launched process: Valid data. Setting states.'); //
      setCurrentPuzzle(puzzle);
      setShowResultsView(false); 
      setResultsData(null);
      setGameState(prev => {
        const newPuzzleIndex = puzzle.index ?? (puzzle.puzzleNumber !== undefined ? puzzle.puzzleNumber - 1 : prev.currentPuzzleServerIndex);
        console.log(`%c[useGameSession] puzzle_launched - Actualizando gameState: newPuzzleIndex=${newPuzzleIndex}, puzzleActive=true, showResults=false`, 'color: orange; font-weight:bold;'); //
        return {
          ...prev,
          puzzleActive: true,
          endTime,
          hasSubmittedOrCompleted: false,
          lastMoveCorrect: undefined,
          pointsAwarded: undefined,
          message: undefined,
          showResults: false, 
          totalPuzzlesInSession: puzzle.totalPuzzles ?? prev.totalPuzzlesInSession,
          currentPuzzleServerIndex: newPuzzleIndex,
          isFinalRankingActive: false,
          waitingForNextPuzzle: false,
          stayInResultsView: false 
        };
      });
      setError(null);
    };

    const handleResultsRevealed = (payload: ResultsData) => {
      console.log('%c[CLIENT EVENT] results_revealed', 'color: green; font-weight: bold;', payload);
      const { puzzleIndex, leaderboard, playerResults } = payload; 
      if (typeof puzzleIndex !== 'number' || !leaderboard || !playerResults) {
        console.error('[useGameSession] ERROR en results_revealed: Datos inválidos.', payload);
        setError("Error al mostrar resultados: datos inválidos del servidor.");
        return;
      }
      setResultsData(payload);
      setShowResultsView(true); 
      setGameState(prev => {
        const totalPuzzles = prev.totalPuzzlesInSession > 0 ? prev.totalPuzzlesInSession : 1;
        const isLast = (totalPuzzles > 0 && puzzleIndex === totalPuzzles - 1);
        console.log(`%c[useGameSession] results_revealed - Actualizando gameState: puzzleIndex=${puzzleIndex}, isLast=${isLast}, puzzleActive=false, showResults=true`, 'color: orange; font-weight:bold;');
        return {
          ...prev,
          puzzleActive: false,
          showResults: true, 
          isFinalRankingActive: isLast,
          currentPuzzleServerIndex: puzzleIndex,
          waitingForNextPuzzle: !isLast,
          stayInResultsView: true 
        };
      });
      setError(null);
    };

    const handleMoveResult = ({ correct, nextPosition, message, pointsAwarded }: { correct: boolean; nextPosition?: string; message?: string; pointsAwarded?: number }) => {
        if (correct && nextPosition) {
            setCurrentPuzzle(prev => prev ? { ...prev, position: nextPosition } : null);
        }
        setGameState(prev => ({ ...prev, lastMoveCorrect: correct, message, pointsAwarded: correct ? pointsAwarded : undefined }));
    };

    const handleOpponentMoved = ({ newPosition }: { newPosition: string }) => {
        setCurrentPuzzle(prev => prev ? { ...prev, position: newPosition } : null);
    };

    const handlePlayerCompleted = ({ points, message }: { points: number; message: string }) => {
        setGameState(prev => ({ ...prev, hasSubmittedOrCompleted: true, lastMoveCorrect: true, pointsAwarded: points, message }));
    };

    const handlePlayerFailed = ({ message }: { message: string }) => {
        setGameState(prev => ({ ...prev, hasSubmittedOrCompleted: true, lastMoveCorrect: false, message }));
    };

    const handleLeaderboardUpdated = ({ leaderboard }: { leaderboard: Player[] }) => {
        if (Array.isArray(leaderboard)) setSessionPlayers(leaderboard);
    };

    const handlePlayerJoinedLobby = ({ player }: { player: Player }) => { 
        setSessionPlayers(prev => prev.find(p => p.id === player.id) ? prev : [...prev, player]);
    };

    const handlePlayerLeftLobby = ({ playerId }: { playerId: string }) => {
        setSessionPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    const handleCustomError = ({ message }: { message: string }) => {
        setError(message);
    };

    const handleAdminPlayerProgress = ({ playerId, progress }: { playerId: string; progress: Partial<PlayerProgressInfo> }) => {
        setPlayerProgressView(prev => {
            const currentPlayerInfo = prev[playerId] || { id: playerId, nickname: 'Unknown', status: 'waiting', moveHistory: [] };
            let updatedMoveHistory = [...(currentPlayerInfo.moveHistory || [])];
            if (progress.lastAttemptedMove && !updatedMoveHistory.includes(progress.lastAttemptedMove)) {
                updatedMoveHistory.push(progress.lastAttemptedMove);
            }
            return { ...prev, [playerId]: { ...currentPlayerInfo, ...progress, moveHistory: updatedMoveHistory } };
        });
    };

    socket.on('session_created', handleSessionCreated);
    socket.on('session_joined', handleSessionJoined);
    socket.on('puzzle_launched', handlePuzzleLaunched);
    socket.on('results_revealed', handleResultsRevealed);
    socket.on('move_result', handleMoveResult);
    socket.on('puzzle_step_success_opponent_moved', handleOpponentMoved);
    socket.on('player_completed_sequence', handlePlayerCompleted);
    socket.on('player_failed_sequence', handlePlayerFailed);
    socket.on('leaderboard_updated', handleLeaderboardUpdated);
    socket.on('player_joined', handlePlayerJoinedLobby);
    socket.on('player_left', handlePlayerLeftLobby);
    socket.on('custom_error', handleCustomError);
    if (isAdmin) {
      socket.on('admin_player_progress', handleAdminPlayerProgress);
    }

    return () => {
      console.log('[useGameSession] useEffect: Cleaning up socket listeners.'); //
      socket.off('session_created', handleSessionCreated);
      socket.off('session_joined', handleSessionJoined);
      socket.off('puzzle_launched', handlePuzzleLaunched);
      socket.off('results_revealed', handleResultsRevealed);
      socket.off('move_result', handleMoveResult);
      socket.off('puzzle_step_success_opponent_moved', handleOpponentMoved);
      socket.off('player_completed_sequence', handlePlayerCompleted);
      socket.off('player_failed_sequence', handlePlayerFailed);
      socket.off('leaderboard_updated', handleLeaderboardUpdated);
      socket.off('player_joined', handlePlayerJoinedLobby);
      socket.off('player_left', handlePlayerLeftLobby);
      socket.off('custom_error', handleCustomError);
      if (isAdmin) {
        socket.off('admin_player_progress', handleAdminPlayerProgress);
      }
    };
  }, [socket, isConnected, isAdmin, error]); 

  return {
    gameState,
    // setGameState, 
    sessionPlayers,
    currentPuzzle,
    setGameState,
    showResultsView, 
    setShowResultsView, // <--- ESTA LÍNEA ESTÁ AHORA DESCOMENTADA
    resultsData,
    error,
    playerProgressView
  };
};