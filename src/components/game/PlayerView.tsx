import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, Move } from 'chess.js';
import { Clock, AlertCircle, CheckCircle, XCircle, Info, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PuzzleViewProps {
  position: string;
  points: number;
  endTime: number;
  onMoveAttempt: (moveSAN: string) => void;
  hasSubmittedOrCompleted: boolean;
  puzzleActive: boolean;
  lastMoveCorrect?: boolean;
  message?: string;
  pointsAwarded?: number;
  puzzleIndex?: number;
  totalPuzzles?: number;
}

const PuzzleView: React.FC<PuzzleViewProps> = ({
  position,
  points,
  endTime,
  onMoveAttempt,
  hasSubmittedOrCompleted,
  puzzleActive,
  lastMoveCorrect,
  message,
  pointsAwarded,
  puzzleIndex = 0,
  totalPuzzles = 0,
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  
  // Board size responsiveness
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  const updateBoardSize = useCallback(() => {
    if (boardWrapperRef.current) {
      const containerWidth = boardWrapperRef.current.offsetWidth;
      // Ajustar el tamaño del tablero para que sea responsivo pero no demasiado grande
      setBoardWidth(Math.max(300, Math.min(containerWidth - 20, 560)));
    }
  }, []);

  useEffect(() => {
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [updateBoardSize]);

  // Initialize game state from position prop
  useEffect(() => {
    try {
      const newGame = new Chess(position);
      setGame(newGame);
      setSelectedSquare(null);
      setPossibleMoves([]);
    } catch (e) {
      console.error('Invalid position:', e);
      setErrorMessage('Posición de ajedrez inválida');
      setShowError(true);
    }
  }, [position]);

  // Timer logic
  useEffect(() => {
    if (!puzzleActive || hasSubmittedOrCompleted) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [puzzleActive, hasSubmittedOrCompleted, endTime]);

  // Ocultar mensaje de error después de 3 segundos
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleSquareClick = (square: Square) => {
    if (!puzzleActive || hasSubmittedOrCompleted) {
      setErrorMessage('No puedes mover en este momento');
      setShowError(true);
      return;
    }

    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        
        // Calcular movimientos posibles para esta pieza
        try {
          const moves = game.moves({ square, verbose: true }) as Move[];
          const targetSquares = moves.map(move => move.to);
          setPossibleMoves(targetSquares);
        } catch (e) {
          console.error('Error al calcular movimientos:', e);
          setPossibleMoves([]);
        }
      } else if (piece) {
        setErrorMessage('No es tu turno para mover esta pieza');
        setShowError(true);
      } else {
        setErrorMessage('Selecciona una pieza primero');
        setShowError(true);
      }
    } else {
      // Verificar si el movimiento es legal
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q', // Siempre promover a reina por simplicidad
      };

      try {
        const newGame = new Chess(game.fen());
        const moveResult = newGame.move(move);
        
        if (moveResult) {
          setGame(newGame);
          onMoveAttempt(moveResult.san);
        } else {
          setErrorMessage('Movimiento ilegal');
          setShowError(true);
        }
      } catch (e) {
        console.error('Movimiento inválido:', e);
        setErrorMessage('Movimiento inválido');
        setShowError(true);
      }

      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Generar estilos para los cuadrados
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  
  // Estilo para el cuadrado seleccionado
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)',
      borderRadius: '4px',
    };
  }
  
  // Estilos para los movimientos posibles
  possibleMoves.forEach(square => {
    customSquareStyles[square] = {
      background: 'radial-gradient(circle, rgba(0,0,0,0.1) 25%, transparent 25%)',
      borderRadius: '50%',
    };
    
    // Si hay una pieza en el cuadrado de destino, mostrar un borde para indicar captura
    if (game.get(square)) {
      customSquareStyles[square] = {
        ...customSquareStyles[square],
        background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.1) 40%)',
        borderRadius: '50%',
      };
    }
  });

  // Determinar el color del mensaje según el resultado del movimiento
  const getMessageColor = () => {
    if (lastMoveCorrect === true) return 'text-green-600';
    if (lastMoveCorrect === false) return 'text-red-600';
    return 'text-blue-600';
  };

  // Determinar el icono del mensaje según el resultado del movimiento
  const getMessageIcon = () => {
    if (lastMoveCorrect === true) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (lastMoveCorrect === false) return <XCircle className="h-5 w-5 text-red-600" />;
    return <Info className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna del tablero */}
        <div className="w-full lg:w-2/3">
          <Card className="shadow-lg border-2 border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">
                  Puzzle #{puzzleIndex + 1} {totalPuzzles > 0 && <span className="text-gray-500 text-sm">de {totalPuzzles}</span>}
                </CardTitle>
                <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="text-md px-3 py-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeLeft}s
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mensaje de error */}
              {showError && errorMessage && (
                <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {errorMessage}
                </div>
              )}
              
              {/* Tablero de ajedrez */}
              <div ref={boardWrapperRef} className="mx-auto">
                <Chessboard
                  position={game.fen()}
                  onSquareClick={handleSquareClick}
                  customSquareStyles={customSquareStyles}
                  boardWidth={boardWidth}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '2px solid #e5e7eb',
                  }}
                  areArrowsAllowed={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral de información */}
        <div className="w-full lg:w-1/3 space-y-4">
          {/* Tarjeta de información del puzzle */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Información del Puzzle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Puntos base:</span>
                <Badge variant="outline" className="font-semibold">{points}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estado:</span>
                <Badge 
                  variant={hasSubmittedOrCompleted ? "outline" : "secondary"}
                  className={`${hasSubmittedOrCompleted ? (lastMoveCorrect ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200") : ""}`}
                >
                  {hasSubmittedOrCompleted 
                    ? (lastMoveCorrect ? "Completado" : "Fallido") 
                    : (puzzleActive ? "Activo" : "Esperando")}
                </Badge>
              </div>
              
              {pointsAwarded !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Puntos ganados:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    +{pointsAwarded}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Tarjeta de instrucciones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Encuentra la mejor jugada para el bando que está en turno.</p>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Haz clic en una pieza y luego en el destino para moverla.</p>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Los puntos se otorgan según la precisión y el tiempo empleado.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Mensaje de feedback */}
          {message && (
            <Card className={`border ${lastMoveCorrect ? "border-green-300" : lastMoveCorrect === false ? "border-red-300" : "border-blue-300"}`}>
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 ${getMessageColor()} font-medium`}>
                  {getMessageIcon()}
                  <span>{message}</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Estado de espera */}
          {!puzzleActive && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Info className="h-5 w-5" />
                  <span>Esperando al siguiente puzzle...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleView;