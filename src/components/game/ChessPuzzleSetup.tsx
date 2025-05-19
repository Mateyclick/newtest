import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { PuzzleState } from '@/lib/types/game';

interface ChessPuzzleSetupProps {
  puzzle: {
    position: string;
    mainLine?: string;
    timer: number;
    points: number;
  };
  onPuzzleUpdate: (puzzle: PuzzleState) => void;
  disabled: boolean;
}

const ChessPuzzleSetup: React.FC<ChessPuzzleSetupProps> = ({ puzzle, onPuzzleUpdate, disabled }) => {
  const [game, setGame] = useState(new Chess());
  const [mainLineString, setMainLineString] = useState('');
  const [timer, setTimer] = useState(60);
  const [points, setPoints] = useState(100);

  useEffect(() => {
    if (puzzle) {
      try {
        const fenToLoad = puzzle.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const initialGame = new Chess(fenToLoad);
        setGame(initialGame);
        setMainLineString(puzzle.mainLine || '');
        setTimer(puzzle.timer || 60);
        setPoints(puzzle.points || 100);
      } catch (e) {
        console.error('Invalid FEN, using starting position:', e);
        const defaultGame = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setGame(defaultGame);
      }
    }
  }, [puzzle]);

  const updateBoardState = (newGameInstance: Chess) => {
    const newFen = newGameInstance.fen();
    setGame(newGameInstance);
    onPuzzleUpdate({
      position: newFen,
      mainLine: mainLineString,
      timer,
      points,
    });
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (disabled) return false;

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;
      updateBoardState(gameCopy);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleMainLineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    setMainLineString(e.target.value);
    onPuzzleUpdate({
      position: game.fen(),
      mainLine: e.target.value,
      timer,
      points,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white rounded-lg shadow-sm p-6">
      <div className="w-full md:w-1/2">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          boardWidth={400}
        />
      </div>
      <div className="w-full md:w-1/2 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tiempo (segundos)
          </label>
          <input
            type="number"
            min="10"
            max="300"
            value={timer}
            disabled={disabled}
            onChange={(e) => {
              const newTimer = parseInt(e.target.value);
              setTimer(newTimer);
              onPuzzleUpdate({
                position: game.fen(),
                mainLine: mainLineString,
                timer: newTimer,
                points,
              });
            }}
            className="w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Puntos
          </label>
          <input
            type="number"
            min="50"
            max="1000"
            value={points}
            disabled={disabled}
            onChange={(e) => {
              const newPoints = parseInt(e.target.value);
              setPoints(newPoints);
              onPuzzleUpdate({
                position: game.fen(),
                mainLine: mainLineString,
                timer,
                points: newPoints,
              });
            }}
            className="w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Línea Principal (movimientos en SAN)
          </label>
          <textarea
            value={mainLineString}
            onChange={handleMainLineChange}
            disabled={disabled}
            className="w-full h-32 rounded-md border p-2"
            placeholder="e4 e5 Nf3 Nc6..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChessPuzzleSetup;