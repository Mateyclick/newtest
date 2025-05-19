
import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

interface PlayerResult {
  wasAttempted: boolean;
  wasSolved: boolean;
  wasFailed: boolean;
  timeSpent: number | null;
  pointsEarned: number;
  nickname: string;
}

interface ResultsViewProps {
  results: {
    solution: string;
    leaderboard: Array<{id: string; nickname: string; score: number}>;
    playerResults: Record<string, PlayerResult>;
  };
  currentPlayerNickname: string;
  isFinalRanking?: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  results, 
  currentPlayerNickname,
  isFinalRanking = false 
}) => {
  const playerResultValues = Object.values(results.playerResults);
  const currentPlayerResult = playerResultValues.find(
    result => result.nickname === currentPlayerNickname
  );

  // Ordenar leaderboard por puntaje
  const sortedLeaderboard = [...results.leaderboard].sort((a, b) => b.score - a.score);
  const top3 = sortedLeaderboard.slice(0, 3);

  const getPodiumStyle = (position: number) => {
    const baseClasses = "p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 ";
    switch (position) {
      case 0: // 🥇 Oro
        return baseClasses + "bg-yellow-100 border-2 border-yellow-400 h-64 z-30";
      case 1: // 🥈 Plata
        return baseClasses + "bg-gray-100 border-2 border-gray-300 h-56 z-20";
      case 2: // 🥉 Bronce
        return baseClasses + "bg-orange-100 border-2 border-orange-300 h-48 z-10";
      default:
        return baseClasses + "bg-white";
    }
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "🏅";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="p-6">
        {isFinalRanking ? (
          <>
            <h2 className="text-3xl font-bold mb-8 text-center">🏆 Ranking Final 🏆</h2>
            
            <div className="flex justify-center items-end gap-4 mb-8 h-80">
              {/* Debugger */}
              <div className="text-xs text-gray-500 mb-2">
                Debug: isFinalRanking={String(isFinalRanking)}, 
                Players={results.leaderboard.length}
              </div>
              {/* Plata - Segundo lugar */}
              {top3[1] && (
                <div className={getPodiumStyle(1)}>
                  {getMedalEmoji(1)}
                  <p className="text-xl font-bold mt-2">{top3[1].nickname}</p>
                  <p className="text-2xl font-semibold">{top3[1].score.toFixed(1)}</p>
                  <p className="text-gray-600">Segundo Lugar</p>
                </div>
              )}
              
              {/* Oro - Primer lugar */}
              {top3[0] && (
                <div className={getPodiumStyle(0)}>
                  {getMedalEmoji(0)}
                  <p className="text-2xl font-bold mt-2">{top3[0].nickname}</p>
                  <p className="text-3xl font-semibold">{top3[0].score.toFixed(1)}</p>
                  <p className="text-yellow-600 font-bold">¡CAMPEÓN!</p>
                </div>
              )}
              
              {/* Bronce - Tercer lugar */}
              {top3[2] && (
                <div className={getPodiumStyle(2)}>
                  {getMedalEmoji(2)}
                  <p className="text-lg font-bold mt-2">{top3[2].nickname}</p>
                  <p className="text-xl font-semibold">{top3[2].score.toFixed(1)}</p>
                  <p className="text-gray-600">Tercer Lugar</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Resultados del Puzzle</h2>
            
            {currentPlayerResult && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Tu Resultado</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>Estado: {
                    currentPlayerResult.wasSolved ? 
                      <span className="text-green-600">¡Resuelto correctamente!</span> : 
                      currentPlayerResult.wasFailed ? 
                        <span className="text-red-600">Intento fallido</span> : 
                        <span className="text-gray-600">Sin intentos</span>
                  }</p>
                  {currentPlayerResult.timeSpent !== null && (
                    <p>Tiempo: {currentPlayerResult.timeSpent.toFixed(1)} segundos</p>
                  )}
                  {currentPlayerResult.wasSolved && (
                    <p>Puntos ganados: {currentPlayerResult.pointsEarned}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Solución</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-mono">{results.solution}</p>
              </div>
            </div>
          </>
        )}

        <div>
          <h3 className="text-xl font-semibold mb-2">
            {isFinalRanking ? "Tabla Completa" : "Tabla de Posiciones"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Posición</th>
                  <th className="p-2 text-left">Jugador</th>
                  <th className="p-2 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {results.leaderboard.map((player, index) => (
                  <tr 
                    key={player.id}
                    className={`border-t ${
                      player.nickname === currentPlayerNickname ? 'bg-blue-50' : ''
                    } ${index < 3 && isFinalRanking ? 'font-semibold' : ''}`}
                  >
                    <td className="p-2">
                      {isFinalRanking ? `${getMedalEmoji(index)} ${index + 1}` : index + 1}
                    </td>
                    <td className="p-2">{player.nickname}</td>
                    <td className="p-2 text-right">{player.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsView;
