import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Only establish a socket connection if user is authenticated with a token
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
      }
      return;
    }

    const socketUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5000';

    console.log('[SocketContext]: Initializing connection to', socketUrl);

    // Initialize socket matching backend's expected handshake.auth.token
    const newSocket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log(`[SocketContext]: Connected successfully (${newSocket.id})`);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[SocketContext]: Connection error:', err.message);
      setIsConnected(false);
      setConnectionError(err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[SocketContext]: Disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log('[SocketContext]: Cleaning up connection');
      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
