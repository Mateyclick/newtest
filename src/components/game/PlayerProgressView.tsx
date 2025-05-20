import React, { useState, useEffect } from 'react';
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/hooks/useGameSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlayerProgressInfo {
  id: string;
  nickname: string;
  lastAttemptedMove?: string;
  status: 'solving' | 'completed' | 'failed' | 'waiting' | 'correct_step';
  time?: number;
  opponentMoveSAN?: string;
  moveHistory?: string[]; // Historial de movimientos
}

interface PlayerProgressViewProps {
  playerProgress?: Record<string, PlayerProgressInfo>;
}

const PlayerProgressView: React.FC<PlayerProgressViewProps> = ({ playerProgress }) => {
  // Validación defensiva para evitar errores cuando playerProgress es null o undefined
  if (!playerProgress || Object.keys(playerProgress).length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progreso de Jugadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No hay datos de progreso disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Progreso de Jugadores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.values(playerProgress).map((player) => (
            <Card key={player.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium">{player.nickname}</CardTitle>
                  <StatusBadge status={player.status} />
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Tiempo empleado */}
                {player.time !== undefined && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{player.time.toFixed(1)}s</span>
                  </div>
                )}
                
                {/* Historial completo de movimientos */}
                {player.moveHistory && player.moveHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Historial de movimientos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {player.moveHistory.map((move, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${index === player.moveHistory!.length - 1 
                                    ? 'bg-primary/10 text-primary border-primary/30' 
                                    : 'bg-muted/30'}
                                `}
                              >
                                {index + 1}. {move}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Movimiento #{index + 1}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Último movimiento intentado (para compatibilidad) */}
                {!player.moveHistory && player.lastAttemptedMove && (
                  <div className="flex items-center text-sm">
                    <ArrowRight className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Último movimiento: <span className="font-mono">{player.lastAttemptedMove}</span></span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente auxiliar para mostrar el estado del jugador
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant = "outline";
  let label = "Desconocido";
  let icon = null;

  switch (status) {
    case 'solving':
      variant = "secondary";
      label = "Resolviendo";
      break;
    case 'completed':
      variant = "outline";
      label = "Completado";
      icon = <CheckCircle className="h-3 w-3 mr-1 text-green-500" />;
      break;
    case 'failed':
      variant = "outline";
      label = "Fallido";
      icon = <XCircle className="h-3 w-3 mr-1 text-red-500" />;
      break;
    case 'waiting':
      variant = "outline";
      label = "Esperando";
      break;
    case 'correct_step':
      variant = "outline";
      label = "Paso Correcto";
      icon = <CheckCircle className="h-3 w-3 mr-1 text-green-500" />;
      break;
  }

  return (
    <Badge variant={variant as any} className={`
      ${status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
      ${status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : ''}
      ${status === 'correct_step' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
    `}>
      {icon}{label}
    </Badge>
  );
};

export default PlayerProgressView;
