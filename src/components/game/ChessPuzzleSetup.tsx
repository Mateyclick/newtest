import React, { useState, useEffect, useCallback } from 'react';
import { Chess, PieceSymbol, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { AdminPuzzleConfiguration, SolutionLine } from '@/lib/types/game';
import { Trash2, Eraser, RotateCcw, UploadCloud, Replace, PlusCircle, XCircle, AlertCircle } from 'lucide-react';
import { nanoid } from 'nanoid';

interface ChessPuzzleSetupProps {
  puzzle: AdminPuzzleConfiguration;
  onPuzzleUpdate: (puzzle: AdminPuzzleConfiguration) => void;
  disabled: boolean;
}

const LOGIC_PIECES: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q', 'k'];
const WHITE_DISPLAY_SYMBOLS: Record<PieceSymbol, string> = { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' };
const BLACK_DISPLAY_SYMBOLS: Record<PieceSymbol, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

const MAX_SOLUTION_LINES = 3;
const DEFAULT_POINTS_MAIN = 100;
const DEFAULT_POINTS_SECONDARY = 50;
const DEFAULT_POINTS_TERTIARY = 25;
const DEFAULT_TIMER = 60;
const MIN_TIMER = 10; // Mínimo tiempo permitido

// Estado para los errores de validación por línea
interface LineErrorState {
  moves?: string | null;
  points?: string | null;
}

const ChessPuzzleSetup: React.FC<ChessPuzzleSetupProps> = ({ puzzle, onPuzzleUpdate, disabled }) => {
  const [game, setGame] = useState(new Chess());
  const [solutionLines, setSolutionLines] = useState<SolutionLine[]>([]);
  const [timer, setTimer] = useState(DEFAULT_TIMER);

  const [selectedPiece, setSelectedPiece] = useState<{ type: PieceSymbol; color: 'w' | 'b' } | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState<string | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Estado para errores de validación en línea para los campos de solutionLines
  const [lineErrors, setLineErrors] = useState<Record<string, LineErrorState>>({});

  const validateLineField = useCallback((lineId: string, field: 'moves' | 'points', value: string | number): string | null => {
    if (field === 'moves') {
      if (typeof value !== 'string' || value.trim() === '') {
        return 'Los movimientos no pueden estar vacíos.';
      }
    }
    if (field === 'points') {
      if (typeof value !== 'number' || isNaN(value) || value <= 0) {
        return 'Los puntos deben ser un número mayor a 0.';
      }
    }
    return null;
  }, []);


  useEffect(() => {
    if (puzzle) {
      try {
        const fenToLoad = puzzle.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const initialGame = new Chess(fenToLoad);
        setGame(initialGame);
        setFenInput(initialGame.fen());
        setFenError(null);
      } catch (e) {
        console.error('Invalid FEN from prop, using default:', e);
        const defaultGame = new Chess();
        setGame(defaultGame);
        setFenInput(defaultGame.fen());
      }

      let initialLines: SolutionLine[] = [];
      if (puzzle.solutionLines && puzzle.solutionLines.length > 0) {
        initialLines = puzzle.solutionLines.map((line, index) => ({
          ...line,
          id: line.id || nanoid(),
          label: line.label || (index === 0 ? 'Línea Principal' : index === 1 ? 'Línea Secundaria' : 'Línea Terciaria')
        }));
      } else if ((puzzle as any).mainLine !== undefined && (puzzle as any).points !== undefined) {
        console.warn("ChessPuzzleSetup: Recibiendo puzzle en formato antiguo. Convirtiendo a solutionLines.");
        initialLines = [
          { id: nanoid(), moves: (puzzle as any).mainLine || '', points: (puzzle as any).points || DEFAULT_POINTS_MAIN, label: 'Línea Principal' }
        ];
      } else {
        initialLines = [
          { id: nanoid(), moves: '', points: DEFAULT_POINTS_MAIN, label: 'Línea Principal' }
        ];
      }
      setSolutionLines(initialLines);

      // Validar líneas iniciales
      const initialLineErrors: Record<string, LineErrorState> = {};
      initialLines.forEach(line => {
        initialLineErrors[line.id] = {
          moves: validateLineField(line.id, 'moves', line.moves),
          points: validateLineField(line.id, 'points', line.points),
        };
      });
      setLineErrors(initialLineErrors);
      
      setTimer(puzzle.timer >= MIN_TIMER ? puzzle.timer : DEFAULT_TIMER);

    } else {
      const defaultGame = new Chess();
      setGame(defaultGame);
      setFenInput(defaultGame.fen());
      const defaultLine = { id: nanoid(), moves: '', points: DEFAULT_POINTS_MAIN, label: 'Línea Principal' };
      setSolutionLines([defaultLine]);
      setLineErrors({
        [defaultLine.id]: {
          moves: validateLineField(defaultLine.id, 'moves', defaultLine.moves),
          points: validateLineField(defaultLine.id, 'points', defaultLine.points),
        }
      });
      setTimer(DEFAULT_TIMER);
    }
  }, [puzzle, validateLineField]);

  const triggerUpdate = useCallback((currentData?: {
    newLines?: SolutionLine[];
    newPosition?: string;
    newTimer?: number;
  }) => {
    const newPosition = currentData?.newPosition ?? game.fen();
    const newLines = currentData?.newLines ?? solutionLines;
    const newTimer = currentData?.newTimer ?? timer;

    let finalLines = newLines.length > 0 ? newLines : [{ id: nanoid(), moves: '', points: DEFAULT_POINTS_MAIN, label: 'Línea Principal' }];
    finalLines = finalLines.map((line, index) => ({
      ...line,
      label: line.label || (index === 0 ? 'Línea Principal' : index === 1 ? 'Línea Secundaria' : 'Línea Terciaria')
    }));

    // No es necesario llamar a setSolutionLines aquí si 'newLines' ya es el estado 'solutionLines'
    // y no cambió estructuralmente (solo valores), lo cual es manejado por handleLineChange.
    // Si 'newLines' es estructuralmente diferente (ej. se añadió/eliminó una línea), entonces sí.
    // Esto se maneja en addSolutionLine y removeSolutionLine directamente.

    onPuzzleUpdate({
      position: newPosition,
      solutionLines: finalLines,
      timer: newTimer,
    });
  }, [game, solutionLines, timer, onPuzzleUpdate]);
  
  const updateBoardState = (newGameInstance: Chess) => {
    const newFen = newGameInstance.fen();
    setGame(newGameInstance);
    setFenInput(newFen); 
    setFenError(null);  
    triggerUpdate({ newPosition: newFen });
  };

  const handleLineChange = (lineId: string, field: 'moves' | 'points', value: string | number) => {
    const processedValue = field === 'points' ? (Number(value) >= 0 ? Number(value) : 0) : value;
    
    setLineErrors(prev => ({
        ...prev,
        [lineId]: {
            ...(prev[lineId] || {}),
            [field]: validateLineField(lineId, field, processedValue)
        }
    }));

    const updatedLines = solutionLines.map(line => 
      line.id === lineId 
        ? { ...line, [field]: processedValue }
        : line
    );
    setSolutionLines(updatedLines);
    triggerUpdate({ newLines: updatedLines });
  };

  const addSolutionLine = () => {
    if (solutionLines.length < MAX_SOLUTION_LINES) {
      let newLabel = 'Línea Secundaria';
      let defaultPoints = DEFAULT_POINTS_SECONDARY;
      if (solutionLines.length === 1) {
        newLabel = 'Línea Secundaria';
        defaultPoints = DEFAULT_POINTS_SECONDARY;
      } else if (solutionLines.length === 2) {
        newLabel = 'Línea Terciaria';
        defaultPoints = DEFAULT_POINTS_TERTIARY;
      }
      const newLineData: SolutionLine = { id: nanoid(), moves: '', points: defaultPoints, label: newLabel };
      
      setLineErrors(prev => ({
          ...prev,
          [newLineData.id]: {
              moves: validateLineField(newLineData.id, 'moves', newLineData.moves),
              points: validateLineField(newLineData.id, 'points', newLineData.points),
          }
      }));

      const newLinesArray = [...solutionLines, newLineData];
      setSolutionLines(newLinesArray);
      triggerUpdate({ newLines: newLinesArray });
    }
  };

  const removeSolutionLine = (lineIdToRemove: string) => {
    if (solutionLines.length <= 1) return;

    let newLinesArray = solutionLines.filter(line => line.id !== lineIdToRemove);
    newLinesArray = newLinesArray.map((line, index) => ({
      ...line,
      label: index === 0 ? 'Línea Principal' : index === 1 ? 'Línea Secundaria' : 'Línea Terciaria'
    }));

    setLineErrors(prev => {
        const updatedErrors = {...prev};
        delete updatedErrors[lineIdToRemove];
        return updatedErrors;
    });

    setSolutionLines(newLinesArray);
    triggerUpdate({ newLines: newLinesArray });
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimerValue = parseInt(e.target.value, 10);
    const validatedTimer = Math.max(MIN_TIMER, isNaN(newTimerValue) ? DEFAULT_TIMER : newTimerValue);
    setTimer(validatedTimer);
    triggerUpdate({ newTimer: validatedTimer });
  };

  const handleSquareClick = (square: Square) => {
    if (disabled) return;
    try {
      const gameCopy = new Chess(game.fen());
      if (isErasing) { gameCopy.remove(square); } 
      else if (selectedPiece) { gameCopy.remove(square); gameCopy.put({ type: selectedPiece.type, color: selectedPiece.color }, square); } 
      else { return; }
      updateBoardState(gameCopy);
    } catch (e) { console.error('Error al modificar el tablero:', e); }
  };

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (disabled || selectedPiece || isErasing) return false;
    try {
      const gameCopy = new Chess(game.fen());
      const moveResult = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }); // chess.js V1 usa moveResult, no solo move
      if (moveResult === null) return false;
      updateBoardState(gameCopy); return true;
    } catch (e) { console.error('Error en drag-and-drop:', e); return false; }
  };
  
  const handleClearBoardKeepKings = () => {
    if (disabled) return;
    const currentBoard = new Chess(game.fen()); const newClearedGame = new Chess(); newClearedGame.clear();
    let whiteKingPos: Square | null = null; let blackKingPos: Square | null = null;
    (['1','2','3','4','5','6','7','8'] as const).forEach(rank => {
        (['a','b','c','d','e','f','g','h'] as const).forEach(file => {
            const square = `${file}${rank}` as Square;
            const piece = currentBoard.get(square);
            if (piece) { 
                if (piece.type === 'k' && piece.color === 'w') whiteKingPos = square; 
                else if (piece.type === 'k' && piece.color === 'b') blackKingPos = square;
            }
        });
    });
    newClearedGame.put({ type: 'k', color: 'w' }, whiteKingPos || 'e1'); 
    newClearedGame.put({ type: 'k', color: 'b' }, blackKingPos || 'e8');
    updateBoardState(newClearedGame); setSelectedPiece(null); setIsErasing(false);
  };

  const handleResetToInitialPosition = () => {
    if (disabled) return; 
    updateBoardState(new Chess());
    setSelectedPiece(null); setIsErasing(false);
  };

  const handleLoadFen = () => {
    if (disabled || !fenInput.trim()) return;
    try {
      const newGameFromFen = new Chess(fenInput.trim()); 
      updateBoardState(newGameFromFen); 
      setSelectedPiece(null); setIsErasing(false);
      setFenError(null); // Limpiar error si FEN es válido
    } catch (error) { 
        console.error("Error al cargar FEN:", error); 
        setFenError("FEN inválido. Verifica la cadena. Ej: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"); 
    }
  };

  const toggleBoardOrientation = () => {
    if (disabled) return; setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  const getDynamicInputClass = (hasError?: boolean | string | null) => 
    `w-full rounded-md p-2 shadow-sm transition-colors text-sm 
     ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white border'}
     ${hasError ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`;


  const toolButtonClass = (isActive: boolean = false, isDestructive: boolean = false) =>
    `p-2 flex items-center justify-center rounded-lg text-xl sm:text-2xl transition-all duration-150 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-1
     min-w-[40px] min-h-[40px] sm:w-12 sm:h-12
     ${isActive
       ? (isDestructive ? 'bg-red-500 hover:bg-red-600 text-white shadow-md scale-105 focus:ring-red-400' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md scale-105 focus:ring-blue-400')
       : (isDestructive ? 'bg-gray-200 hover:bg-red-100 text-red-500 hover:text-red-600 focus:ring-red-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400')
     }
     ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`;


  return (
    <div className="flex flex-col xl:flex-row gap-4 md:gap-6 bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-xl shadow-xl border">
      {/* Columna Izquierda: Teclado de Piezas, Herramientas, Tablero, Cargar FEN */}
      <div className="w-full xl:w-auto xl:max-w-sm space-y-4 flex flex-col items-center xl:items-start">
        <div className="p-3 bg-muted/50 rounded-lg shadow-md space-y-3 w-full border">
          {/* Piezas y Herramientas en Pestañas o Acordeón sería mejor para espacios pequeños */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Piezas Blancas</h4>
            <div className="flex flex-wrap gap-1.5">
              {LOGIC_PIECES.map((piece) => ( <button key={`w${piece}`} title={`Seleccionar ${WHITE_DISPLAY_SYMBOLS[piece]} blanca`} onClick={() => { setSelectedPiece({ type: piece, color: 'w' }); setIsErasing(false); }} className={toolButtonClass(selectedPiece?.type === piece && selectedPiece?.color === 'w')} disabled={disabled} > {WHITE_DISPLAY_SYMBOLS[piece]} </button> ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 mt-2.5 uppercase tracking-wider">Piezas Negras</h4>
            <div className="flex flex-wrap gap-1.5">
              {LOGIC_PIECES.map((piece) => ( <button key={`b${piece}`} title={`Seleccionar ${BLACK_DISPLAY_SYMBOLS[piece]} negra`} onClick={() => { setSelectedPiece({ type: piece, color: 'b' }); setIsErasing(false); }} className={toolButtonClass(selectedPiece?.type === piece && selectedPiece?.color === 'b')} disabled={disabled} > {BLACK_DISPLAY_SYMBOLS[piece]} </button> ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 mt-2.5 uppercase tracking-wider">Herramientas Tablero</h4>
            <div className="flex flex-wrap gap-1.5">
              <button title="Modo Borrar Pieza" onClick={() => { setIsErasing(!isErasing); setSelectedPiece(null); }} className={toolButtonClass(isErasing, true)} disabled={disabled} > <Trash2 size={20} /> </button>
              <button title="Limpiar Tablero (Sólo Reyes)" onClick={handleClearBoardKeepKings} className={toolButtonClass(false, true)} disabled={disabled} > <Eraser size={20} /> </button>
              <button title="Posición Inicial Estándar" onClick={handleResetToInitialPosition} className={toolButtonClass()} disabled={disabled} > <RotateCcw size={20} /> </button>
              <button title="Girar Tablero" onClick={toggleBoardOrientation} className={toolButtonClass()} disabled={disabled} > <Replace size={20} /> </button>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 mt-3 uppercase tracking-wider">Cargar Posición FEN</h4>
            <div className="space-y-1.5">
              <textarea value={fenInput} onChange={(e) => { setFenInput(e.target.value); if (fenError) setFenError(null); }} placeholder="Ej: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" className={getDynamicInputClass(!!fenError) + " h-24 resize-none"} rows={3} disabled={disabled} aria-label="Campo de entrada FEN" />
              {fenError && <p className="text-xs text-red-600 mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{fenError}</p>}
              <button title="Cargar FEN al tablero" onClick={handleLoadFen} className={`w-full flex items-center justify-center text-sm py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${disabled || !fenInput.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-300' : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'}`} disabled={disabled || !fenInput.trim()} > <UploadCloud size={16} className="mr-1.5" /> Cargar FEN </button>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center xl:justify-start mt-1">
            <Chessboard 
                boardWidth={Math.min(400, typeof window !== 'undefined' ? Math.max(280, window.innerWidth * (window.innerWidth < 1280 ? 0.8 : 0.3) ) : 320)} 
                position={game.fen()} 
                boardOrientation={boardOrientation} 
                onPieceDrop={onDrop} 
                onSquareClick={handleSquareClick} 
                arePiecesDraggable={!disabled && !selectedPiece && !isErasing} 
                customBoardStyle={{ borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}} 
                customDarkSquareStyle={{ backgroundColor: '#B58863' }} // Estilo chess.com brown
                customLightSquareStyle={{ backgroundColor: '#F0D9B5' }} 
            />
        </div>
      </div>

      {/* Columna Derecha: Timer y Nuevas Líneas de Solución */}
      <div className="w-full xl:flex-1 space-y-5 mt-4 xl:mt-0">
        <div>
          <label htmlFor="timerInputMain" className="block text-sm font-semibold text-muted-foreground mb-1.5">
            Tiempo General del Problema (segundos) [{MIN_TIMER}-300]
          </label>
          <input id="timerInputMain" type="number" min={MIN_TIMER} max="300" step="5" value={timer} disabled={disabled} onChange={handleTimerChange} className={getDynamicInputClass()}/>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
            <h3 className="text-lg font-semibold text-foreground">Líneas de Solución</h3>
            {solutionLines.length < MAX_SOLUTION_LINES && (
              <button
                type="button"
                onClick={addSolutionLine}
                disabled={disabled}
                className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Añadir nueva línea de solución"
              > <PlusCircle size={16} className="mr-1.5" /> Añadir Línea </button>
            )}
          </div>
          
          {solutionLines.length === 0 && !disabled && (
            <button 
              type="button" 
              onClick={addSolutionLine} 
              className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle size={20} className="mr-2" />
              Añadir primera línea de solución
            </button>
          )}
          {solutionLines.length === 0 && disabled && (
            <p className="text-sm text-muted-foreground">No hay líneas de solución configuradas.</p>
          )}


          {solutionLines.map((line) => (
            <div key={line.id} className="p-3.5 bg-muted/30 rounded-lg shadow-sm space-y-3 relative border border-border/70">
              <div className="flex justify-between items-center mb-1">
                <p className="text-md font-semibold text-primary">{line.label}</p>
                {solutionLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSolutionLine(line.id)}
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 rounded-full hover:bg-red-100/50 focus:outline-none focus:ring-1 focus:ring-red-500"
                    title={`Quitar ${line.label}`}
                    disabled={disabled}
                  > <XCircle size={20} /> </button>
                )}
              </div>
              <div>
                <label htmlFor={`line-moves-${line.id}`} className="block text-xs font-medium text-muted-foreground mb-1">
                  Movimientos (Notación Algebraica Estándar - SAN)
                </label>
                <textarea
                  id={`line-moves-${line.id}`}
                  value={line.moves}
                  onChange={(e) => handleLineChange(line.id, 'moves', e.target.value)}
                  disabled={disabled}
                  className={`${getDynamicInputClass(!!lineErrors[line.id]?.moves)} h-20 resize-y`}
                  placeholder="Ej: e4 e5 Nf3 Nc6 Bb5 a6 O-O..."
                />
                {lineErrors[line.id]?.moves && <p className="text-xs text-red-600 mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{lineErrors[line.id]?.moves}</p>}
              </div>
              <div>
                <label htmlFor={`line-points-${line.id}`} className="block text-xs font-medium text-muted-foreground mb-1">
                  Puntos por esta línea (mayor a 0)
                </label>
                <input
                  id={`line-points-${line.id}`}
                  type="number"
                  min="1" // Los puntos deben ser > 0
                  max="1000"
                  step="5"
                  value={line.points}
                  onChange={(e) => handleLineChange(line.id, 'points', parseInt(e.target.value, 10))}
                  disabled={disabled}
                  className={getDynamicInputClass(!!lineErrors[line.id]?.points)}
                />
                {lineErrors[line.id]?.points && <p className="text-xs text-red-600 mt-1 flex items-center"><AlertCircle size={14} className="mr-1"/>{lineErrors[line.id]?.points}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessPuzzleSetup;