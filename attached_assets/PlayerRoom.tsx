import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import WaitingRoom from '../components/player/WaitingRoom';
import PuzzleView from '../components/player/PuzzleView'; // Asegúrate que esta es la NUEVA versión de PuzzleView
import ResultsView from '../components/player/ResultsView';
import { RssIcon as ChessIcon } from 'lucide-react';

interface Player {
  id?: string; 
  nickname: string;
  score: number;
}

interface PlayerResult {
  playerId: string;
  nickname: string;
  answer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timeTaken: number | null;
}

interface PuzzleData {
  position: string;
  timer: number;
  points: number;
}

// Interfaz para el estado 'results' (ahora 'resultsForDisplay')
interface ResultsDisplayData {
  solution: string;
  leaderboard: Player[];
  playerResults: PlayerResult[];
}

const PlayerRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // ESTADOS PARA EL NICKNAME MODIFICADOS/AÑADIDOS
  const [nicknameInput, setNicknameInput] = useState(''); // Para el campo de texto del formulario
  const [activeNickname, setActiveNickname] = useState(''); // Para el nickname usado en el juego/auto-join

  const [isJoined, setIsJoined] = useState(false);
  const [uiError, setUiError] = useState('');
  const [attemptedAutoJoin, setAttemptedAutoJoin] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [initialPuzzleData, setInitialPuzzleData] = useState<PuzzleData | null>(null);
  const [currentFEN, setCurrentFEN] = useState<string | null>(null);
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [sequenceCompleted, setSequenceCompleted] = useState(false);
  const [sequenceFailed, setSequenceFailed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Cambiado 'results' a 'resultsForDisplay' y usando la interfaz definida
  const [resultsForDisplay, setResultsForDisplay] = useState<ResultsDisplayData | null>(null);
  const [sessionHasConcluded, setSessionHasConcluded] = useState(false); // Para el ranking final especial

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [opponentLastMove, setOpponentLastMove] = useState<string | null>(null);

  // Efecto para cargar el nickname de sessionStorage al montar
  useEffect(() => {
    const storedNickname = sessionStorage.getItem('playerNickname');
    if (storedNickname && storedNickname.trim() !== '') {
      // Establecer ambos: activeNickname para el intento de auto-join
      // y nicknameInput para pre-rellenar el formulario si es necesario.
      setActiveNickname(storedNickname);
      setNicknameInput(storedNickname); 
      console.log(`PlayerRoom: Nickname cargado desde sessionStorage: "${storedNickname}" para activeNickname.`);
    }
    setAttemptedAutoJoin(true); // Indicar que el intento de cargar de sessionStorage ha ocurrido
  }, []); // Array vacío para que se ejecute solo una vez al montar

  // Efecto para el auto-join (si hay un activeNickname de sessionStorage)
  useEffect(() => {
    if (socket && isConnected && sessionId && activeNickname.trim() !== '' && !isJoined && attemptedAutoJoin) {
      console.log(`PlayerRoom: Intentando AUTO-JOIN con activeNickname: "${activeNickname}", sessionId: "${sessionId}"`);
      socket.emit('join_session', { sessionId, nickname: activeNickname.trim() });
      // No se necesita 'isJoined' en las dependencias aquí para que solo intente una vez con el nickname de sessionStorage.
      // Si el auto-join falla (ej. nickname tomado), el usuario usará el formulario.
    }
  }, [socket, isConnected, sessionId, activeNickname, attemptedAutoJoin]); // Depende de activeNickname


  // Handler para el envío del FORMULARIO del nickname
  const handleJoinSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNicknameFromInput = nicknameInput.trim();
    if (!trimmedNicknameFromInput) {
      setUiError('Por favor, ingresa un apodo');
      return;
    }
    
    sessionStorage.setItem('playerNickname', trimmedNicknameFromInput);
    // No necesitamos setear activeNickname aquí directamente si el flujo es que el servidor lo confirme.
    // Simplemente emitimos con el nickname del input.
    // setActiveNickname(trimmedNicknameFromInput); // Opcional: actualizar activeNickname inmediatamente

    if (socket && isConnected && sessionId) {
      console.log(`PlayerRoom: Uniéndose con FORMULARIO. Nickname: "${trimmedNicknameFromInput}", SessionID: "${sessionId}"`);
      socket.emit('join_session', { sessionId, nickname: trimmedNicknameFromInput });
    }
  };

  const handlePlayerMoveAttempt = (moveSAN: string) => {
    if (!socket || !sessionId || sequenceCompleted || sequenceFailed || !puzzleActive) {
      console.log('PlayerRoom: handlePlayerMoveAttempt bloqueado. Condiciones:', {
        socketExists: !!socket,
        sessionIdExists: !!sessionId,
        sequenceCompleted,
        sequenceFailed,
        puzzleActive,
      });
      return;
    }
    console.log('PlayerRoom: Jugada recibida de PuzzleView (vía handlePlayerMoveAttempt):', moveSAN);
    socket.emit('submit_answer', { sessionId, answer: moveSAN });
    setFeedbackMessage('Procesando tu jugada...');
  };


  useEffect(() => {
    if (!socket) return;

    const handleSessionJoined = (data: Partial<{
      sessionId: string;
      nickname: string; // Nickname confirmado/asignado por el servidor
      players: Player[];
      puzzleActive: boolean;
      currentPuzzle: PuzzleData | null;
      endTime?: number | null;
    }>) => {
      console.log('PlayerRoom: Evento "session_joined" recibido', data);
      if (!data || typeof data.nickname !== 'string' || data.nickname.trim() === '') {
        console.error('PlayerRoom: "session_joined" recibido con nickname inválido o faltante.', data);
        setUiError('Error al unirse: datos del servidor incompletos.');
        setIsJoined(false); // Asegurar que isJoined sea false si falla
        return;
      }
      setIsJoined(true);
      setActiveNickname(data.nickname); // CONFIRMAR activeNickname con el del servidor
      setNicknameInput(data.nickname);  // Sincronizar el input también
      setPlayers(data.players || []); 
      setUiError('');
      setSessionHasConcluded(false); // Resetear para nueva sesión

      if (data.puzzleActive && data.currentPuzzle) {
        setInitialPuzzleData(data.currentPuzzle);
        setCurrentFEN(data.currentPuzzle.position || null);
        setPuzzleActive(true);
        setEndTime(data.endTime || null);
        setShowResults(false);
        setResultsForDisplay(null);
      } else {
        setPuzzleActive(false);
        setInitialPuzzleData(null);
        setCurrentFEN(null);
        setEndTime(null);
        setShowResults(false);
        setResultsForDisplay(null);
      }
    };

    const handlePlayerJoined = (data: {
        playerId: string;
        nickname: string; // Nickname del jugador que se unió
        score: number;
        players: Player[]; // Lista actualizada de todos los jugadores
    }) => {
      console.log('PlayerRoom: Evento "player_joined" (otro jugador) recibido', data);
      setPlayers(data.players || []); 
    };

    const handlePuzzleLaunched = (data: {
      puzzle: PuzzleData;
      endTime: number;
    }) => {
      console.log('PlayerRoom: Evento "puzzle_launched" recibido', data);
      setInitialPuzzleData(data.puzzle);
      setCurrentFEN(data.puzzle.position);
      setPuzzleActive(true);
      setEndTime(data.endTime);
      setShowResults(false);
      setResultsForDisplay(null);
      setUiError('');
      setFeedbackMessage('¡Tu turno! Realiza tu movimiento.');
      setOpponentLastMove(null);
      setSequenceCompleted(false);
      setSequenceFailed(false);
      setSessionHasConcluded(false);
    };

    const handleStepSuccessOpponentMoved = (data: {
        newFEN: string;
        opponentMoveSAN: string;
        nextStepForPlayer: boolean;
    }) => {
        console.log('PlayerRoom: Evento "puzzle_step_success_opponent_moved" recibido', data);
        setCurrentFEN(data.newFEN);
        setOpponentLastMove(data.opponentMoveSAN);
        if (data.nextStepForPlayer) {
            setFeedbackMessage(`¡Correcto! Oponente jugó ${data.opponentMoveSAN}. ¡Tu turno!`);
        } else {
             setFeedbackMessage(`¡Correcto! Oponente jugó ${data.opponentMoveSAN}. Secuencia podría estar completa.`);
        }
    };

    const handleStepFailed = (data: { attemptedMove: string }) => {
        console.log('PlayerRoom: Evento "puzzle_step_failed" recibido', data);
        setFeedbackMessage(`Jugada incorrecta: ${data.attemptedMove}. Intento fallido para este problema.`);
        setSequenceFailed(true);
    };

    const handleSequenceComplete = (data: { playerId?: string; nickname?: string; finalFEN?: string }) => {
        console.log('PlayerRoom: Evento "player_completed_sequence" o "puzzle_sequence_complete" recibido', data);
        // Comparamos con activeNickname que es el nickname "confirmado" en la sesión
        if (data.playerId === socket.id || (data.nickname && data.nickname === activeNickname)) {
            setFeedbackMessage('¡Secuencia completada exitosamente! Esperando resultados.');
            setSequenceCompleted(true);
            if(data.finalFEN) setCurrentFEN(data.finalFEN);
        }
    };

    const handlePlayerCompletedSequence = (data: {playerId: string, nickname: string}) => {
        if (data.nickname !== activeNickname) { // Comparar con activeNickname
            console.log(`Jugador ${data.nickname} ha completado la secuencia.`);
        }
    };
    
    const handlePlayerFailedSequence = (data: { playerId: string; nickname: string }) => {
        console.log('PlayerRoom: Evento "player_failed_sequence" recibido', data);
        if (data.playerId === socket.id || (data.nickname && data.nickname === activeNickname)) { // Comparar con activeNickname
            // Si es el propio jugador, sequenceFailed ya se maneja en handleStepFailed
            if (data.nickname !== activeNickname) { // Redundante si playerId es el mismo, pero seguro
                console.log(`Jugador ${data.nickname} ha fallado la secuencia.`);
            }
        } else { // Si es otro jugador
            console.log(`Jugador ${data.nickname} (otro) ha fallado la secuencia.`);
        }
    };

    const handleResultsRevealed = (data: {
      solution: string;
      leaderboard: Player[]; 
      playerResults: PlayerResult[];
    }) => {
      console.log('PlayerRoom: Evento "results_revealed" recibido', data);
      // Actualizamos resultsForDisplay
      setResultsForDisplay({
          solution: data.solution,
          leaderboard: data.leaderboard,
          playerResults: data.playerResults,
      });
      setShowResults(true);
      setPuzzleActive(false);

      if (data.leaderboard) {
        setPlayers(data.leaderboard.map(p => ({
            id: p.id, 
            nickname: p.nickname,
            score: p.score
        })));
        console.log('[PlayerRoom] Estado `players` actualizado con leaderboard:', data.leaderboard);
      }
    };

    const handleAdvancedToNextPuzzle = () => {
      console.log('PlayerRoom: Evento "advanced_to_next_puzzle" recibido');
      setPuzzleActive(false);
      setInitialPuzzleData(null);
      setCurrentFEN(null);
      setEndTime(null);
      setShowResults(false); 
      setResultsForDisplay(null);
      setUiError('');
      setFeedbackMessage('Esperando el siguiente problema...');
      setOpponentLastMove(null);
      setSequenceCompleted(false);
      setSequenceFailed(false);
      setSessionHasConcluded(false); // MUY IMPORTANTE: Resetear flag de conclusión
    };

    // Renombrado de handleSessionEnded a handleSessionCompleted
    const handleSessionCompleted = (data: { message: string; leaderboard: Player[] }) => {
      console.log('PlayerRoom: Evento "session_completed" (FIN DE SESIÓN) recibido.', data);
      setSessionHasConcluded(true); 
      setPuzzleActive(false);      
      
      setResultsForDisplay(prevResults => ({
        solution: prevResults?.solution || "¡Fin de la Sesión!", 
        playerResults: prevResults?.playerResults || [],
        leaderboard: data.leaderboard, 
      }));
      setShowResults(true); 
      setFeedbackMessage(data.message); 
    };

    const handleErrorEvent = (data: { message: string }) => {
      console.error('PlayerRoom: Error recibido del servidor:', data.message);
      setUiError(data.message);
    };

    socket.on('session_joined', handleSessionJoined);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('puzzle_launched', handlePuzzleLaunched);
    socket.on('puzzle_step_success_opponent_moved', handleStepSuccessOpponentMoved);
    socket.on('puzzle_step_failed', handleStepFailed);
    socket.on('player_completed_sequence', handleSequenceComplete);
    socket.on('player_failed_sequence', handlePlayerFailedSequence);
    socket.on('results_revealed', handleResultsRevealed); 
    socket.on('advanced_to_next_puzzle', handleAdvancedToNextPuzzle);
    socket.on('session_completed', handleSessionCompleted); // Listener con el nombre de handler correcto
    socket.on('error', handleErrorEvent);

    return () => {
      socket.off('session_joined', handleSessionJoined);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('puzzle_launched', handlePuzzleLaunched);
      socket.off('puzzle_step_success_opponent_moved', handleStepSuccessOpponentMoved);
      socket.off('puzzle_step_failed', handleStepFailed);
      socket.off('player_completed_sequence', handleSequenceComplete);
      socket.off('player_failed_sequence', handlePlayerFailedSequence);
      socket.off('results_revealed', handleResultsRevealed);
      socket.off('advanced_to_next_puzzle', handleAdvancedToNextPuzzle);
      socket.off('session_completed', handleSessionCompleted); // Cleanup con el nombre correcto
      socket.off('error', handleErrorEvent);
    };
  // La dependencia 'nickname' original del useEffect de sockets se refería al estado 'nickname'
  // que ahora es 'nicknameInput' para el campo de texto. 
  // 'activeNickname' es el que se usa para unirse y el confirmado.
  // Considerar qué nickname es relevante para este useEffect masivo. 
  // Si las comparaciones internas usan activeNickname, podría ser más estable.
  // Si alguna lógica realmente depende del 'nicknameInput' cambiante, tendría que revisarse.
  // Por ahora, lo dejo con activeNickname para consistencia con la lógica de unión.
  }, [socket, navigate, activeNickname]); 

  const handleNavigateHome = () => {
    sessionStorage.removeItem('playerNickname');
    setActiveNickname(''); 
    setNicknameInput('');  
    setIsJoined(false);
    setUiError('');
    setAttemptedAutoJoin(false); 
    setPlayers([]);
    setInitialPuzzleData(null);
    setCurrentFEN(null);
    setPuzzleActive(false);
    setEndTime(null);
    setSequenceCompleted(false);
    setSequenceFailed(false);
    setShowResults(false);
    setResultsForDisplay(null);
    setFeedbackMessage(null);
    setOpponentLastMove(null);
    setSessionHasConcluded(false); 
    navigate('/');
  };

  if (!isJoined && attemptedAutoJoin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <ChessIcon size={60} className="text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Unirse a Sesión: <span className="font-mono">{sessionId}</span>
          </h1>
          {!isConnected ? (
            <p className="text-center text-yellow-600">Conectando al servidor...</p>
          ) : (
            // CAMBIO: onSubmit ahora usa handleJoinSessionSubmit
            <form onSubmit={handleJoinSessionSubmit} className="space-y-4">
              <div>
                <label htmlFor="nicknameInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Tu Apodo
                </label>
                <input
                  type="text"
                  id="nicknameInput"
                  value={nicknameInput} // CAMBIO: value usa nicknameInput
                  onChange={(e) => { setNicknameInput(e.target.value); setUiError(''); }} // CAMBIO: onChange actualiza nicknameInput
                  placeholder="Ingresa tu apodo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {uiError && <p className="text-red-500 text-sm text-center">{uiError}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Unirse
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!isConnected && isJoined) { 
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <ChessIcon size={48} className="text-red-600 animate-ping mb-4" />
            <p className="text-xl font-semibold text-gray-700">Conexión perdida con el servidor.</p>
            <p className="text-gray-500">Intentando reconectar... Revisa tu conexión o espera.</p>
        </div>
    );
  } else if (!isConnected) { 
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <ChessIcon size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-xl font-semibold text-gray-700">Conectando al servidor de Trebejos Game...</p>
            <p className="text-gray-500">Por favor, espera un momento.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Trebejos Game - Sesión de Tácticas</h1>
          <p className="text-gray-600">
            ID de Sesión: <span className="font-mono">{sessionId}</span> •
            Jugando como: <span className="font-semibold">{activeNickname}</span> {/* CAMBIO: Mostrar activeNickname */}
          </p>
          {uiError && <p className="text-sm text-red-600 mt-2">{uiError}</p>}
          {opponentLastMove && !showResults && (
            <p className="text-sm text-blue-600 mt-2">Oponente jugó: <span className="font-mono">{opponentLastMove}</span></p>
          )}
          {feedbackMessage && (
             <p className={`text-sm mt-2 ${
                sessionHasConcluded ? 'text-yellow-700 font-semibold' : 
                (sequenceFailed ? 'text-red-600' : 
                (sequenceCompleted ? 'text-green-600' : 'text-gray-700'))
             }`}>
               {feedbackMessage}
             </p>
          )}
          {sessionHasConcluded && resultsForDisplay && resultsForDisplay.leaderboard && resultsForDisplay.leaderboard.length > 0 && resultsForDisplay.leaderboard[0].nickname === activeNickname && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                <p className="font-semibold text-yellow-600">
                    ¡Felicidades {activeNickname}, eres el campeón de la sesión!
                </p>
            </div>
          )}
        </div>

        {showResults && resultsForDisplay ? (
          <ResultsView
            solution={resultsForDisplay.solution}
            leaderboard={resultsForDisplay.leaderboard}
            playerResults={resultsForDisplay.playerResults}
            currentPlayerNickname={activeNickname} // CAMBIO: Usar activeNickname
            isFinalRanking={sessionHasConcluded}
            onGoHome={handleNavigateHome}
          />
        ) : puzzleActive && initialPuzzleData && currentFEN ? (
          <PuzzleView
            position={currentFEN}
            points={initialPuzzleData.points}
            endTime={endTime || 0}
            onMoveAttempt={handlePlayerMoveAttempt}
            hasSubmittedOrCompleted={sequenceCompleted || sequenceFailed}
            puzzleActive={puzzleActive}
          />
        ) : (
          <WaitingRoom players={players} />
        )}
      </div>
    </div>
  );
};

export default PlayerRoom;