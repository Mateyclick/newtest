import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, Move } from 'chess.js';
import { Clock, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [sequenceCompleted, setSequenceCompleted] = useState(false);
  
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
      setSequenceCompleted(false); // Resetear el estado de secuencia completada
    } catch (e) {
      console.error('Invalid position:', e);
      setErrorMessage('Posición de ajedrez inválida');
      setShowError(true);
    }
  }, [position]);

  // Efecto para detectar cuando se completa una secuencia
  useEffect(() => {
    // Si el último movimiento fue correcto y el jugador ha completado o enviado
    if (lastMoveCorrect === true && hasSubmittedOrCompleted) {
      setSequenceCompleted(true);
      console.log('[PuzzleView] Secuencia completada detectada');
    }
  }, [lastMoveCorrect, hasSubmittedOrCompleted]);

  // Timer logic - MODIFICADO para detener el tiempo cuando se completa la secuencia
  useEffect(() => {
    if (!puzzleActive || hasSubmittedOrCompleted || sequenceCompleted) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [puzzleActive, hasSubmittedOrCompleted, endTime, sequenceCompleted]);

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
    // No permitir movimientos si el puzzle no está activo, se ha completado o la secuencia está completa
    if (!puzzleActive || hasSubmittedOrCompleted || sequenceCompleted) {
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
          console.log('[PuzzleView] Movimiento enviado:', moveResult.san);
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

  // Mostrar un banner de secuencia completada
  const renderCompletedBanner = () => {
    if (sequenceCompleted || (lastMoveCorrect === true && hasSubmittedOrCompleted)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-700 mb-2">¡Correcto!</h3>
            {pointsAwarded !== undefined && (
              <p className="text-xl font-semibold text-gray-800">
                +{pointsAwarded} puntos
              </p>
            )}
            <p className="text-gray-600 mt-2">
              Esperando el siguiente problema...
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna del tablero */}
        <div className="w-full lg:w-2/3">
          <Card className="shadow-lg border-2 border-gray-200 relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Puzzle</CardTitle>
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
              <div ref={boardWrapperRef} className="mx-auto relative">
                {renderCompletedBanner()}
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
                  variant={hasSubmittedOrCompleted || sequenceCompleted ? "outline" : "secondary"}
                  className={`${hasSubmittedOrCompleted || sequenceCompleted ? (lastMoveCorrect ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200") : ""}`}
                >
                  {hasSubmittedOrCompleted || sequenceCompleted
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
