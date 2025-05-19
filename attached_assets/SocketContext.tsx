import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determinar la URL del servidor de Socket.IO
    // Para desarrollo local, usa localhost.
    // Para producción (cuando NODE_ENV es 'production'), usa tu URL de Render.
    // Vite configura process.env.NODE_ENV automáticamente: 'development' para `npm run dev` y 'production' para `npm run build`.
    const serverURL = process.env.NODE_ENV === 'production'
      ? 'https://trebejos.onrender.com' // Tu URL de producción en Render
      : '';       // Tu URL de desarrollo local

    console.log(`[SocketContext] Attempting to connect to Socket.IO server at: ${serverURL}`);

    const newSocket = io(serverURL, {
      autoConnect: true, // Intenta conectar automáticamente al crear
      reconnection: true, // Habilitar reconexión automática
      // Opcional: podrías añadir transports: ['websocket'] si tienes problemas con polling,
      // especialmente al conectar a un servidor desplegado.
      // transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log(`[SocketContext] Socket connected successfully to: ${serverURL}`);
      console.log('[SocketContext] Socket ID:', newSocket.id); // Útil para depuración
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`[SocketContext] Socket disconnected from ${serverURL}:`, reason);
      setIsConnected(false);
      // Si la desconexión fue iniciada por el servidor, podrías querer que intente reconectar.
      // if (reason === 'io server disconnect') {
      //   newSocket.connect();
      // }
    });

    newSocket.on('connect_error', (err) => {
      console.error('[SocketContext] Socket connection error:', err.message);
      // Loguear más detalles del objeto de error puede ser útil:
      // console.error('[SocketContext] Full error object:', err);
      // err puede tener propiedades como err.type, err.description, err.context
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Limpieza al desmontar el componente
    return () => {
      if (newSocket.connected) {
        console.log('[SocketContext] Disconnecting socket on component unmount...');
        newSocket.disconnect();
      } else {
        // Si nunca se conectó, o ya está desconectado, solo quita listeners para evitar leaks.
        console.log('[SocketContext] Socket was not connected or already disconnected, removing listeners on unmount...');
        newSocket.removeAllListeners();
      }
    };
  }, []); // El array de dependencias vacío asegura que esto se ejecute solo una vez (al montar/desmontar)

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};