import React, { useState, useEffect } from 'react';;
import { useGameSocket } from '@/contexts/GameSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const JoinSessionView: React.FC = () => {
  const { socket } = useGameSocket();
  const { user, profile } = useAuth();
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleJoinSession = () => {
    if (!socket) {
      setError("Error: No hay conexión con el servidor.");
      return;
    }
    if (!user) {
      setError("Error: Debes estar autenticado para unirte.");
      return;
    }
    if (!sessionIdInput.trim()) {
      setError("Por favor, ingresa un ID de sesión válido.");
      return;
    }
    setJoining(true);
    setError(null);
    const nickname = profile?.display_name || user?.email?.split('@')[0] || 'Jugador Anónimo';

    // Escuchar por errores específicos al unirse
    socket.once('custom_error', (errorData) => {
      if (errorData.message === 'SESSION_NOT_FOUND') {
        setError(`Error: No se encontró la sesión con ID "${sessionIdInput.trim()}". Verifica el ID.`);
      } else if (errorData.message === 'NICKNAME_REQUIRED' || errorData.message === 'SESSION_ID_REQUIRED') {
        setError("Error: Faltan datos para unirse a la sesión.");
      }
      else {
        setError(`Error al unirse a la sesión: ${errorData.message}`);
      }
      setJoining(false);
    });

    socket.emit('join_session', { sessionId: sessionIdInput.trim(), nickname });
    // No limpiar sessionIdInput aquí, permitir reintentos o correcciones.
    // El hook useGameSession y GamePage se encargarán del cambio de vista
    // al recibir 'session_joined' o si hay un error manejado arriba.
  };

  // Limpiar error si el input cambia
  useEffect(() => {
    if (sessionIdInput) setError(null);
  }, [sessionIdInput]);

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Unirse a Sesión de Tácticas</CardTitle>
          <CardDescription className="text-center">
            Ingresa el ID de la sesión proporcionado por el anfitrión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md">{error}</p>}
          <Input
            type="text"
            placeholder="ID de la Sesión (ej: abc123)"
            value={sessionIdInput}
            onChange={(e) => setSessionIdInput(e.target.value.toLowerCase())}
            className="py-6 text-center text-lg"
            disabled={joining}
          />
          <Button
            className="w-full py-6 text-lg"
            onClick={handleJoinSession}
            disabled={!socket || !user || joining || !sessionIdInput.trim()}
          >
            {joining ? 'Uniéndose...' : 'Unirse a la Sesión'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinSessionView;