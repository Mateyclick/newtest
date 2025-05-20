import React from 'react';
import { Users } from 'lucide-react';
import { Player } from '@/lib/types/game';

interface PlayerListProps {
  players: Player[];
}

export const PlayerList: React.FC<PlayerListProps> = ({ players = [] }) => {
  // Filtra cualquier elemento que pueda ser undefined o null ANTES de usarlo
  const safePlayers = Array.isArray(players) ? players.filter(player => player != null) : [];

  // Ordenar solo si hay jugadores
  const sortedPlayers = [...safePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <Users size={20} className="text-gray-700 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">
          Jugadores en la Sala ({safePlayers.length})
        </h3>
      </div>

      <div className="space-y-2">
        {safePlayers.length > 0 ? (
          sortedPlayers.map((player) => ( // Ahora 'player' aquí no debería ser undefined
            <div
              // Asumiendo que Player tiene un 'id' único.
              // Si player.id puede ser undefined por el problema de userId vs id,
              // el fallback a player.nickname es importante.
              key={player.id || player.nickname || Math.random()} // Añadido Math.random() como último recurso si ambos son undefined
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-3 rounded-md transition-colors"
            >
              {/* Acceso seguro a nickname y score */}
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