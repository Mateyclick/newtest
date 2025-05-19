
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, Move } from 'chess.js';
import { Clock } from 'lucide-react';

interface PuzzleViewProps {
  position: string;
  points: number;
  endTime: number;
  onMoveAttempt: (moveSAN: string) => void;
  hasSubmittedOrCompleted: boolean;
  puzzleActive: boolean;
}

const PuzzleView: React.FC<PuzzleViewProps> = ({
  position,
  points,
  endTime,
  onMoveAttempt,
  hasSubmittedOrCompleted,
  puzzleActive,
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  
  // Board size responsiveness
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

  // Initialize game state from position prop
  useEffect(() => {
    try {
      const newGame = new Chess(position);
      setGame(newGame);
    } catch (e) {
      console.error('Invalid position:', e);
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

  const handleSquareClick = (square: Square) => {
    if (!puzzleActive || hasSubmittedOrCompleted) return;

    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    } else {
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q',
      };

      try {
        const newGame = new Chess(game.fen());
        const moveResult = newGame.move(move);
        
        if (moveResult) {
          setGame(newGame);
          onMoveAttempt(moveResult.san);
        }
      } catch (e) {
        console.error('Invalid move:', e);
      }

      setSelectedSquare(null);
    }
  };

  const customSquareStyles = {
    ...(selectedSquare && {
      [selectedSquare]: {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      },
    }),
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-6">
      <div className="w-full md:w-2/3 mx-auto">
        <div ref={boardWrapperRef}>
          <Chessboard
            position={game.fen()}
            onSquareClick={handleSquareClick}
            customSquareStyles={customSquareStyles}
            boardWidth={boardWidth}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Puzzle Info</h3>
            <span className="text-sm text-gray-500">Points: {points}</span>
          </div>
          
          <div className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            <span className={timeLeft <= 10 ? "text-red-500" : ""}>
              {timeLeft}s
            </span>
          </div>

          {hasSubmittedOrCompleted && (
            <div className="text-blue-600 font-medium">
              Answer submitted
            </div>
          )}

          {!puzzleActive && (
            <div className="text-gray-500">
              Waiting for the next puzzle...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleView;
