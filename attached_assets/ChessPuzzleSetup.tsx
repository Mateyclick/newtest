import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, PieceSymbol as ChessJSPieceSymbol, Color } from 'chess.js';
import { Trash2, XCircle } from 'lucide-react';

const pieceSymbols: ChessJSPieceSymbol[] = ['p', 'n', 'b', 'r', 'q', 'k'];
const pieceColors: Color[] = ['w', 'b'];

interface PalettePiece {
  type: ChessJSPieceSymbol;
  color: Color;
}

const pieceUnicodeRepresentation: Record<Color, Record<ChessJSPieceSymbol, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟︎', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

interface ChessPuzzleSetupProps {
  puzzle: {
    position: string;
    mainLine: string;
    timer: number;
    points: number;
  };
  onUpdate: (puzzle: {
    position: string;
    mainLine: string;
    timer: number;
    points: number;
  }) => void;
  disabled: boolean;
}

const ChessPuzzleSetup: React.FC<ChessPuzzleSetupProps> = ({ puzzle, onUpdate, disabled }) => {
  const [game, setGame] = useState(new Chess());
  const [positionForInput, setPositionForInput] = useState('');
  const [mainLineString, setMainLineString] = useState('');
  const [timer, setTimer] = useState(60);
  const [points, setPoints] = useState(3);
  const [selectedPalettePiece, setSelectedPalettePiece] = useState<PalettePiece | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Color>('w');
  const [isRemoveMode, setIsRemoveMode] = useState(false);

  // --- LÓGICA PARA EL ANCHO RESPONSIVO DEL TABLERO ---
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(300);

  const updateBoardSize = useCallback(() => {
    if (boardWrapperRef.current) {
      const containerWidth = boardWrapperRef.current.offsetWidth;
      setBoardWidth(Math.max(280, Math.min(containerWidth, 560)));
    }
  }, []);

  useEffect(() => {
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [updateBoardSize]);
  // --- FIN LÓGICA ANCHO RESPONSIVO ---

  const updateBoardState = useCallback((newGameInstance: Chess) => {
    setGame(newGameInstance);
    const newFen = newGameInstance.fen();
    setPositionForInput(newFen);
    setCurrentTurn(newGameInstance.turn());
    onUpdate({
      position: newFen,
      mainLine: mainLineString,
      timer,
      points,
    });
  }, [mainLineString, timer, points, onUpdate]);

  useEffect(() => {
    if (puzzle) {
      try {
        const fenToLoad = puzzle.position && new Chess(puzzle.position).fen()
          ? puzzle.position
          : '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
        const initialGame = new Chess(fenToLoad);
        setGame(initialGame);
        setPositionForInput(initialGame.fen());
        setCurrentTurn(initialGame.turn());
      } catch (e) {
        console.error('Invalid FEN in prop, defaulting to kings-only position:', e);
        const defaultGame = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
        setGame(defaultGame);
        setPositionForInput(defaultGame.fen());
        setCurrentTurn(defaultGame.turn());
      }
      setMainLineString(puzzle.mainLine || '');
      setTimer(puzzle.timer || 60);
      setPoints(puzzle.points || 3);
    } else {
        const defaultGame = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
        setGame(defaultGame);
        setPositionForInput(defaultGame.fen());
        setCurrentTurn(defaultGame.turn());
        setMainLineString('');
    }
  }, [puzzle]);

  const handleFenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFen = e.target.value;
    setPositionForInput(newFen);
  };

  const validateAndApplyFenFromInput = () => {
    try {
      const newGameFromFen = new Chess(positionForInput);
      updateBoardState(newGameFromFen);
    } catch (err) {
      console.error("FEN inválido en el input:", positionForInput, "Restaurando al FEN anterior del 'game'.");
      setPositionForInput(game.fen());
    }
  };

  const handlePieceMoveOnBoard = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (disabled || selectedPalettePiece || isRemoveMode) return false;
    const gameCopy = new Chess(game.fen());
    const pieceToMoveDetails = gameCopy.get(sourceSquare);
    if (pieceToMoveDetails) {
      try {
        gameCopy.remove(sourceSquare);
        gameCopy.put({ type: pieceToMoveDetails.type, color: pieceToMoveDetails.color }, targetSquare);
        updateBoardState(new Chess(gameCopy.fen()));
        return true;
      } catch (e) {
        console.error("Error al re-colocar la pieza en el tablero:", e);
        return false;
      }
    }
    return false;
  };

  const handleSquareClick = (square: Square) => {
    if (disabled) return;
    const gameCopy = new Chess(game.fen());
    if (isRemoveMode) {
      const pieceOnSquare = gameCopy.get(square);
      if (pieceOnSquare && pieceOnSquare.type !== 'k') {
        gameCopy.remove(square);
        updateBoardState(new Chess(gameCopy.fen()));
      } else if (pieceOnSquare && pieceOnSquare.type === 'k') {
        console.warn("Los reyes no se pueden eliminar con el modo borrar. Usa Limpiar Tablero o edita el FEN.");
      }
    } else if (selectedPalettePiece) {
      try {
        gameCopy.put({ type: selectedPalettePiece.type, color: selectedPalettePiece.color }, square);
        updateBoardState(new Chess(gameCopy.fen()));
      } catch (e) {
        console.error("Error al colocar pieza en el tablero:", e);
      }
    }
  };

  const handleTurnChange = (turn: Color) => {
    if (disabled) return;
    setCurrentTurn(turn);
    const fenParts = game.fen().split(' ');
    fenParts[1] = turn; 
    fenParts[3] = '-'; 
    fenParts[4] = '0'; 
    try {
      const newFenWithTurn = fenParts.join(' ');
      const newGameWithTurn = new Chess(newFenWithTurn);
      updateBoardState(newGameWithTurn); 
    } catch (e) {
        console.error("Error setting turn via FEN: ", e);
        setCurrentTurn(game.turn());
    }
  };

  const handleClearBoard = () => {
    if (disabled) return;
    // Solo reyes en el tablero - posición inicial básica
    const clearedGame = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    updateBoardState(clearedGame);
  };

  const handleResetBoard = () => {
    if (disabled) return;
    // Posición inicial estándar del ajedrez
    const initialGame = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    updateBoardState(initialGame);
  };

  const toggleRemoveMode = () => {
    if (disabled) return;
    setIsRemoveMode(prev => !prev);
    // Si activamos el modo borrar, desactivamos la pieza seleccionada
    if (!isRemoveMode) {
      setSelectedPalettePiece(null);
    }
  };

  const handleSelectPalettePiece = (piece: PalettePiece) => {
    if (disabled) return;
    // Si ya está seleccionada, la deseleccionamos
    if (selectedPalettePiece?.type === piece.type && selectedPalettePiece?.color === piece.color) {
      setSelectedPalettePiece(null);
    } else {
      setSelectedPalettePiece(piece);
      // Si estábamos en modo borrar, lo desactivamos
      if (isRemoveMode) {
        setIsRemoveMode(false);
      }
    }
  };

  const handleMainLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMainLine = e.target.value;
    setMainLineString(newMainLine);
    onUpdate({
      position: positionForInput,
      mainLine: newMainLine,
      timer,
      points,
    });
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimer = parseInt(e.target.value, 10) || 60;
    setTimer(newTimer);
    onUpdate({
      position: positionForInput,
      mainLine: mainLineString,
      timer: newTimer,
      points,
    });
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = parseInt(e.target.value, 10) || 3;
    setPoints(newPoints);
    onUpdate({
      position: positionForInput,
      mainLine: mainLineString,
      timer,
      points: newPoints,
    });
  };

  return (
    <div className="space-y-6">

      {/* Sección Editor de Tablero */}
      <div className="bg-gray-100 p-3 sm:p-4 rounded-md shadow">
        <h3 className="text-md sm:text-lg font-semibold mb-3 text-gray-700">Editor de Tablero</h3>
        
        {/* Controles de Turno */}
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-medium text-gray-600">Turno:</span>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" name="turn" value="w" checked={currentTurn === 'w'} onChange={() => handleTurnChange('w')} disabled={disabled} className="mr-1"/>
              Blancas
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="turn" value="b" checked={currentTurn === 'b'} onChange={() => handleTurnChange('b')} disabled={disabled} className="mr-1"/>
              Negras
            </label>
          </div>
        </div>

        <div className="mb-2 font-medium text-gray-600">Paleta de Piezas:</div>
        {/* Paleta de Piezas */}
        {pieceColors.map(color => (
          <div key={color} className="flex flex-wrap gap-1 mb-2">
            {pieceSymbols.map(symbol => {
              const piece = { type: symbol, color };
              const isSelected = selectedPalettePiece?.type === symbol && selectedPalettePiece?.color === color;
              return (
                <button
                  key={`${color}${symbol}`}
                  title={`Poner ${pieceUnicodeRepresentation[color][symbol]}`}
                  onClick={() => handleSelectPalettePiece(piece)}
                  disabled={disabled}
                  className={`p-1 w-9 h-9 sm:w-10 sm:h-10 text-xl sm:text-2xl border rounded ${
                    isSelected ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-gray-200 hover:bg-gray-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {pieceUnicodeRepresentation[color][symbol]}
                </button>
              );
            })}
          </div>
        ))}
        {/* Botones de Deseleccionar y Modo Borrar */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
            {selectedPalettePiece && (
            <button
                onClick={() => setSelectedPalettePiece(null)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                disabled={disabled}
            >
                <XCircle size={14} className="mr-1"/> Deseleccionar ({pieceUnicodeRepresentation[selectedPalettePiece.color][selectedPalettePiece.type]})
            </button>
            )}
            <button
                onClick={toggleRemoveMode}
                disabled={disabled}
                className={`p-2 text-sm border rounded flex items-center ${
                isRemoveMode
                    ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-300'
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Trash2 size={16} className="mr-2"/>
                {isRemoveMode ? 'Modo Borrar (Activado)' : 'Activar Modo Borrar'}
            </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isRemoveMode
            ? 'Haz clic en una pieza (no rey) para quitarla.'
            : selectedPalettePiece
              ? `Haz clic en una casilla para poner ${pieceUnicodeRepresentation[selectedPalettePiece.color][selectedPalettePiece.type]}.`
              : 'Selecciona pieza o activa modo borrar.'
          }
        </p>
      </div>

      {/* Contenedor del Tablero */}
      <div ref={boardWrapperRef} className="w-full max-w-xl mx-auto">
        <Chessboard
          position={game.fen()}
          onPieceDrop={handlePieceMoveOnBoard}
          onSquareClick={handleSquareClick}
          boardWidth={boardWidth}
          areArrowsAllowed={false}
          arePiecesDraggable={!disabled && !selectedPalettePiece && !isRemoveMode}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* Controles del Tablero y FEN Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="flex flex-wrap gap-2">
          <button onClick={handleClearBoard} disabled={disabled} className={`px-3 py-2 rounded-md text-sm ${disabled ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'}`}>
            Limpiar (Reyes)
          </button>
          <button onClick={handleResetBoard} disabled={disabled} className={`px-3 py-2 rounded-md text-sm ${disabled ? 'bg-gray-200 text-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'}`}>
            Pos. Inicial
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cadena FEN</label>
          <input
            type="text"
            value={positionForInput}
            onChange={handleFenInputChange}
            onBlur={validateAndApplyFenFromInput}
            disabled={disabled}
            placeholder="Ingresa cadena FEN"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Configuración del Problema (Mainline, Timer, Puntos) */}
      <div className="space-y-4">
        <div>
          <label htmlFor="mainLineInput" className="block text-sm font-medium text-gray-700 mb-1">
            Línea Principal del Problema (SAN)
          </label>
          <input
            type="text"
            id="mainLineInput"
            value={mainLineString}
            onChange={handleMainLineChange}
            disabled={disabled}
            placeholder="ej: e4 e5 Nf3 Nc6 Bb5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Secuencia de jugadas separadas por espacio. Ej: e4 e5 Cf3 Cc6
          </p>
        </div>

        {/* Timer y Puntos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporizador (segundos)</label>
            <input type="number" min="10" max="300" value={timer} onChange={handleTimerChange} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
            <input type="number" min="1" max="10" value={points} onChange={handlePointsChange} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessPuzzleSetup;