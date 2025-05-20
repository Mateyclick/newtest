import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useGameSocket } from '@/contexts/GameSocketContext';
// Corregido el tipo PlayerResultDetail a PlayerPuzzleResultDetail
import { PlayerCurrentPuzzle as PuzzleState, Player, PlayerPuzzleResultDetail } from '@/lib/types/game';


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
  waitingForNextPuzzle: boolean; // Nueva propiedad para controlar la espera del siguiente puzzle
  stayInResultsView: boolean; // Nueva propiedad para mantener al jugador en la vista de resultados
}

interface PlayerProgressInfo {
  id: string;
  nickname: string;
  lastAttemptedMove?: string;
  status: 'solving' | 'completed' | 'failed' | 'waiting' | 'correct_step';
  time?: number;
  opponentMoveSAN?: string;
  moveHistory?: string[]; // Nuevo: historial de movimientos
}

// Interfaz para el payload de results_revealed (debe coincidir con lo que envía el servidor)
// y con lo que ResultsView.tsx espera.
interface ResultsData {
  solution?: string; // Para compatibilidad con formato antiguo
  solutionLines?: Array<{ id: string; moves: string[] | string; points: number; label?: string }>; // Array de movimientos normalizados o string SAN
  leaderboard: Player[];
  playerResults: Record<string, PlayerPuzzleResultDetail>; // Cambiado a PlayerPuzzleResultDetail
  position?: string;
  puzzleIndex?: number;
  puzzleTimer?: number;
  puzzlePoints?: number; // Puntos base (quizás de la línea principal o max)
  hasMultipleSolutions?: boolean;
}

export const useGameSession = (isAdmin: boolean = false) => {
  const { socket, isConnected } = useGameSocket();
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([]);
  const [playerProgressView, setPlayerProgressView] = useState<Record<string, PlayerProgressInfo>>({});
  const [showResultsView, setShowResultsView] = useState(false);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleState | null>(null); // PuzzleState podría ser PlayerCurrentPuzzle
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
    waitingForNextPuzzle: false, // Inicializado como false
    stayInResultsView: false // Inicializado como false
  });

  useEffect(() => {
    if (!socket || !isConnected) {
      // Si no hay socket o no está conectado, resetea el estado de la sesión para evitar datos viejos.
      setGameState({
        puzzleActive: false,
        endTime: 0,
        hasSubmittedOrCompleted: false,
        sessionId: null,
        showResults: false,
        totalPuzzlesInSession: 0,
        currentPuzzleServerIndex: null,
        isFinalRankingActive: false,
        lastMoveCorrect: undefined,
        pointsAwarded: undefined,
        message: undefined,
        waitingForNextPuzzle: false,
        stayInResultsView: false
      });
      setCurrentPuzzle(null);
      setResultsData(null);
      setShowResultsView(false);
      setSessionPlayers([]);
      setError(null); // También podrías limpiar el error o poner uno específico de desconexión.
      return;
    }

    socket.on('session_created', ({ sessionId, initialPlayers, numPuzzles }) => {
      setGameState(prev => ({
        ...prev,
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        currentPuzzleServerIndex: null, // Asegurar que se resetee
        isFinalRankingActive: false, // Asegurar que se resetee
        puzzleActive: false, // Asegurar que se resetee
        showResults: false, // Asegurar que se resetee
        waitingForNextPuzzle: false, // Resetear estado de espera
        stayInResultsView: false // Resetear estado de permanencia en resultados
      }));
      setSessionPlayers(initialPlayers || []);
      setCurrentPuzzle(null); // Limpiar puzzle anterior
      setResultsData(null);  // Limpiar resultados anteriores
      setShowResultsView(false);
    });

    socket.on('session_joined', ({ sessionId, players, currentPuzzleData, numPuzzles, puzzleActiveState, currentEndTime }) => {
      console.log('[useGameSession] session_joined recibido:', { 
        sessionId, 
        currentPuzzleData, 
        puzzleActiveState 
      });
      
      setGameState(prev => ({
        ...prev,
        sessionId,
        totalPuzzlesInSession: numPuzzles || 0,
        puzzleActive: puzzleActiveState || false,
        endTime: currentEndTime || 0,
        currentPuzzleServerIndex: currentPuzzleData && typeof currentPuzzleData.puzzleNumber === 'number'
          ? currentPuzzleData.puzzleNumber -1 // El server envía puzzleNumber 1-based
          : (currentPuzzleData && typeof currentPuzzleData.index === 'number' ? currentPuzzleData.index : null), // Fallback si envía 'index' 0-based
        isFinalRankingActive: false,
        showResults: false, // Si me uno y hay un puzzle activo, no debería ver resultados aún
        waitingForNextPuzzle: !puzzleActiveState, // Si no hay puzzle activo, estamos esperando
        stayInResultsView: false // Resetear estado de permanencia en resultados
      }));
      if (Array.isArray(players)) {
        setSessionPlayers(players);
      }
      if (currentPuzzleData) {
        setCurrentPuzzle(currentPuzzleData); // currentPuzzleData debe ser compatible con PuzzleState/PlayerCurrentPuzzle
      } else {
        setCurrentPuzzle(null); // Si no hay currentPuzzleData, limpiar
      }
      setResultsData(null); // Limpiar resultados al unirse
      setShowResultsView(false);
    });

    socket.on('puzzle_launched', (data) => {
      // El payload 'data' debería ser { puzzle: PlayerCurrentPuzzle, endTime: number }
      const { puzzle, endTime } = data; // puzzle aquí es del tipo PlayerCurrentPuzzle
      if (!data) {
        console.error('[CLIENT_HOOK useGameSession] ERROR en puzzle_launched: No se recibieron datos');
        return;
      }

      if (!puzzle || typeof puzzle.position !== 'string') {
        console.error('[CLIENT_HOOK useGameSession] ERROR en puzzle_launched: Datos del puzzle inválidos:', puzzle);
        return;
      }

      if (typeof endTime !== 'number') {
        console.error('[CLIENT_HOOK useGameSession] ERROR en puzzle_launched: endTime inválido:', endTime);
        return;
      }

      console.log('[useGameSession] puzzle_launched recibido, redirigiendo a vista de puzzle');
      
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
        totalPuzzlesInSession: typeof puzzle.totalPuzzles === 'number' ? puzzle.totalPuzzles : prev.totalPuzzlesInSession,
        currentPuzzleServerIndex: typeof puzzle.index === 'number' ? puzzle.index : ((typeof puzzle.puzzleNumber === 'number') ? puzzle.puzzleNumber - 1 : null),
        isFinalRankingActive: false,
        waitingForNextPuzzle: false, // Ya no estamos esperando, hay un puzzle activo
        stayInResultsView: false // Resetear estado de permanencia en resultados
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
      if (Array.isArray(leaderboard)) {
        setSessionPlayers(leaderboard);
      }
    });

    socket.on('player_joined', ({ player }) => { 
      setSessionPlayers(prev => {
        if (!prev.find(p => p.id === player.id)) { 
          return [...prev, player];
        }
        return prev;
      });
    });

    socket.on('player_left', ({ playerId }) => {
      setSessionPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    socket.on('custom_error', ({ message }) => {
      setError(message);
    });

    if (isAdmin) {
      socket.on('admin_player_progress', ({ playerId, progress }) => {
        setPlayerProgressView(prev => {
          // Obtener el estado actual del jugador
          const currentPlayerInfo = prev[playerId] || { 
            id: playerId, 
            nickname: 'AdminViewPlayer', 
            status: 'waiting',
            moveHistory: [] 
          };
          
          // Crear un nuevo historial de movimientos
          let updatedMoveHistory = [...(currentPlayerInfo.moveHistory || [])];
          
          // Si hay un nuevo movimiento, añadirlo al historial
          if (progress.lastAttemptedMove && 
              (!updatedMoveHistory.includes(progress.lastAttemptedMove))) {
            updatedMoveHistory.push(progress.lastAttemptedMove);
          }
          
          // Actualizar el estado del jugador
          return {
            ...prev,
            [playerId]: {
              ...currentPlayerInfo,
              ...progress,
              moveHistory: updatedMoveHistory
            }
          };
        });
      });
    }

    socket.on('results_revealed', (payload) => {
      console.log('%c[CLIENT_HOOK useGameSession] RAW results_revealed payload:', 'color: deeppink; font-weight: bold;', JSON.stringify(payload, null, 2));

      const {
        solution,
        solutionLines, 
        leaderboard,
        playerResults,
        puzzleIndex,
        position,
        puzzleTimer,
        puzzlePoints, 
        hasMultipleSolutions 
      } = payload as ResultsData; 

      if (typeof puzzleIndex !== 'number') {
        console.error('%c[CLIENT_HOOK useGameSession] ERROR en results_revealed: puzzleIndex inválido o no recibido.', 'color: #dc3545; font-weight: bold;', puzzleIndex);
        setError('Error en datos de resultados: Índice de puzzle inválido.');
        return;
      }

      if (!leaderboard || !playerResults) {
        console.error('%c[CLIENT_HOOK useGameSession] ERROR en results_revealed: leaderboard o playerResults no definidos en el payload.', 'color: #dc3545; font-weight: bold;', payload);
        setError('Error en datos de resultados: Faltan datos de jugadores o leaderboard.');
        setResultsData(null); 
        setShowResultsView(true); 
        return;
      }
      setError(null); 


      if (Array.isArray(leaderboard)) { 
          setSessionPlayers(leaderboard);
      } else {
          console.warn('[CLIENT_HOOK useGameSession] results_revealed: leaderboard no es un array.', leaderboard);
          setSessionPlayers([]); 
      }

      setResultsData({
        solution, 
        solutionLines,
        leaderboard: Array.isArray(leaderboard) ? leaderboard : [], 
        playerResults, 
        puzzleIndex,
        position,
        puzzleTimer,
        puzzlePoints,
        hasMultipleSolutions
      });
      setShowResultsView(true); 

      setGameState(prevGameState => {
        // CORRECCIÓN: Usar prevGameState.totalPuzzlesInSession y un default si es 0.
        const totalPuzzles = prevGameState.totalPuzzlesInSession > 0 ? prevGameState.totalPuzzlesInSession : 1;
        const isLast = (totalPuzzles > 0 && puzzleIndex === totalPuzzles - 1);

        console.log(`%c[CLIENT_HOOK useGameSession] Dentro de setGameState para results_revealed: puzzleIndex=${puzzleIndex}, totalPuzzlesInSession=${totalPuzzles}, Calculado isLast=${isLast}`, 'color: orange; font-weight:bold;');

        const newState = {
          ...prevGameState,
          puzzleActive: false, 
          showResults: true,   
          isFinalRankingActive: isLast, 
          currentPuzzleServerIndex: puzzleIndex,
          waitingForNextPuzzle: !isLast, // Activar espera si no es el último puzzle
          stayInResultsView: true // IMPORTANTE: Mantener al jugador en la vista de resultados
        };
        console.log(`%c[CLIENT_HOOK useGameSession] Nuevo gameState tras results_revealed: ${JSON.stringify(newState, null, 2)}`, 'color: orange; font-weight:bold;');
        return newState;
      });
    });

    // Eliminamos cualquier temporizador o redirección automática
    // El jugador permanecerá en la sala de espera hasta que el admin lance el siguiente puzzle

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
      if (isAdmin) {
        socket.off('admin_player_progress');
      }
      socket.off('results_revealed');
    };
  }, [socket, isConnected, isAdmin, playerProgressView]);

  return {
    gameState,
    setGameState, 
    sessionPlayers,
    currentPuzzle,
    showResultsView,
    setShowResultsView, 
    resultsData,
    error,
    playerProgressView // Exportamos el progreso de los jugadores para el admin
  };
};
