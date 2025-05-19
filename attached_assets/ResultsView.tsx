import React from 'react';
import { Trophy, CheckCircle, XCircle, Clock, Medal } from 'lucide-react'; // Añadido Medal

interface Player {
  id?: string; // El id del jugador puede ser útil para las keys si lo tienes
  nickname: string;
  score: number;
}

interface PlayerResult {
  playerId: string;
  nickname: string;
  answer: string;
  isCorrect: boolean;
  pointsAwarded: number; 
  timeTaken: number | null; 
}

interface ResultsViewProps {
  solution: string;
  leaderboard: Player[];
  playerResults: PlayerResult[];
  currentPlayerNickname: string;
  isFinalRanking?: boolean; // Nueva prop para indicar si es el ranking final de la sesión
}

const ResultsView: React.FC<ResultsViewProps> = ({
  solution,
  leaderboard,
  playerResults,
  currentPlayerNickname,
  isFinalRanking = false, // Valor por defecto
}) => {
  const currentPlayerResult = playerResults.find(
    (result) => result.nickname === currentPlayerNickname
  );

  // Ordenar el leaderboard aquí mismo para asegurar el orden para el podio y la lista
  const sortedLeaderboard = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const topThree = sortedLeaderboard.slice(0, 3);
  const restOfPlayers = sortedLeaderboard.slice(3);

  const getMedalColor = (index: number): string => {
    if (index === 0) return "text-yellow-500"; // Oro
    if (index === 1) return "text-gray-400";  // Plata
    if (index === 2) return "text-orange-500"; // Bronce
    return "text-gray-500"; // Para otros por si acaso
  };
  
  const getPodiumCardClasses = (index: number): string => {
    let baseClasses = "flex flex-col items-center p-6 rounded-lg shadow-lg text-center ";
    if (index === 0) baseClasses += "bg-yellow-100 border-2 border-yellow-400 order-2 md:order-2 h-full"; // Oro - centro en podio
    else if (index === 1) baseClasses += "bg-gray-100 border-2 border-gray-300 order-1 md:order-1 md:mt-8 h-[calc(100%-2rem)]"; // Plata - izquierda
    else if (index === 2) baseClasses += "bg-orange-100 border-2 border-orange-400 order-3 md:order-3 md:mt-8 h-[calc(100%-2rem)]"; // Bronce - derecha
    return baseClasses;
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Solución y Resultados de la Ronda */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Solución del Problema
          </h2>
          {/* ... (resto de la sección de solución y resultados de la ronda sin cambios) ... */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Solución Correcta
            </h3>
            <div className="font-mono text-lg">
              {solution || "(No se proporcionó solución)"}
            </div>
          </div>
          
          {currentPlayerResult && (
            <div className={`rounded-md p-4 mb-6 ${
              currentPlayerResult.isCorrect 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                {currentPlayerResult.isCorrect ? (
                  <>
                    <CheckCircle size={20} className="text-green-600 mr-2" />
                    <span className="text-green-800">¡Tu respuesta fue correcta!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-red-600 mr-2" />
                    <span className="text-red-800">Tu respuesta fue incorrecta</span>
                  </>
                )}
              </h3>
              <div>
                <span className="font-medium text-gray-700">Tu respuesta: </span>
                <span className="font-mono">
                  {currentPlayerResult.answer || '(Sin respuesta)'}
                </span>
              </div>
              {currentPlayerResult.timeTaken !== null && (
                <div className="text-sm text-gray-600 mt-1 flex items-center">
                  <Clock size={14} className="mr-1 text-gray-500"/>
                  Tiempo: <span className="font-medium ml-1">{currentPlayerResult.timeTaken}s</span>
                </div>
              )}
              <div className="text-sm text-gray-600 mt-1">
                Puntos esta ronda: <span className="font-medium">{(currentPlayerResult.pointsAwarded || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Resultados de Todos los Jugadores (Esta Ronda)
            </h3>
            <div className="space-y-2">
              {playerResults.map((result) => (
                <div 
                  key={result.playerId}
                  className={`p-3 rounded-md border ${
                    result.nickname === currentPlayerNickname
                      ? 'bg-blue-50 border-blue-200'
                      : result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* ... (contenido del resultado individual sin cambios) ... */}
                  <div className="flex items-center mb-1">
                    <div className="mr-2">
                      {result.isCorrect ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <XCircle size={18} className="text-red-600" />
                      )}
                    </div>
                    <div className="font-medium text-gray-800">
                      {result.nickname}
                      {result.nickname === currentPlayerNickname && (
                        <span className="ml-2 text-blue-700 text-xs font-normal">(Tú)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 pl-7">
                    Respuesta: <span className="font-mono">{result.answer || '(Sin respuesta)'}</span>
                  </div>
                  {result.timeTaken !== null && (
                    <div className="text-xs text-gray-500 mt-0.5 pl-7 flex items-center">
                      <Clock size={12} className="mr-1"/>
                      Tiempo: {result.timeTaken}s
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5 pl-7">
                    Puntos en ronda: {(result.pointsAwarded || 0).toFixed(2)}
                  </div>
                </div>
              ))}
               {playerResults.length === 0 && (
                 <p className="text-gray-500 text-sm">Nadie envió una respuesta para este problema.</p>
               )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Columna Derecha: Tabla de Clasificación */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6"> {/* Aumentado margen inferior */}
            <h3 className="text-2xl font-bold text-gray-800"> {/* Título más grande */}
              {isFinalRanking ? "🏆 Ranking Final 🏆" : "Tabla de Clasificación"}
            </h3>
            {!isFinalRanking && <Trophy size={24} className="text-yellow-500" />}
          </div>
          
          {isFinalRanking ? (
            // --- DISEÑO DE PODIO PARA RANKING FINAL ---
            <div className="space-y-4">
              {topThree.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end min-h-[280px] md:min-h-[320px]">
                  {/* Segundo Lugar (si existe) */}
                  {topThree[1] ? (
                    <div className={getPodiumCardClasses(1)}>
                      <Medal size={48} className={getMedalColor(1)} />
                      <div className="mt-3">
                        <p className="text-xl font-semibold text-gray-700">{topThree[1].nickname}</p>
                        <p className="text-2xl font-bold text-gray-800">{(topThree[1].score || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">2do Lugar</p>
                      </div>
                    </div>
                  ) : <div className="order-1 md:order-1"></div> /* Placeholder para layout */}

                  {/* Primer Lugar (si existe) */}
                  {topThree[0] ? (
                     <div className={getPodiumCardClasses(0)}>
                      <Medal size={64} className={getMedalColor(0)} /> {/* Más grande */}
                      <div className="mt-4">
                        <p className="text-2xl font-bold text-yellow-700">{topThree[0].nickname}</p>
                        <p className="text-3xl font-extrabold text-yellow-800">{(topThree[0].score || 0).toFixed(2)}</p>
                        <p className="text-md font-semibold text-yellow-600">¡CAMPEÓN!</p>
                      </div>
                    </div>
                  ) : <div className="order-2 md:order-2"></div> /* Placeholder */}

                  {/* Tercer Lugar (si existe) */}
                  {topThree[2] ? (
                    <div className={getPodiumCardClasses(2)}>
                      <Medal size={48} className={getMedalColor(2)} />
                       <div className="mt-3">
                        <p className="text-xl font-semibold text-gray-700">{topThree[2].nickname}</p>
                        <p className="text-2xl font-bold text-gray-800">{(topThree[2].score || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">3er Lugar</p>
                      </div>
                    </div>
                  ) : <div className="order-3 md:order-3"></div> /* Placeholder */}
                </div>
              ) : (
                 <div className="text-center text-gray-500 py-4">Aún no hay puntajes para el podio.</div>
              )}

              {/* Lista para el resto de jugadores si hay más de 3 */}
              {restOfPlayers.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Más Jugadores</h4>
                  <div className="space-y-2">
                    {restOfPlayers.map((player, index) => (
                      <div 
                        key={player.id || player.nickname}
                        className={`flex items-center justify-between bg-gray-50 p-3 rounded-md border ${
                           player.nickname === currentPlayerNickname ? 'border-blue-300' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-gray-600 mr-2">
                            {index + 4}. {/* Empieza desde la 4ta posición */}
                          </span>
                          <span className="font-medium text-gray-800">{player.nickname}</span>
                           {player.nickname === currentPlayerNickname && (
                            <span className="ml-2 text-blue-700 text-xs font-normal">(Tú)</span>
                           )}
                        </div>
                        <div className="font-bold text-gray-800">{(player.score || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
               {sortedLeaderboard.length === 0 && (
                 <div className="text-center text-gray-500 py-4">No hay jugadores en el ranking.</div>
               )}

            </div>
          ) : (
            // --- DISEÑO DE LISTA NORMAL PARA RANKING INTERMEDIO ---
            <div className="space-y-2">
              {sortedLeaderboard.map((player, index) => (
                <div 
                  key={player.id || player.nickname} // Usar id si está disponible, sino nickname
                  className={`flex items-center p-3 rounded-md ${
                    player.nickname === currentPlayerNickname
                      ? 'bg-blue-100 border border-blue-300'
                      : index === 0 
                        ? 'bg-yellow-50 border border-yellow-200' // Destacar el 1ro también en la lista normal
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`text-lg font-bold mr-3 w-8 text-center ${
                      index === 0 ? 'text-yellow-600' : 
                      index === 1 ? 'text-gray-500' :
                      index === 2 ? 'text-orange-700' : 'text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {player.nickname}
                      {player.nickname === currentPlayerNickname && (
                        <span className="ml-2 text-blue-700 text-xs font-normal">(Tú)</span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-lg text-gray-800">
                    {(player.score || 0).toFixed(2)}
                  </div>
                </div>
              ))}
              {sortedLeaderboard.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Aún no hay puntajes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;