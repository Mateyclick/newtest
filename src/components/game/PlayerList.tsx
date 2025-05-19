
import React from 'react';
import { Users } from 'lucide-react';

interface Player {
  nickname: string;
  score: number;
}

interface PlayerListProps {
  players: Player[];
}

export const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <Users size={20} className="text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">
          Jugadores en la Sala ({players.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {players.map((player) => (
          <div 
            key={player.nickname}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
          >
            <div className="font-medium">{player.nickname}</div>
            <div className="text-gray-600">
              Puntaje: <span className="font-semibold">{(player.score || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
        
        {players.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Aún no se han unido jugadores
          </div>
        )}
      </div>
    </div>
  );
};
