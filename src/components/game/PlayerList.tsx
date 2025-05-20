import React from 'react';
import { Users } from 'lucide-react';
import { Player } from '@/lib/types/game'; // Asegúrate que Player esté importado o definido correctamente

interface PlayerListProps {
  players: Player[]; // La prop sigue siendo un array de Player
}

export const PlayerList: React.FC<PlayerListProps> = ({ players = [] }) => { // Valor por defecto para players
  // Aseguramos que players sea siempre un array para evitar errores con el spread operator o .map
  const safePlayers = Array.isArray(players) ? players : [];

  // Ordenar solo si hay jugadores para evitar errores si 'score' no existe o es inesperado
  const sortedPlayers = [...safePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow"> {/* Añadido un poco de estilo base */}
      <div className="flex items-center mb-4">
        <Users size={20} className="text-gray-700 mr-2" /> {/* Color ligeramente más oscuro */}
        <h3 className="text-lg font-semibold text-gray-800">
          Jugadores en la Sala ({safePlayers.length}) {/* Usar safePlayers.length */}
        </h3>
      </div>
      
      <div className="space-y-2">
        {safePlayers.length > 0 ? (
          sortedPlayers.map((player) => (
            <div 
              // Usar player.userId si está disponible y es único, sino nickname (pero nickname puede no ser único)
              // Asumiendo que Player tiene un 'id' único como definimos en game.ts
              key={player.id || player.nickname} 
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-3 rounded-md transition-colors"
            >
              <div className="font-medium text-slate-700">{player.nickname || 'Jugador Desconocido'}</div>
              <div className="text-sm text-slate-600">
                Puntaje: <span className="font-semibold text-slate-800">{(player.score || 0).toFixed(2)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            Aún no se han unido jugadores.
          </div>
        )}
      </div>
    </div>
  );
};

// No es necesario exportar default si ya usas export const
// export default PlayerList;