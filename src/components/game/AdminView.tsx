import React, { useState, useEffect } from 'react';
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { AdminPuzzleConfiguration, SolutionLine } from '@/lib/types/game';
import { PlayerList } from './PlayerList';
import GameSessionInfo from './GameSessionInfo';
import ChessPuzzleSetup from './ChessPuzzleSetup';
import PlayerProgressView from './PlayerProgressView';
import { useLoadSiteTactics, useLoadUserSavedTactics, useSaveCurrentSetupAsUserTactic } from '@/hooks/tacticsUtils';
import { Loader2, Settings, ArrowRight } from "lucide-react";
import { nanoid } from 'nanoid';

const DEFAULT_POINTS_MAIN = 100;
const DEFAULT_TIMER = 60;

const AdminView: React.FC = () => {
  const { socket, isConnected } = useGameSocket();
  const { gameState, sessionPlayers, setGameState, setShowResultsView, playerProgressView } = useGameSession(true);
  const { user } = useAuth();

  const [numPuzzlesInput, setNumPuzzlesInput] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [puzzlesConfig, setPuzzlesConfig] = useState<AdminPuzzleConfiguration[]>([]);
  const [currentPuzzleIndexForSetup, setCurrentPuzzleIndexForSetup] = useState(0);
  const [launchedPuzzlesHistory, setLaunchedPuzzlesHistory] = useState<number[]>([]);

  const [puzzleNameInput, setPuzzleNameInput] = useState('');
  const [puzzleDescriptionInput, setPuzzleDescriptionInput] = useState('');
  const [puzzleDifficultyInput, setPuzzleDifficultyInput] = useState('medio');
  const [puzzleTagsInput, setPuzzleTagsInput] = useState('');

  const createDefaultPuzzle = useCallback((index: number): AdminPuzzleConfiguration => ({
    position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solutionLines: [{ id: nanoid(), moves: '', points: DEFAULT_POINTS_MAIN, label: `Línea Principal (P${index + 1})` }],
    timer: DEFAULT_TIMER,
  }), []);

  useEffect(() => {
    if (gameState.sessionId && numPuzzlesInput > 0) {
        let newConfigs: AdminPuzzleConfiguration[] = [];
        const currentConfigs = [...puzzlesConfig];

        if (puzzlesConfig.length !== numPuzzlesInput || 
            (gameState.totalPuzzlesInSession > 0 && gameState.totalPuzzlesInSession !== numPuzzlesInput && numPuzzlesInput !== gameState.totalPuzzlesInSession) ||
            (puzzlesConfig.length === 0 && numPuzzlesInput > 0) ) {
            
            console.log(`[AdminView] useEffect[gameState.sessionId, numPuzzlesInput]: (Re)creando ${numPuzzlesInput} puzzles. Actual PuzzlesConfig: ${puzzlesConfig.length}, gameStateTotal: ${gameState.totalPuzzlesInSession}`);
            newConfigs = Array(numPuzzlesInput).fill(null).map((_, index) => {
                return currentConfigs[index] || createDefaultPuzzle(index);
            });
            
            if (newConfigs.length > numPuzzlesInput) {
                newConfigs = newConfigs.slice(0, numPuzzlesInput);
            } else {
                while (newConfigs.length < numPuzzlesInput) {
                    newConfigs.push(createDefaultPuzzle(newConfigs.length));
                }
            }
            setPuzzlesConfig(newConfigs);

            if (currentPuzzleIndexForSetup >= numPuzzlesInput && numPuzzlesInput > 0) {
                setCurrentPuzzleIndexForSetup(Math.max(0, numPuzzlesInput - 1));
            } else if (currentPuzzleIndexForSetup < 0 && numPuzzlesInput > 0) {
                setCurrentPuzzleIndexForSetup(0);
            } else if (newConfigs.length > 0 && currentPuzzleIndexForSetup >= newConfigs.length) {
                 setCurrentPuzzleIndexForSetup(Math.max(0, newConfigs.length -1));
            }
        }
    } else if (!gameState.sessionId) {
        setPuzzlesConfig([]);
        setCurrentPuzzleIndexForSetup(0);
        setLaunchedPuzzlesHistory([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.sessionId, numPuzzlesInput, gameState.totalPuzzlesInSession, createDefaultPuzzle]);


  useEffect(() => {
    if (!gameState.sessionId) {
        setLaunchedPuzzlesHistory([]);
        return;
    }

    if (gameState.currentPuzzleServerIndex !== null) {
        const targetSetupIndex = gameState.puzzleActive
            ? gameState.currentPuzzleServerIndex
            : gameState.currentPuzzleServerIndex + 1;

        const maxAllowedIndex = numPuzzlesInput -1;

        if (targetSetupIndex <= maxAllowedIndex) { 
            if(currentPuzzleIndexForSetup !== targetSetupIndex) {
                setCurrentPuzzleIndexForSetup(targetSetupIndex);
            }
            if (targetSetupIndex >= puzzlesConfig.length && puzzlesConfig.length < numPuzzlesInput) {
                setPuzzlesConfig(prev => {
                    const newCfgs = [...prev];
                    while (newCfgs.length <= targetSetupIndex && newCfgs.length < numPuzzlesInput) {
                        newCfgs.push(createDefaultPuzzle(newCfgs.length));
                    }
                    return newCfgs;
                });
            }
        } else if (!gameState.puzzleActive && currentPuzzleIndexForSetup < maxAllowedIndex) {
            if (currentPuzzleIndexForSetup !== maxAllowedIndex) {
               setCurrentPuzzleIndexForSetup(maxAllowedIndex);
            }
        }
    } else if (gameState.currentPuzzleServerIndex === null && currentPuzzleIndexForSetup !== 0 && numPuzzlesInput > 0 && puzzlesConfig.length > 0) {
        setCurrentPuzzleIndexForSetup(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPuzzleServerIndex, gameState.puzzleActive, gameState.showResults, numPuzzlesInput, gameState.sessionId, createDefaultPuzzle]);


  const { applySiteTacticToSetup } = useLoadSiteTactics(setPuzzlesConfig, currentPuzzleIndexForSetup);
  const { applyUserTacticToSetup } = useLoadUserSavedTactics(setPuzzlesConfig, currentPuzzleIndexForSetup, user?.id || '');
  const { handleSaveCurrentSetupAsUserTactic } = useSaveCurrentSetupAsUserTactic(
    puzzlesConfig, currentPuzzleIndexForSetup, puzzleNameInput, user?.id || '',
    puzzleDescriptionInput, puzzleDifficultyInput, puzzleTagsInput
  );

  const handleCreateSession = () => {
    if (!socket || !isConnected) { setError('No hay conexión con el servidor'); return; }
    if (!user) { setError('Debes estar autenticado para crear una sesión'); return; }
    socket.emit('create_session', { numPuzzles: numPuzzlesInput });
    setError(null);
  };

  const validatePuzzleConfig = (puzzleToValidate: AdminPuzzleConfiguration, indexForErrorMsg: number): boolean => {
    if (!puzzleToValidate?.position || typeof puzzleToValidate.position !== 'string' || puzzleToValidate.position.trim() === '') {
        setError(`Error de puzzle #${indexForErrorMsg + 1}: FEN inválido.`);
        return false;
    }
    if (!puzzleToValidate.solutionLines || puzzleToValidate.solutionLines.length === 0) {
        setError(`Error de puzzle #${indexForErrorMsg + 1}: Debe definir al menos una línea de solución.`);
        return false;
    }
    for (const line of puzzleToValidate.solutionLines) {
        if (!line.moves || typeof line.moves !== 'string' || line.moves.trim() === '') {
            setError(`Error de puzzle #${indexForErrorMsg + 1}: La línea de solución '${line.label || line.id}' no tiene movimientos definidos.`);
            return false;
        }
        if (typeof line.points !== 'number' || line.points <= 0) {
            setError(`Error de puzzle #${indexForErrorMsg + 1}: La línea '${line.label || line.id}' debe tener puntos asignados mayores a 0.`);
            return false;
        }
    }
    setError(null);
    return true;
  };

  const handleLaunchConfiguredPuzzle = () => {
    if (!socket || !isConnected || !gameState.sessionId) { setError('No hay conexión o sesión activa.'); return; }
    
    const puzzleIdx = currentPuzzleIndexForSetup;

    if (puzzleIdx >= numPuzzlesInput) {
        setError(`Índice de puzzle #${puzzleIdx + 1} está fuera del total de ${numPuzzlesInput} puzzles para la sesión.`); return;
    }
    if (!puzzlesConfig[puzzleIdx]) {
      setError(`Error: Puzzle #${puzzleIdx + 1} no está configurado. Asegúrate de que esté cargado y bien definido.`); return;
    }
    
    if (!validatePuzzleConfig(puzzlesConfig[puzzleIdx], puzzleIdx)) return;

    const puzzleToLaunch = puzzlesConfig[puzzleIdx];
    const payload = {
      position: puzzleToLaunch.position, timer: puzzleToLaunch.timer,
      solutionLines: puzzleToLaunch.solutionLines.map(l => ({ id: l.id, moves: l.moves.trim(), points: l.points, label: l.label }))
    };
    
    console.log(`%c[ADMIN_CLIENT] Emitiendo "launch_puzzle" (P#${puzzleIdx + 1}): ${JSON.stringify(payload, null, 2)}`, 'color: #28a745; font-weight: bold;');
    socket.emit('launch_puzzle', { sessionId: gameState.sessionId, puzzleIndex: puzzleIdx, puzzle: payload });
    setLaunchedPuzzlesHistory(prev => prev.includes(puzzleIdx) ? prev : [...prev, puzzleIdx].sort((a,b) => a-b));
    setShowResultsView(false); 
  };
  
  const handleShowFinalRanking = () => {
    if (!gameState.sessionId) { setError('No hay sesión activa.'); return;}
    setShowResultsView(true); 
    setGameState(prev => ({ ...prev, isFinalRankingActive: true, puzzleActive: false })); 
  };

  const handleRevealResults = () => { 
    if (!socket || !isConnected) { setError('Error de conexión.'); return; }
    if (!gameState.sessionId) { setError('Error de sesión.'); return; }
    const puzzleIndexToReveal = gameState.currentPuzzleServerIndex;
    if (puzzleIndexToReveal === null) { setError('No hay puzzle activo/terminado para revelar.'); return; }
    socket.emit('request_reveal_results', { sessionId: gameState.sessionId, puzzleIndex: puzzleIndexToReveal });
    setError(null);
  };

  const handlePuzzleUpdate = (updatedPuzzleConfig: AdminPuzzleConfiguration) => { 
     setPuzzlesConfig(prev => {
      const newConfig = [...prev];
      if (currentPuzzleIndexForSetup >= 0 && currentPuzzleIndexForSetup < newConfig.length && currentPuzzleIndexForSetup < numPuzzlesInput) {
        newConfig[currentPuzzleIndexForSetup] = updatedPuzzleConfig;
      } else if (currentPuzzleIndexForSetup === newConfig.length && currentPuzzleIndexForSetup < numPuzzlesInput) { 
        newConfig.push(updatedPuzzleConfig);
      }
      else { 
        console.error(`[AdminView] Índice para actualización de puzzle inválido: ${currentPuzzleIndexForSetup}. ConfigLength: ${newConfig.length}, NumPuzzles: ${numPuzzlesInput}`);
      }
      return newConfig;
    });
  };
  
  const handleResetSession = () => {
    if (socket && isConnected && gameState.sessionId && (gameState.isFinalRankingActive || window.confirm('¿Estás seguro de que quieres reiniciar/terminar esta sesión para todos? Esta acción es irreversible.'))) {
        socket.emit('terminate_session_request', { sessionId: gameState.sessionId }); 
        setGameState(prev => ({
            ...prev, 
            sessionId: null, 
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
        setLaunchedPuzzlesHistory([]);
        setError(null);
    } else if (!gameState.sessionId) { 
        setShowResultsView(false);
        setPuzzlesConfig([]);
        setCurrentPuzzleIndexForSetup(0);
        setNumPuzzlesInput(3);
        setLaunchedPuzzlesHistory([]);
        setError(null);
    }
  };

  if (!gameState.sessionId) {
    return (
      <div className="max-w-lg mx-auto bg-background text-foreground rounded-lg shadow-xl border p-6 sm:p-8 mt-8">
        <h2 className="text-2xl font-semibold text-primary mb-6 text-center">Crear Nueva Sesión de Tácticas</h2>
        {error && <p className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md text-center">{error}</p>}
        <div className="space-y-6">
          <div>
            <label htmlFor="numPuzzles" className="block text-sm font-medium mb-1">Número de Problemas (1-20)</label>
            <input id="numPuzzles" type="number" min="1" max="20" value={numPuzzlesInput}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= 20) { setNumPuzzlesInput(val); setError(null); }
                else if (val > 20) { setError(`Máximo 20 problemas.`); }
                else { setError("Mínimo 1 problema."); }
              }}
              className="w-full rounded-md border-input bg-transparent p-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button onClick={handleCreateSession} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-base" disabled={!isConnected || numPuzzlesInput <= 0 || numPuzzlesInput > 20 }>
            <Settings className="mr-2 h-5 w-5"/>Crear Sesión
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6 text-center">
            Configurarás los problemas uno por uno después de crear la sesión.
        </p>
      </div>
    );
  }

  const currentPuzzleForUI = puzzlesConfig[currentPuzzleIndexForSetup];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">
      {error && <p className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md text-center sticky top-2 z-50">{error}</p>}
      <div className="max-w-5xl mx-auto space-y-6">
        <GameSessionInfo 
            sessionId={gameState.sessionId} 
            currentPuzzleIndex={gameState.currentPuzzleServerIndex !== null ? gameState.currentPuzzleServerIndex : -1}
            totalPuzzles={gameState.totalPuzzlesInSession || numPuzzlesInput}
            puzzleActive={gameState.puzzleActive || false} 
            showResults={gameState.showResults || false} 
        />
        
        {currentPuzzleForUI ? (
          <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-xl shadow-2xl border">
            <h3 className="text-xl sm:text-2xl font-semibold text-primary mb-4 border-b pb-3">
              {`Configurando: Problema #${currentPuzzleIndexForSetup + 1} de ${numPuzzlesInput}`}
              {gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup && gameState.puzzleActive && 
                <span className="text-yellow-500 font-bold animate-pulse ml-2">(ACTIVO EN SESIÓN)</span>
              }
              {launchedPuzzlesHistory.includes(currentPuzzleIndexForSetup) && 
               !(gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup && gameState.puzzleActive) &&
               !(gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup && gameState.showResults) &&
                <span className="text-muted-foreground text-sm ml-2">(Ya lanzado, esperando resultados...)</span>
              }
              {gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup && gameState.showResults && !gameState.puzzleActive &&
                 <span className="text-green-500 ml-2">(Resultados Mostrados)</span>
              }
            </h3>
            <ChessPuzzleSetup
              puzzle={currentPuzzleForUI}
              onPuzzleUpdate={handlePuzzleUpdate}
              disabled={
                (gameState.puzzleActive && gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup) ||
                (launchedPuzzlesHistory.includes(currentPuzzleIndexForSetup) && 
                 !(gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup && gameState.showResults))
              }
            />
          </div>
        ) : (
          <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p>Cargando configuración de puzzle...</p>
          </div>
        )}

        {/* Mostrar el progreso de los jugadores */}
        <PlayerProgressView playerProgress={playerProgressView} />

        <GameControls
          sessionId={gameState.sessionId}
          puzzleActive={gameState.puzzleActive}
          showResults={gameState.showResults}
          currentPuzzleIndex={gameState.currentPuzzleServerIndex}
          totalPuzzles={gameState.totalPuzzlesInSession || numPuzzlesInput}
          onLaunchPuzzle={handleLaunchConfiguredPuzzle}
          onRevealResults={handleRevealResults}
          onShowFinalRanking={handleShowFinalRanking}
          onResetSession={handleResetSession}
          disableLaunch={
            !currentPuzzleForUI || 
            (gameState.puzzleActive && gameState.currentPuzzleServerIndex === currentPuzzleIndexForSetup) ||
            currentPuzzleIndexForSetup >= numPuzzlesInput
          }
          // IMPORTANTE: El botón de revelar resultados siempre está disponible cuando hay un puzzle activo
          disableReveal={!gameState.puzzleActive || gameState.currentPuzzleServerIndex === null}
          disableFinalRanking={gameState.isFinalRankingActive || !launchedPuzzlesHistory.length}
        />

        <PlayerList players={sessionPlayers} />
      </div>
    </div>
  );
};

export default AdminView;
