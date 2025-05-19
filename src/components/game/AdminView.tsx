import { useState, useEffect } from 'react';
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { PuzzleState } from '@/lib/types/game';
import { PlayerList } from './PlayerList';
import GameSessionInfo from './GameSessionInfo';
import ChessPuzzleSetup from './ChessPuzzleSetup';
import GameControls from './GameControls';
import {
  useLoadSiteTactics,
  useLoadUserSavedTactics,
  useSaveCurrentSetupAsUserTactic
} from '@/hooks/tacticsUtils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

const AdminView: React.FC = () => {
  const { socket, isConnected } = useGameSocket();
  const { gameState, sessionPlayers, setGameState, setShowResultsView } = useGameSession(true);
  const { user } = useAuth();

  const [numPuzzlesInput, setNumPuzzlesInput] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [puzzlesConfig, setPuzzlesConfig] = useState<PuzzleState[]>([]);
  const [currentPuzzleIndexForSetup, setCurrentPuzzleIndexForSetup] = useState(0);
  const [puzzleNameInput, setPuzzleNameInput] = useState('');
  const [puzzleDescriptionInput, setPuzzleDescriptionInput] = useState('');
  const [puzzleDifficultyInput, setPuzzleDifficultyInput] = useState('medio');
  const [puzzleTagsInput, setPuzzleTagsInput] = useState('');

  useEffect(() => {
    if (gameState.sessionId) {
      const defaultPuzzles: PuzzleState[] = Array(numPuzzlesInput)
        .fill(null)
        .map((_, index) => ({
          position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          mainLine: '',
          timer: 60,
          points: 100
        }));
      setPuzzlesConfig(defaultPuzzles);
      setCurrentPuzzleIndexForSetup(0);
    }
  }, [gameState.sessionId, numPuzzlesInput]);

  const {
    siteTags,
    siteTacticsForSelectedTag,
    selectedSiteTag,
    isLoadingTactics,
    loadSiteTags,
    handleSiteTagChange,
    applySiteTacticToSetup
  } = useLoadSiteTactics(setPuzzlesConfig, currentPuzzleIndexForSetup);

  const {
    userSavedTacticsList,
    loadUserSavedTactics,
    applyUserTacticToSetup
  } = useLoadUserSavedTactics(setPuzzlesConfig, currentPuzzleIndexForSetup, user?.id || '');

  const { handleSaveCurrentSetupAsUserTactic } = useSaveCurrentSetupAsUserTactic(
    puzzlesConfig,
    currentPuzzleIndexForSetup,
    puzzleNameInput,
    user?.id || '',
    puzzleDescriptionInput,
    puzzleDifficultyInput,
    puzzleTagsInput
  );

  const handleCreateSession = () => {
    if (!socket || !isConnected) {
      setError('No hay conexión con el servidor');
      return;
    }
    if (!user) {
      setError('Debes estar autenticado para crear una sesión');
      return;
    }
    socket.emit('create_session', { numPuzzles: numPuzzlesInput });
    setError(null);
  };

  const handleLaunchPuzzle = () => {
    console.log(`%c[ADMIN_CLIENT] handleLaunchPuzzle INVOCADO`, 'color: #007bff; font-weight: bold; font-size: 1.1em;');
    console.log(`%c[ADMIN_CLIENT] Estado actual: isConnected=${isConnected}, gameState.sessionId=${gameState.sessionId}, currentPuzzleIndexForSetup=${currentPuzzleIndexForSetup}, puzzlesConfig.length=${puzzlesConfig?.length}`, 'color: #17a2b8;');

    if (puzzlesConfig && puzzlesConfig.length > currentPuzzleIndexForSetup && puzzlesConfig[currentPuzzleIndexForSetup]) {
      console.log(`%c[ADMIN_CLIENT] Puzzle a lanzar (puzzlesConfig[${currentPuzzleIndexForSetup}]): ${JSON.stringify(puzzlesConfig[currentPuzzleIndexForSetup], null, 2)}`, 'color: #17a2b8;');
    } else {
      console.warn(`%c[ADMIN_CLIENT] ADVERTENCIA: No hay puzzle configurado en el índice ${currentPuzzleIndexForSetup} o puzzlesConfig está vacío/undefined. puzzlesConfig:`, puzzlesConfig, 'color: #ffc107;');
    }

    if (!socket || !isConnected) {
      console.error('%c[ADMIN_CLIENT] ERROR CRÍTICO: Socket no disponible o no conectado. No se puede emitir.', 'color: #dc3545; font-weight: bold;');
      setError('Error de conexión: No se puede comunicar con el servidor.');
      return;
    }
    if (!gameState.sessionId) {
      console.error('%c[ADMIN_CLIENT] CONDICIÓN FALLÓ: gameState.sessionId está vacío. No se emite launch_puzzle.', 'color: #dc3545;');
      setError('Error de sesión: No hay ID de sesión activa.');
      return;
    }
    if (!puzzlesConfig || puzzlesConfig.length === 0 || currentPuzzleIndexForSetup < 0 || currentPuzzleIndexForSetup >= puzzlesConfig.length || !puzzlesConfig[currentPuzzleIndexForSetup]) {
      console.error(`%c[ADMIN_CLIENT] CONDICIÓN FALLÓ: puzzlesConfig (${puzzlesConfig?.length} elementos) vacío o índice (${currentPuzzleIndexForSetup}) inválido. No se emite launch_puzzle.`, 'color: #dc3545;');
      setError('Error de configuración: No hay puzzles configurados o el puzzle seleccionado no es válido.');
      return;
    }

    const currentPuzzleToLaunch = puzzlesConfig[currentPuzzleIndexForSetup];
    if (!currentPuzzleToLaunch.position || typeof currentPuzzleToLaunch.position !== 'string' || currentPuzzleToLaunch.position.trim() === '') {
      console.error('%c[ADMIN_CLIENT] CONDICIÓN FALLÓ: El puzzle a lanzar no tiene una FEN (position) válida. No se emite launch_puzzle. Position actual:', currentPuzzleToLaunch.position, 'color: #dc3545;');
      setError('Error de puzzle: El puzzle seleccionado no tiene una posición de tablero (FEN) válida.');
      return;
    }

    const eventData = { 
      sessionId: gameState.sessionId, 
      puzzleIndex: currentPuzzleIndexForSetup,
      puzzle: {
        position: currentPuzzleToLaunch.position,
        timer: currentPuzzleToLaunch.timer || 60,
        points: currentPuzzleToLaunch.points || 100,
        mainLine: currentPuzzleToLaunch.mainLine || ''
      }
    };
    console.log(`%c[ADMIN_CLIENT] Emitiendo evento "launch_puzzle" con datos: ${JSON.stringify(eventData, null, 2)}`, 'color: #28a745; font-weight: bold;');
    socket.emit('launch_puzzle', eventData);
    console.log(`%c[ADMIN_CLIENT] Evento "launch_puzzle" emitido (llamada a socket.emit completada).`, 'color: #28a745;');
    setError(null);
  };

  const handleRevealResults = () => {
    console.log(`%c[ADMIN_CLIENT] handleRevealResults INVOCADO`, 'color: #007bff; font-weight: bold;');

    if (!socket || !isConnected) {
      console.error('%c[ADMIN_CLIENT] ERROR CRÍTICO en handleRevealResults: Socket no disponible o no conectado.', 'color: #dc3545;');
      setError('Error de conexión: No se puede comunicar con el servidor.');
      return;
    }
    if (!gameState.sessionId) {
      console.error('%c[ADMIN_CLIENT] ERROR en handleRevealResults: gameState.sessionId está vacío.', 'color: #dc3545;');
      setError('Error de sesión: No hay ID de sesión activa.');
      return;
    }

    const eventData = {
      sessionId: gameState.sessionId,
      puzzleIndex: currentPuzzleIndexForSetup
    };

    console.log(`%c[ADMIN_CLIENT] Emitiendo evento "request_reveal_results" con datos: ${JSON.stringify(eventData, null, 2)}`, 'color: #28a745; font-weight: bold;');
    socket.emit('request_reveal_results', eventData);
    console.log(`%c[ADMIN_CLIENT] Evento "request_reveal_results" emitido.`, 'color: #28a745;');
    setError(null);
  };

  const handlePuzzleUpdate = (updatedPuzzle: PuzzleState) => {
    setPuzzlesConfig(prev => {
      const newConfig = [...prev];
      newConfig[currentPuzzleIndexForSetup] = updatedPuzzle;
      return newConfig;
    });
  };

  const handleNextPuzzle = () => {
    console.log(`%c[ADMIN_CLIENT] handleNextPuzzle INVOCADO. Índice actual: ${currentPuzzleIndexForSetup}`, 'color: #007bff; font-weight: bold;');
    if (currentPuzzleIndexForSetup < numPuzzlesInput - 1) {
      const nextIndex = currentPuzzleIndexForSetup + 1;
      setCurrentPuzzleIndexForSetup(nextIndex);

      setShowResultsView(false);
      setGameState(prev => ({
        ...prev,
        showResults: false,
        puzzleActive: false
      }));

      console.log(`%c[ADMIN_CLIENT] Preparado para configurar el siguiente puzzle en índice: ${nextIndex}`, 'color: #17a2b8;');
      setError(null);
    } else {
      console.log('%c[ADMIN_CLIENT] Ya estás en el último puzzle o has alcanzado el límite.', 'color: #17a2b8;');
      setError('No hay más puzzles para lanzar o has alcanzado el número configurado.');
    }
  };

  const handleResetSession = () => {
    console.log(`%c[ADMIN_CLIENT] handleResetSession (Terminar/Reiniciar Sesión) INVOCADO`, 'color: #dc3545; font-weight: bold;');
    
    if (!socket || !isConnected) {
      console.error('%c[ADMIN_CLIENT] ERROR en handleResetSession: Socket no disponible o no conectado.', 'color: #dc3545;');
      setError('Error de conexión: No se puede comunicar con el servidor.');
      return;
    }

    if (gameState.sessionId && (gameState.isFinalRankingActive || confirm('¿Estás seguro de que quieres reiniciar/terminar esta sesión para todos?'))) {
      const eventData = { sessionId: gameState.sessionId };
      console.log(`%c[ADMIN_CLIENT] Emitiendo evento "terminate_session_request" con datos: ${JSON.stringify(eventData, null, 2)}`, 'color: #ff6347; font-weight: bold;');
      socket.emit('terminate_session_request', eventData);
    }

    setGameState(prev => ({
      ...prev,
      sessionId: '',
      puzzleActive: false,
      showResults: false,
      currentPuzzleServerIndex: null,
      isFinalRankingActive: false,
      totalPuzzlesInSession: 0,
      lastMoveCorrect: undefined,
      pointsAwarded: undefined,
      message: undefined
    }));
    setShowResultsView(false);
    setPuzzlesConfig([]);
    setCurrentPuzzleIndexForSetup(0);
    setNumPuzzlesInput(3);

    console.log('%c[ADMIN_CLIENT] Estado del admin reseteado.', 'color: #17a2b8;');
    setError(null);
  };

  if (!gameState.sessionId) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Crear Nueva Sesión</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número de Problemas
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numPuzzlesInput}
              onChange={(e) => setNumPuzzlesInput(parseInt(e.target.value))}
              className="w-full rounded-md border p-2"
            />
          </div>
          <Button onClick={handleCreateSession} className="w-full">
            Crear Sesión
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <GameSessionInfo 
          sessionId={gameState.sessionId}
          currentPuzzleIndex={currentPuzzleIndexForSetup}
          totalPuzzles={numPuzzlesInput}
          puzzleActive={gameState.puzzleActive}
          showResults={gameState.showResults}
        />

        {puzzlesConfig[currentPuzzleIndexForSetup] && (
          <ChessPuzzleSetup
            puzzle={puzzlesConfig[currentPuzzleIndexForSetup]}
            onPuzzleUpdate={handlePuzzleUpdate}
            disabled={gameState.puzzleActive || false}
          />
        )}

        <Accordion type="single" collapsible>
          <AccordionItem value="site-tactics">
            <AccordionTrigger>Tácticas del Sitio</AccordionTrigger>
            <AccordionContent>
              {/* Site tactics content */}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="user-tactics">
            <AccordionTrigger>Mis Tácticas Guardadas</AccordionTrigger>
            <AccordionContent>
              {/* User tactics content */}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <GameControls
          onLaunchPuzzle={handleLaunchPuzzle}
          onRevealResults={handleRevealResults}
          puzzleActive={gameState.puzzleActive}
          showResults={gameState.showResults}
          isLastPuzzle={gameState.currentPuzzleServerIndex !== null && 
            gameState.totalPuzzlesInSession > 0 && 
            gameState.currentPuzzleServerIndex === gameState.totalPuzzlesInSession - 1}
          isFinalRankingActive={gameState.isFinalRankingActive}
          onNextPuzzle={handleNextPuzzle}
          onResetSession={handleResetSession}
        />
      </div>

      <div className="lg:col-span-1">
        <PlayerList players={sessionPlayers} />
      </div>
    </div>
  );
};

export default AdminView;