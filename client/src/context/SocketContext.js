import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (token && user) {
      const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      socket.on('users:online', (userIds) => {
        setOnlineUsers(userIds);
      });

      socket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      socket.on('user:offline', ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setConnected(false);
      };
    }
  }, [token, user]);

  const sendMessage = (receiverId, content) => {
    socketRef.current?.emit('message:send', { receiverId, content });
  };

  const startTyping = (receiverId) => {
    socketRef.current?.emit('typing:start', { receiverId });
  };

  const stopTyping = (receiverId) => {
    socketRef.current?.emit('typing:stop', { receiverId });
  };

  const markAsRead = (senderId) => {
    socketRef.current?.emit('messages:read', { senderId });
  };

  const onMessage = (handler) => {
    socketRef.current?.on('message:new', handler);
    return () => socketRef.current?.off('message:new', handler);
  };

  const onTypingStart = (handler) => {
    socketRef.current?.on('typing:start', handler);
    return () => socketRef.current?.off('typing:start', handler);
  };

  const onTypingStop = (handler) => {
    socketRef.current?.on('typing:stop', handler);
    return () => socketRef.current?.off('typing:stop', handler);
  };

  const onMessagesRead = (handler) => {
    socketRef.current?.on('messages:read', handler);
    return () => socketRef.current?.off('messages:read', handler);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      onlineUsers,
      sendMessage,
      startTyping,
      stopTyping,
      markAsRead,
      onMessage,
      onTypingStart,
      onTypingStop,
      onMessagesRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
