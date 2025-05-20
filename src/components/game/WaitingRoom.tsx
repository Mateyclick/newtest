
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Hourglass } from 'lucide-react';
import { PlayerList } from './PlayerList';


interface WaitingRoomProps {
  players: Player[]; // <--- CORREGIDO: Ahora usa el tipo Player[]
  currentPuzzleIndex?: number; // 0-based index del ÚLTIMO puzzle completado/lanzado
  totalPuzzles?: number;
}


const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  players = [], 
  currentPuzzleIndex = 0, 
  totalPuzzles = 0 
}) => {
  const nextPuzzleNum = currentPuzzleIndex >= 0 ? currentPuzzleIndex + 2 : 1;
  const displayTotal = totalPuzzles > 0 ? totalPuzzles : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Hourglass size={40} className="text-blue-800" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Esperando el siguiente problema ({displayTotal > 0 ? nextPuzzleNum : 0} de {displayTotal})...
        </h2>
        <p className="text-gray-600">
          El administrador iniciará el siguiente problema pronto. ¡Prepárate!
        </p>
      </div>
      
      <PlayerList players={players} />
    </div>
  );
};

export default WaitingRoom;