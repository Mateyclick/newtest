
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface GameSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const GameSocketContext = createContext<GameSocketContextType>({
  socket: null,
  isConnected: false
});

export const useGameSocket = () => useContext(GameSocketContext);

interface GameSocketProviderProps {
  children: React.ReactNode;
}

export const GameSocketProvider = ({ children }: GameSocketProviderProps) => {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const accessToken = session?.access_token;
    const serverURL = import.meta.env.VITE_SOCKET_SERVER_URL || 'localhost:8000';

    if (accessToken) {
      console.log('[GameSocketContext] Connecting with JWT token...');
      const newSocket = io(serverURL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('[GameSocketContext] Connected to game server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('[GameSocketContext] Disconnected from game server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('[GameSocketContext] Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      console.log('[GameSocketContext] No auth token available');
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
    }
  }, [session]);

  return (
    <GameSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </GameSocketContext.Provider>
  );
};
