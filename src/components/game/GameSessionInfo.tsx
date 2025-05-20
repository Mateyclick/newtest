// En tu archivo GameSessionInfo.tsx

import React, { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface GameSessionInfoProps {
  sessionId: string | null; // Permitir null si puede serlo inicialmente
  currentPuzzleIndex: number;
  totalPuzzles: number;
  puzzleActive: boolean;
  showResults: boolean;
}

const GameSessionInfo: React.FC<GameSessionInfoProps> = ({
  sessionId,
  currentPuzzleIndex,
  totalPuzzles,
  puzzleActive,
  showResults
}) => {
  // ---- AÑADIR ESTE LOG ----
  console.log('[GameSessionInfo] Props recibidas:', { 
    sessionId, 
    currentPuzzleIndex, 
    totalPuzzles, 
    puzzleActive, 
    showResults 
  });
  // --------------------------

  const [copied, setCopied] = useState(false);
  
  // Manejar el caso de que sessionId sea null para la URL
  const shareableUrl = sessionId ? `${window.location.origin}/juego/${sessionId}` : "";
  
  const copyToClipboard = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  let statusText = 'Esperando para iniciar problema';
  let statusColor = 'text-gray-600 dark:text-gray-400';
  
  if (puzzleActive) {
    statusText = 'Problema activo';
    statusColor = 'text-green-600 dark:text-green-400';
  } else if (showResults) {
    statusText = 'Mostrando resultados';
    statusColor = 'text-blue-600 dark:text-blue-400';
  }

  // Para el display de Problema X de Y, manejar NaN o valores iniciales
  const displayPuzzleNum = typeof currentPuzzleIndex === 'number' && currentPuzzleIndex >= -1 ? currentPuzzleIndex + 1 : 'N/A';
  const displayTotalPuzzles = typeof totalPuzzles === 'number' && totalPuzzles >= 0 ? totalPuzzles : 'N/A';

  return (
    <div className="space-y-3 text-sm sm:text-base">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div>
          <span className="font-medium text-muted-foreground">ID de Sesión:</span>
          <span className="ml-2 font-mono font-medium text-foreground">{sessionId || '---'}</span>
        </div>
        
        <div>
          <span className="font-medium text-muted-foreground">Problema:</span>
          <span className={`ml-2 font-medium ${displayPuzzleNum === 'N/A' || displayTotalPuzzles === 'N/A' ? 'text-destructive' : 'text-foreground'}`}>
            {displayPuzzleNum} de {displayTotalPuzzles}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-muted-foreground">Estado:</span>
          <span className={`ml-2 font-medium ${statusColor}`}>{statusText}</span>
        </div>
      </div>
      
      {sessionId && ( // Solo mostrar si hay sessionId
        <div className="flex flex-wrap items-center">
          <span className="font-medium text-muted-foreground mr-2">URL para Compartir:</span>
          <div className="flex-1 flex items-center min-w-[200px] sm:min-w-[280px]">
            <input
              type="text"
              value={shareableUrl}
              readOnly
              className="flex-1 py-1 px-2 text-xs sm:text-sm border border-input rounded-l-md bg-muted focus:outline-none"
              aria-label="URL para compartir"
            />
            <Button
              onClick={copyToClipboard}
              title={copied ? "¡Copiado!" : "Copiar URL"}
              className="rounded-l-none px-2.5 sm:px-3"
              size="sm"
              variant="outline"
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSessionInfo;