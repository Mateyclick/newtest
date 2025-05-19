import React, { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, Move, Color as ChessJsColor } from 'chess.js';
import { Clock } from 'lucide-react';

interface PuzzleViewProps {
  position: string;
  points: number;
  endTime: number; // Timestamp de cuándo termina el puzzle
  onMoveAttempt: (moveSAN: string) => void;
  hasSubmittedOrCompleted: boolean; // True  si el jugador ya envió respuesta final (correcta o incorrecta)
  puzzleActive: boolean;
}

type SquareStyles = {
  [key in Square]?: CSSProperties;
};

const PuzzleView: React.FC<PuzzleViewProps> = ({
  position,
  points,
  endTime,
  onMoveAttempt,
  hasSubmittedOrCompleted,
  puzzleActive,
}) => {
  const [game, setGame] = useState(new Chess(position));
  // timeLeft almacenará el valor que se muestra. Se "congelará" al completar/fallar.
  const [timeLeft, setTimeLeft] = useState(0); 
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Para limpiar el intervalo explícitamente

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMovesSquares, setPossibleMovesSquares] = useState<Square[]>([]);
  const [squareStyles, setSquareStyles] = useState<SquareStyles>({});

  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(500);

  const updateBoardSize = useCallback(() => {
    // ... (lógica de updateBoardSize sin cambios)
    if (boardWrapperRef.current) {
      const containerWidth = boardWrapperRef.current.offsetWidth;
      if (window.innerWidth < 640) {
        setBoardWidth(Math.min(containerWidth, 300));
      } else if (window.innerWidth < 768) {
        setBoardWidth(Math.min(containerWidth, 400));
      } else {
        setBoardWidth(Math.min(containerWidth, 560));
      }
    } else {
      if (window.innerWidth < 640) setBoardWidth(300);
      else if (window.innerWidth < 768) setBoardWidth(400);
      else setBoardWidth(500);
    }
  }, []);

  useEffect(() => {
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [updateBoardSize]);

  useEffect(() => {
    try {
      setGame(new Chess(position));
    } catch (e) {
      console.error('FEN inválido recibido en prop position en PuzzleView:', position, e);
      setGame(new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1'));
    }
    setSelectedSquare(null);
    setPossibleMovesSquares([]);
    setSquareStyles({});
  }, [position]);

  // useEffect para el temporizador
  useEffect(() => {
    // Función para calcular el tiempo restante
    const calculateAndUpdateTimeLeft = () => {
      if (!puzzleActive || endTime === null) {
        return 0; // Si no está activo o no hay tiempo final, es 0
      }
      const difference = endTime - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    // Si el jugador ya completó/falló, o el puzzle no está activo, limpiamos cualquier intervalo
    if (hasSubmittedOrCompleted || !puzzleActive) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      // Si no está activo pero no ha completado (ej. esperando inicio), mostrar tiempo del puzzle.
      // Si completó, timeLeft ya debería estar "congelado" al valor del momento de completar.
      // Si simplemente el puzzleActive se volvió false (ej. admin revela resultados), el tiempo se congela.
      if (!hasSubmittedOrCompleted && puzzleActive && endTime) { // Actualizar una vez si está activo pero el intervalo se limpió
          setTimeLeft(calculateAndUpdateTimeLeft());
      } else if (!puzzleActive && !hasSubmittedOrCompleted && endTime) { // Si el puzzle se desactiva antes de completar
          setTimeLeft(calculateAndUpdateTimeLeft()); // Mostrar tiempo inicial o restante si se pausa
      }
      // Si hasSubmittedOrCompleted es true, timeLeft ya no se actualizará más por este effect.
      return;
    }

    // Si llegamos aquí, el puzzle está activo y el jugador no ha completado/fallado.
    // Establecer el tiempo inicial
    setTimeLeft(calculateAndUpdateTimeLeft());

    // Iniciar el intervalo
    timerIntervalRef.current = setInterval(() => {
      const newTimeLeft = calculateAndUpdateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
    }, 1000);

    // Función de limpieza para el useEffect
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [endTime, puzzleActive, hasSubmittedOrCompleted]); // Dependencias clave

  // ... (resto de la lógica de highlightPossibleMoves y handleSquareClick sin cambios)
  const highlightPossibleMoves = (fromSquare: Square) => {
    const currentBoard = new Chess(position); 
    const moves = currentBoard.moves({ square: fromSquare, verbose: true }) as Move[];
    
    const newStyles: SquareStyles = {};
    newStyles[fromSquare] = { background: 'rgba(255, 255, 0, 0.4)' }; 
    
    const destSquares: Square[] = [];
    moves.forEach((move) => {
      destSquares.push(move.to);
      const pieceOnTargetSquare = currentBoard.get(move.to);
      newStyles[move.to] = { 
        background: pieceOnTargetSquare && pieceOnTargetSquare.color !== currentBoard.turn()
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' 
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    setSquareStyles(newStyles);
    setPossibleMovesSquares(destSquares);
  };

  const handleSquareClick = (square: Square) => {
    if (hasSubmittedOrCompleted || timeLeft <= 0 || !puzzleActive) { // Añadido timeLeft <= 0
      return;
    }

    const boardStateForClick = new Chess(position);
    const pieceOnClickedSquare = boardStateForClick.get(square);
    let currentTurnForPlayerToMove: ChessJsColor = 'w'; // Recalcular turno aquí para la lógica del clic
    try {
        currentTurnForPlayerToMove = boardStateForClick.turn();
    } catch(e) {/* ya manejado */}


    if (selectedSquare) {
      if (possibleMovesSquares.includes(square)) {
        const moveAttemptResult = boardStateForClick.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (moveAttemptResult) {
          onMoveAttempt(moveAttemptResult.san);
          // El servidor confirmará y PlayerRoom actualizará hasSubmittedOrCompleted.
          // En ese punto, el useEffect del timer se encargará de detener el reloj.
        }
      }
      // Siempre limpiar selección después de un segundo clic
      setSelectedSquare(null);
      setPossibleMovesSquares([]);
      setSquareStyles({});
    } else {
      if (pieceOnClickedSquare && pieceOnClickedSquare.color === currentTurnForPlayerToMove) {
        setSelectedSquare(square);
        highlightPossibleMoves(square);
      } else {
        setSelectedSquare(null);
        setPossibleMovesSquares([]);
        setSquareStyles({});
      }
    }
  };
  // ... (resto del JSX sin cambios)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Resuelve el Problema
            </h2>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`flex items-center py-1 px-2 sm:px-3 rounded-md text-sm sm:text-base ${
                !hasSubmittedOrCompleted && timeLeft <= 10 && timeLeft > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 
                (!hasSubmittedOrCompleted && timeLeft === 0) ? 'bg-gray-200 text-gray-600' : 
                hasSubmittedOrCompleted ? 'bg-gray-200 text-gray-700' : // Estilo para tiempo congelado
                'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={16} className="mr-1 sm:mr-2" />
                <span className="font-mono font-medium">{timeLeft}s</span>
              </div>
              <div className="bg-green-100 text-green-700 py-1 px-2 sm:px-3 rounded-md text-sm sm:text-base">
                <span className="font-medium">{points} pts</span>
              </div>
            </div>
          </div>

          <div ref={boardWrapperRef} className="w-full mx-auto" style={{ maxWidth: `${boardWidth}px` }}>
            <Chessboard
              position={position}
              onSquareClick={handleSquareClick}
              boardWidth={boardWidth}
              arePiecesDraggable={false}
              customSquareStyles={squareStyles}
              customDarkSquareStyle={{ backgroundColor: '#779952' }}
              customLightSquareStyle={{ backgroundColor: '#edeed1' }}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Progreso</h3>
          <div className="text-sm text-gray-600 min-h-[60px]">
            {!puzzleActive && !hasSubmittedOrCompleted && <p>Esperando que el administrador lance un problema...</p>}
            {puzzleActive && !hasSubmittedOrCompleted && !selectedSquare && <p>Haz clic en una de tus piezas para mover.</p>}
            {puzzleActive && !hasSubmittedOrCompleted && selectedSquare && <p>Pieza en <span className="font-mono">{selectedSquare}</span> seleccionada. Haz clic en una casilla destino.</p>}
            {hasSubmittedOrCompleted && <p>Problema finalizado. Esperando resultados o siguiente problema.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleView;