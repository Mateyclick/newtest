import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Importado CardContent, etc. para mejor estructura
import { Trophy, Medal, CheckCircle, XCircle, HelpCircle } from 'lucide-react'; // Importado más iconos
import { SolutionLine, Player } from '@/lib/types/game'; // Asumiendo que Player está definido aquí
// Definición local de PlayerResultDetail si no está en game.ts o si es específica aquí
// Debería coincidir con lo que playerResults contiene en el payload de results_revealed

interface PlayerResultForView { // Lo que esperamos dentro de results.playerResults[userId]
  nickname: string;
  wasAttempted: boolean;
  wasSolved: boolean;
  wasFailed: boolean;
  timeSpent: number | null;
  pointsEarned: number;
  // Podríamos añadir progressPerLine aquí si queremos mostrar más detalle
  // progressPerLine?: Record<string, { currentStep: number; failed: boolean; completed: boolean }>;
  completedLineId?: string; // Para saber qué línea completó
}

interface ResultsViewProps {
  results: {
    solution?: string; // Para compatibilidad con formato antiguo
    solutionLines?: Array<{ id: string; moves: string[] | string; points: number; label?: string }>; // Array de movimientos normalizados o string SAN
    leaderboard: Player[]; // Usar el tipo Player importado
    playerResults: Record<string, PlayerResultForView>; // Usar PlayerResultForView
    position?: string;
    puzzleIndex?: number;
    puzzleTimer?: number;
    puzzlePoints?: number; // Puntos base (quizás de la línea principal o max)
    hasMultipleSolutions?: boolean;
  };
  currentPlayerNickname: string;
  isFinalRanking?: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ 
  results, 
  currentPlayerNickname,
  isFinalRanking = false 
}) => {
  // Verificaciones para asegurar que results y sus propiedades existan
  if (!results || !results.playerResults || !results.leaderboard) {
    // Podrías retornar un loader o un mensaje de error más amigable
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-red-500">Error: Datos de resultados no disponibles o incompletos.</p>
      </div>
    );
  }

  const playerResultValues = Object.values(results.playerResults || {});
  const currentPlayerResult = playerResultValues.find(
    result => result.nickname === currentPlayerNickname
  );

  const sortedLeaderboard = Array.isArray(results.leaderboard) 
    ? [...results.leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0))
    : [];
  const top3 = sortedLeaderboard.slice(0, 3);

  const getPodiumStyle = (position: number): string => {
    const baseClasses = "p-4 md:p-6 rounded-xl shadow-xl text-center transform transition-all duration-300 hover:scale-105 border-2 flex flex-col items-center justify-around ";
    switch (position) {
      case 0: return baseClasses + "bg-gradient-to-br from-yellow-300 to-amber-400 border-yellow-500 h-56 md:h-64 z-30"; // Oro
      case 1: return baseClasses + "bg-gradient-to-br from-slate-200 to-gray-300 border-slate-400 h-48 md:h-56 z-20";    // Plata
      case 2: return baseClasses + "bg-gradient-to-br from-orange-300 to-amber-500 border-orange-500 h-40 md:h-48 z-10"; // Bronce
      default: return baseClasses + "bg-white border-gray-200";
    }
  };

  const getMedalEmoji = (position: number): string => {
    switch (position) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `🏅 ${position + 1}°`; // Añadir número para los demás
    }
  };
  
  const formatSolutionMoves = (moves: string[] | string): string => {
    if (Array.isArray(moves)) {
      return moves.join(' ');
    }
    return moves; // Asumir que ya es un string SAN formateado si no es array
  };

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-6">
      <Card className="overflow-hidden shadow-2xl rounded-xl">
        <CardHeader className={`p-4 sm:p-6 ${isFinalRanking ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-100'}`}>
          <CardTitle className={`text-2xl sm:text-3xl font-bold text-center ${isFinalRanking ? 'text-white' : 'text-slate-800'}`}>
            {isFinalRanking ? "🏆 Ranking Final de la Sesión 🏆" : `Resultados del Problema #${(results.puzzleIndex ?? 0) + 1}`}
          </CardTitle>
          {!isFinalRanking && results.position && (
            <CardDescription className={`text-center text-xs sm:text-sm mt-1 ${isFinalRanking ? 'text-blue-100' : 'text-slate-500'}`}>
              FEN: {results.position}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 space-y-6">
          {isFinalRanking ? (
            <div className="flex flex-col sm:flex-row justify-center items-end gap-2 sm:gap-4 mb-8 h-auto sm:h-72">
              {/* Plata */}
              {top3[1] && (
                <div className={`${getPodiumStyle(1)} w-full sm:w-1/3`}>
                  <span className="text-3xl sm:text-4xl">{getMedalEmoji(1)}</span>
                  <p className="text-lg sm:text-xl font-bold mt-1 sm:mt-2 text-slate-700 truncate">{top3[1].nickname}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-800">{(top3[1].score || 0).toFixed(1)} pts</p>
                  <p className="text-xs sm:text-sm text-slate-600">Segundo Lugar</p>
                </div>
              )}
              {/* Oro */}
              {top3[0] && (
                <div className={`${getPodiumStyle(0)} w-full sm:w-1/3 order-first sm:order-none`}>
                   <span className="text-4xl sm:text-5xl">{getMedalEmoji(0)}</span>
                  <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-yellow-700 truncate">{top3[0].nickname}</p>
                  <p className="text-2xl sm:text-3xl font-semibold text-yellow-800">{(top3[0].score || 0).toFixed(1)} pts</p>
                  <p className="text-sm sm:text-base text-yellow-700 font-bold">¡CAMPEÓN!</p>
                </div>
              )}
              {/* Bronce */}
              {top3[2] && (
                <div className={`${getPodiumStyle(2)} w-full sm:w-1/3`}>
                   <span className="text-2xl sm:text-3xl">{getMedalEmoji(2)}</span>
                  <p className="text-md sm:text-lg font-bold mt-1 sm:mt-2 text-orange-700 truncate">{top3[2].nickname}</p>
                  <p className="text-lg sm:text-xl font-semibold text-orange-800">{(top3[2].score || 0).toFixed(1)} pts</p>
                  <p className="text-xs sm:text-sm text-orange-600">Tercer Lugar</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tu Resultado Individual */}
              {currentPlayerResult && (
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-700">Tu Resultado</h3>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200 text-sm sm:text-base">
                    <div className="flex items-center mb-1">
                      {currentPlayerResult.wasSolved ? <CheckCircle className="text-green-500 mr-2 h-5 w-5" /> : currentPlayerResult.wasFailed ? <XCircle className="text-red-500 mr-2 h-5 w-5" /> : <HelpCircle className="text-gray-400 mr-2 h-5 w-5" />}
                      <p>Estado: {
                        currentPlayerResult.wasSolved ? <span className="font-medium text-green-600">¡Resuelto correctamente!</span> :
                        currentPlayerResult.wasFailed ? <span className="font-medium text-red-600">Intento fallido</span> :
                        <span className="text-gray-500">Sin intentos registrados</span>
                      }</p>
                    </div>
                    {currentPlayerResult.timeSpent !== null && typeof currentPlayerResult.timeSpent === 'number' ? (
                      <p className="text-slate-600">Tiempo: <span className="font-medium">{currentPlayerResult.timeSpent.toFixed(1)}</span> segundos</p>
                    ) : (
                      <p className="text-slate-600">Tiempo: N/A</p>
                    )}
                    {currentPlayerResult.wasSolved && (
                      <p className="text-slate-600">Puntos ganados: <span className="font-medium text-blue-600">{currentPlayerResult.pointsEarned}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Sección de Soluciones */}
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-700">
                  {results.hasMultipleSolutions ? "Líneas de Solución" : "Solución Principal"}
                </h3>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200 space-y-2">
                  {results.solutionLines && results.solutionLines.length > 0 ? (
                    results.solutionLines.map((line, index) => (
                      <div key={line.id || index} className="pb-2 mb-2 border-b border-slate-200 last:border-b-0 last:pb-0 last:mb-0">
                        <p className="font-mono text-sm sm:text-base text-slate-800 break-words">
                          <span className="font-semibold text-blue-600">
                            {line.label || (results.solutionLines && results.solutionLines.length > 1 ? `Variante ${index + 1}`: 'Solución')}:
                          </span>
                          {' '} {formatSolutionMoves(line.moves)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Puntos base: {line.points}</p>
                      </div>
                    ))
                  ) : results.solution ? ( // Compatibilidad con formato antiguo
                    <p className="font-mono text-sm sm:text-base text-slate-800 break-words">{results.solution}</p>
                  ) : (
                    <p className="text-slate-500">No hay información de solución disponible.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tabla de Posiciones / Leaderboard */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-slate-700">
              {isFinalRanking ? "Tabla de Clasificación Completa" : "Tabla de Posiciones del Problema"}
            </h3>
            {sortedLeaderboard.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2.5 text-left font-semibold text-slate-600 w-16">Pos.</th>
                      <th className="p-2.5 text-left font-semibold text-slate-600">Jugador</th>
                      <th className="p-2.5 text-right font-semibold text-slate-600 w-24">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedLeaderboard.map((player, index) => (
                      <tr 
                        key={player.id || player.nickname}
                        className={`transition-colors ${
                          player.nickname === currentPlayerNickname ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                        } ${index < 3 && isFinalRanking ? 'font-medium' : ''}`}
                      >
                        <td className="p-2.5 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                            ${index === 0 && isFinalRanking ? "bg-yellow-400 text-yellow-800 font-bold" :
                              index === 1 && isFinalRanking ? "bg-slate-300 text-slate-700 font-bold" :
                              index === 2 && isFinalRanking ? "bg-orange-400 text-orange-800 font-bold" :
                              "text-slate-600"}`}>
                            {isFinalRanking ? getMedalEmoji(index).replace(/°/g, '') : index + 1}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{player.nickname}</td>
                        <td className="p-2.5 text-right text-slate-700 font-medium">{(player.score || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <p className="text-center text-slate-500 py-4">No hay datos de leaderboard disponibles.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsView;