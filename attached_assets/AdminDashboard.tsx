import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import ChessPuzzleSetup from '../components/admin/ChessPuzzleSetup';
import PlayerList from '../components/shared/PlayerList';
import GameSessionInfo from '../components/admin/GameSessionInfo';
import GameControls from '../components/admin/GameControls';
import { Wifi, WifiOff } from 'lucide-react'; // Importar iconos para el estado de conexión

interface Player {
  id?: string;
  nickname: string;
  score: number;
}

interface PlayerProgressInfo {
  id: string;
  nickname: string;
  lastAttemptedMove?: string;
  // Estos son los únicos estados válidos definidos
  status: 'solving' | 'completed' | 'failed' | 'waiting' | 'correct_step'; 
  time?: number;
  opponentMoveSAN?: string;
}

interface PuzzleState {
  position: string;
  mainLine: string;
  timer: number;
  points: number;
}

const AdminDashboard: React.FC = () => {
  const { socket, isConnected } = useSocket();

  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [numPuzzles, setNumPuzzles] = useState(3);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [puzzles, setPuzzles] = useState<Array<PuzzleState>>([]);
  const [sessionPlayers, setSessionPlayers] = useState<Player[]>([]);
  const [playerProgress, setPlayerProgress] = useState<Record<string, PlayerProgressInfo>>({});
  const [puzzleLaunchedAt, setPuzzleLaunchedAt] = useState<number | null>(null);

  const handleCreateSession = () => {
    if (socket && isConnected && !sessionCreated) {
      socket.emit('create_session', { numPuzzles });
    } else if (socket && isConnected && sessionCreated) {
      alert("La sesión ya está creada. Para cambiar el número de problemas, por favor, reinicia la sesión actual o crea una nueva.");
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Si el socket se desconecta, los listeners se quitarán en el cleanup.
    // Si se reconecta, este useEffect se volverá a ejecutar si 'isConnected' está en las dependencias.
    // Por ahora, la lógica principal de listeners solo se activa si 'isConnected' es true al momento de la suscripción.
    if (!isConnected && sessionCreated) {
      console.warn("[AdminDashboard] Socket desconectado, pero había una sesión activa. El estado puede no estar sincronizado.");
    }
    
    const handleSessionCreated = (data: { sessionId: string }) => {
      console.log('[AdminDashboard] Evento session_created recibido:', data);
      setSessionId(data.sessionId);
      setSessionCreated(true);
      const initialPuzzles = Array(numPuzzles).fill(null).map(() => ({
        position: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        mainLine: '',
        timer: 60,
        points: 3
      }));
      setPuzzles(initialPuzzles);
      setSessionPlayers([]); 
      setPlayerProgress({}); 
      setCurrentPuzzleIndex(0);
      setPuzzleActive(false);
      setShowResults(false);
    };

    const handlePlayerJoinedSession = (data: {
        playerId: string; 
        nickname: string; 
        score: number;    
        players: Player[]; 
    }) => {
      console.log('[AdminDashboard] Evento player_joined recibido, data:', data);
      if (data.players && Array.isArray(data.players)) {
        setSessionPlayers(data.players);
      }

      if (data.playerId && data.nickname) {
          setPlayerProgress(prev => {
            // Si el jugador ya tiene progreso, no lo sobreescribimos, solo actualizamos el nickname si es diferente
            // Si es un jugador nuevo, lo añadimos con estado 'waiting'.
            const existingPlayerProgress = prev[data.playerId];
            if (existingPlayerProgress) {
                return {
                    ...prev,
                    [data.playerId]: {
                        ...existingPlayerProgress,
                        nickname: data.nickname, // Actualizar nickname por si acaso
                        // No cambiar 'status' si ya tiene uno (ej. 'solving', 'completed')
                    }
                };
            } else {
                return {
                    ...prev,
                    [data.playerId]: {
                      id: data.playerId,
                      nickname: data.nickname,
                      // Usar 'waiting' ya que este es un estado válido definido en PlayerProgressInfo
                      status: 'waiting', 
                    }
                };
            }
          });
      }
    };
    
    const handlePlayerLeft = (data: {
        playerId: string;
        nickname: string;
        players: Player[]; 
    }) => {
        console.log('[AdminDashboard] Evento player_left recibido:', data.nickname);
        if (data.players && Array.isArray(data.players)) {
            setSessionPlayers(data.players);
        }
        setPlayerProgress(prev => {
            const newState = {...prev};
            delete newState[data.playerId];
            return newState;
        });
    };

    const handleAdminPlayerProgress = (data: {
        playerId: string;
        nickname: string;
        attemptedMoveSAN: string;
        timestamp: number;
        status: 'solving_correct_step' | 'solving_incorrect_step'; // Esto viene del servidor
        opponentMoveSAN?: string;
        // expectedMoveSAN?: string; // Si lo necesitas para mostrar en UI
    }) => {
      console.log('[AdminDashboard] Evento admin_player_progress recibido:', data);
      const timeSoFar = puzzleLaunchedAt ? parseFloat(((data.timestamp - puzzleLaunchedAt) / 1000).toFixed(1)) : undefined;
      setPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: {
          ...(prev[data.playerId] || { id: data.playerId, nickname: data.nickname, status: 'solving' }), // Fallback
          lastAttemptedMove: data.attemptedMoveSAN,
          // Traducir 'solving_incorrect_step' a 'failed' para que coincida con PlayerProgressInfo.status
          status: data.status === 'solving_correct_step' ? 'correct_step' : 'failed', 
          time: timeSoFar,
          opponentMoveSAN: data.opponentMoveSAN,
        }
      }));
    };

    const handlePlayerCompleted = (data: {
        playerId: string;
        nickname: string;
        finalFEN?: string;
        timeTakenMs?: number;
    }) => {
      console.log('[AdminDashboard] Evento player_completed_sequence recibido:', data);
      const timeTakenSec = data.timeTakenMs ? parseFloat((data.timeTakenMs / 1000).toFixed(1)) : undefined;
      setPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: {
          ...(prev[data.playerId] || { id: data.playerId, nickname: data.nickname, status: 'waiting' }), 
          status: 'completed',
          time: timeTakenSec,
          lastAttemptedMove: prev[data.playerId]?.lastAttemptedMove, 
        }
      }));
    };

    const handlePlayerFailed = (data: { // Este evento es cuando el jugador falla la secuencia completa
        playerId: string;
        nickname: string;
        lastAttemptedMove?: string;
    }) => {
      console.log('[AdminDashboard] Evento player_failed_sequence recibido:', data);
      const timeNow = puzzleLaunchedAt ? parseFloat(((Date.now() - puzzleLaunchedAt) / 1000).toFixed(1)) : undefined;
      setPlayerProgress(prev => ({
        ...prev,
        [data.playerId]: {
          ...(prev[data.playerId] || { id: data.playerId, nickname: data.nickname, status: 'waiting' }),
          status: 'failed',
          time: timeNow,
          lastAttemptedMove: data.lastAttemptedMove || prev[data.playerId]?.lastAttemptedMove,
        }
      }));
    };

    const handlePuzzleLaunchedForAdmin = (data: { puzzle: PuzzleState, endTime: number }) => { // Asumiendo que 'data' tiene esta forma
      console.log('[AdminDashboard] Evento puzzle_launched (detectado por admin) recibido:', data);
      setPuzzleActive(true);
      setShowResults(false);
      const launchedTime = Date.now();
      setPuzzleLaunchedAt(launchedTime);

      // Resetear el progreso de todos los jugadores a 'waiting'
      const newProgress: Record<string, PlayerProgressInfo> = {};
      sessionPlayers.forEach(player => { // Usar sessionPlayers del estado
        if (player.id) { 
            newProgress[player.id] = {
                id: player.id,
                nickname: player.nickname,
                status: 'waiting', 
                // time, lastAttemptedMove, opponentMoveSAN se resetean al no definirse aquí
            };
        }
      });
      setPlayerProgress(newProgress);
      console.log('[AdminDashboard] Progreso de jugadores reseteado para nuevo puzzle.');
    };

    // Registrar listeners solo si el socket está conectado
    if (isConnected && socket) {
        console.log('[AdminDashboard] Socket conectado, registrando listeners de eventos. Socket ID:', socket.id);
        socket.on('session_created', handleSessionCreated);
        socket.on('player_joined', handlePlayerJoinedSession); 
        socket.on('player_left', handlePlayerLeft); 
        socket.on('admin_player_progress', handleAdminPlayerProgress);
        socket.on('player_completed_sequence', handlePlayerCompleted);
        socket.on('player_failed_sequence', handlePlayerFailed);
        socket.on('puzzle_launched', handlePuzzleLaunchedForAdmin); 
    }


    return () => {
      // Siempre intentar quitar listeners del socket si existe
      if (socket) {
        console.log('[AdminDashboard] Limpiando listeners de socket.');
        socket.off('session_created', handleSessionCreated);
        socket.off('player_joined', handlePlayerJoinedSession);
        socket.off('player_left', handlePlayerLeft);
        socket.off('admin_player_progress', handleAdminPlayerProgress);
        socket.off('player_completed_sequence', handlePlayerCompleted);
        socket.off('player_failed_sequence', handlePlayerFailed);
        socket.off('puzzle_launched', handlePuzzleLaunchedForAdmin);
      }
    };
  // Dependencias: 'socket' para el setup/cleanup.
  // 'isConnected' para re-ejecutar si el estado de conexión cambia (y registrar/quitar listeners).
  // 'numPuzzles' porque handleSessionCreated lo usa para inicializar el array de puzzles.
  // 'sessionPlayers' y 'puzzleActive': Se usan en handlePuzzleLaunchedForAdmin y handlePlayerJoinedSession para inicializar/actualizar playerProgress.
  // Es importante que los handlers que dependen de estos estados tengan la última versión.
  }, [socket, isConnected, numPuzzles, sessionPlayers, puzzleActive, puzzleLaunchedAt]); // Añadido puzzleLaunchedAt ya que algunos handlers lo usan.

  const updatePuzzle = (puzzleData: PuzzleState) => {
    if (!socket || !sessionId || !puzzles || !isConnected) return;
    const updatedPuzzles = [...puzzles];
    if (updatedPuzzles[currentPuzzleIndex]) {
      updatedPuzzles[currentPuzzleIndex] = puzzleData;
      setPuzzles(updatedPuzzles);
    } else if (puzzles.length === 0 && currentPuzzleIndex === 0) {
      updatedPuzzles[0] = { ...puzzleData };
      setPuzzles(updatedPuzzles);
    }
    socket.emit('update_puzzle', {
      sessionId,
      puzzleIndex: currentPuzzleIndex,
      puzzle: puzzleData
    });
  };

  const launchPuzzle = () => {
    if (!socket || !sessionId || !puzzles || puzzles.length === 0 || !isConnected) {
        alert('No se puede lanzar el problema. Verifica la conexión o la configuración de la sesión.');
        return;
    }
    const currentPuzzleDetails = puzzles[currentPuzzleIndex];
    // Corregido: mainLine puede ser un string vacío, lo cual es válido si luego se normaliza.
    // La validación de que no esté vacío realmente debería ser que el array normalizado no esté vacío.
    if (!currentPuzzleDetails || !currentPuzzleDetails.position || typeof currentPuzzleDetails.mainLine !== 'string') {
      alert('Por favor, configura primero el problema con una posición FEN y una línea principal de jugadas (SAN).');
      return;
    }
    // La validación de si la línea principal es realmente útil (no vacía después de normalizar) se hace en el servidor.
    socket.emit('launch_puzzle', {
      sessionId,
      puzzleIndex: currentPuzzleIndex
    });
  };

  const revealResults = () => {
    if (!socket || !sessionId || !isConnected) return;
    socket.emit('reveal_results', { sessionId }); 
    setShowResults(true);
    setPuzzleActive(false); 
  };

  const nextPuzzle = () => {
    if (!socket || !sessionId || !isConnected) return;
    if (currentPuzzleIndex < numPuzzles - 1) { 
      const nextIdx = currentPuzzleIndex + 1;
      setCurrentPuzzleIndex(nextIdx);
      setPuzzleActive(false); 
      setShowResults(false);
      setPlayerProgress({}); // Resetear progreso visual para el siguiente puzzle
      setPuzzleLaunchedAt(null); // Resetear tiempo de lanzamiento
      socket.emit('next_puzzle', { sessionId }); 
    } else {
      alert('Este es el último problema de la sesión. Puedes revelar resultados o terminar la sesión.');
    }
  };

  const resetSession = () => {
    const isFinalPuzzleAndResultsShown = showResults && (currentPuzzleIndex === numPuzzles - 1);

    if (isFinalPuzzleAndResultsShown) {
      if (socket && sessionId && isConnected) { // Asegurarse de que esté conectado para emitir
        console.log(`[AdminDashboard] Admin está FINALIZANDO la sesión: ${sessionId}`);
        // Emitir el evento que el servidor espera para la finalización (si lo implementamos)
        socket.emit('admin_finalize_session', { sessionId }); 
      } else {
        console.warn("[AdminDashboard] No se puede finalizar la sesión, socket no conectado o sin sessionId.");
      }
    } else {
      console.log("[AdminDashboard] Admin está REINICIANDO la configuración de la sesión localmente.");
    }

    // Resetear el estado local del admin en CUALQUIER caso de 'resetSession'
    setSessionCreated(false);
    setSessionId('');
    setCurrentPuzzleIndex(0);
    setPuzzleActive(false);
    setSessionPlayers([]);
    setPlayerProgress({});
    setShowResults(false);
    setPuzzles([]);
    setNumPuzzles(3); 
    setPuzzleLaunchedAt(null);
    console.log("AdminDashboard: Estado local reseteado por el admin.");
  };

  if (!isConnected && !sessionCreated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-pulse text-lg text-yellow-600 font-medium flex items-center">
          <WifiOff size={24} className="mr-2" /> {/* Icono añadido aquí */}
          Conectando al servidor para iniciar...
        </div>
      </div>
    );
  }

  const defaultPuzzleData: PuzzleState = {
    position: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    mainLine: '',
    timer: 60,
    points: 3,
  };

  const currentPuzzleDataForChild: PuzzleState =
    (puzzles && puzzles.length > currentPuzzleIndex && puzzles[currentPuzzleIndex])
      ? puzzles[currentPuzzleIndex]
      : defaultPuzzleData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* SECCIÓN DEL TÍTULO Y EL INDICADOR DE CONEXIÓN */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Trebejos Game - Panel de Administración
            </h1>
            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-300
              ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}
            >
              {isConnected ? <Wifi size={16} className="mr-2" /> : <WifiOff size={16} className="mr-2" />}
              {isConnected ? 'Conectado al Servidor' : 'Desconectado - Intentando...'}
            </div>
          </div>
          {/* FIN DE SECCIÓN DEL TÍTULO E INDICADOR */}
          
          {!sessionCreated ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto flex items-center gap-3">
                <label htmlFor="numPuzzlesInput" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Número de Problemas:
                </label>
                <input
                  type="number"
                  id="numPuzzlesInput"
                  value={numPuzzles}
                  onChange={(e) => setNumPuzzles(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="px-3 py-2 border border-gray-300 rounded-lg w-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCreateSession}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!isConnected} 
              >
                Crear Sesión ({numPuzzles} Problemas)
              </button>
              {/* Mensaje si no está conectado Y NO hay sesión creada (este es el original) */}
              {!isConnected && !sessionCreated && 
                <span className="text-sm text-yellow-600">
                  Esperando conexión para crear sesión...
                </span>
              }
               {/* Mensaje si no está conectado PERO SÍ había una sesión creada */}
              {!isConnected && sessionCreated && (
                <span className="text-sm text-orange-600">
                  Conexión perdida. La sesión podría no estar operativa.
                </span>
              )}
            </div>
          ) : (
            <GameSessionInfo
              sessionId={sessionId}
              currentPuzzleIndex={currentPuzzleIndex}
              totalPuzzles={numPuzzles} 
              puzzleActive={puzzleActive}
              showResults={showResults}
            />
          )}
        </div>

        {sessionCreated && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Configuración del Problema (#{currentPuzzleIndex + 1} de {numPuzzles}) 
                </h2>
                <ChessPuzzleSetup
                  puzzle={currentPuzzleDataForChild}
                  onUpdate={updatePuzzle}
                  disabled={puzzleActive || showResults || !isConnected} 
                />
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <GameControls
                    puzzleActive={puzzleActive}
                    showResults={showResults}
                    isLastPuzzle={currentPuzzleIndex === numPuzzles - 1} 
                    onLaunch={launchPuzzle}
                    onReveal={revealResults}
                    onNext={nextPuzzle}
                    onReset={resetSession}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Jugadores Conectados ({(sessionPlayers || []).length})
                </h2>
                <PlayerList players={sessionPlayers || []} />
              </div>

              {(puzzleActive || showResults) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Progreso Jugadores (Problema #{currentPuzzleIndex + 1})
                  </h2>
                  {Object.keys(playerProgress).length > 0 ? (
                    <div className="space-y-3">
                      {sessionPlayers.map(player => {
                        const progress = player.id ? playerProgress[player.id] : undefined;
                        if (!progress || !player.id) return null; 

                        return (
                          <div
                            key={progress.id}
                            className={`p-4 rounded-lg border-l-4 ${
                              progress.status === 'completed' ? 'border-green-500 bg-green-50' :
                              progress.status === 'failed' ? 'border-red-500 bg-red-50' :
                              progress.status === 'correct_step' ? 'border-blue-500 bg-blue-50' :
                              'border-gray-300 bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="font-semibold text-gray-800">{progress.nickname}</span>
                              <span className={`text-xs font-medium px-3 py-1 rounded-full inline-flex items-center justify-center ${
                                progress.status === 'completed' ? 'bg-green-200 text-green-700' :
                                progress.status === 'failed' ? 'bg-red-200 text-red-700' :
                                progress.status === 'correct_step' ? 'bg-blue-200 text-blue-700' :
                                progress.status === 'solving' ? 'bg-yellow-200 text-yellow-700' : 
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {progress.status === 'waiting' ? 'Esperando...' :
                                 progress.status === 'solving' ? `Intentando (${progress.lastAttemptedMove || 'N/A'})` : // Para 'solving_incorrect_step'
                                 progress.status === 'correct_step' ? `OK (${progress.lastAttemptedMove || 'N/A'})${progress.opponentMoveSAN ? ` | Op: ${progress.opponentMoveSAN}` : ''}` :
                                 progress.status === 'completed' ? `Completado (${(progress.time || 0).toFixed(1)}s)` :
                                 progress.status === 'failed' ? `Falló (${progress.lastAttemptedMove || 'N/A'}) (${(progress.time || 0).toFixed(1)}s)` : 
                                 progress.status} {/* Dejar solo progress.status si no se encuentra un 'idle' */}
                              </span>
                            </div>
                            {(progress.status === 'waiting' || progress.status === 'solving' || progress.status === 'correct_step') && puzzleLaunchedAt && puzzleActive && (
                              <div className="text-xs text-gray-500 mt-2">
                                Tiempo: {((Date.now() - puzzleLaunchedAt) / 1000).toFixed(1)}s
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {puzzleActive ? "Esperando actividad de los jugadores." : "El problema no está activo o no hay jugadores con progreso."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;