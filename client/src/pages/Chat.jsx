import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useSocket } from '../context/useSocket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { api } from '../api/client';
import { Sparkles, LogOut, MessageSquare } from 'lucide-react';

export const Chat = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatError, setChatError] = useState(null);

  /**
   * Fetch all chats for the user
   */
  const loadChats = useCallback(async () => {
    try {
      setIsLoadingChats(true);
      setChatError(null);
      const data = await api.get('/api/chats');
      const loadedChats = data.chats || [];
      setChats(loadedChats);

      // Default select the most recent chat if available and none currently selected
      if (loadedChats.length > 0 && !activeChatId) {
        setActiveChatId(loadedChats[0]._id);
      }
    } catch (err) {
      console.error('[ChatPage]: Failed to fetch chats:', err);
      setChatError(err.message);
    } finally {
      setIsLoadingChats(false);
    }
  }, [activeChatId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /**
   * Create a new chat session
   */
  const handleNewChat = async () => {
    try {
      const data = await api.post('/api/chats', { title: 'New Research Chat' });
      const newChat = data.chat;
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat._id);
    } catch (err) {
      console.error('[ChatPage]: Failed to create new chat:', err);
      alert('Could not start a new chat: ' + err.message);
    }
  };

  /**
   * Delete a chat session
   */
  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/api/chats/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));

      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c._id !== chatId);
        setActiveChatId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      console.error('[ChatPage]: Failed to delete chat:', err);
      alert('Failed to delete chat: ' + err.message);
    }
  };

  const activeChat = chats.find((c) => c._id === activeChatId);

  return (
    <div className="app-layout">
      {/* 1. Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isLoading={isLoadingChats}
      />

      {/* 2. Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-title-section">
            <MessageSquare size={18} className="topbar-icon" />
            <h2 className="topbar-title">
              {activeChat ? activeChat.title : 'Delvo Research Assistant'}
            </h2>
          </div>

          <div className="topbar-actions">
            {/* Real-time Socket Indicator */}
            <div className={`status-pill ${isConnected ? 'connected' : 'connecting'}`}>
              <span className="status-dot" />
              <span className="status-text">
                {isConnected ? 'Real-time active' : 'Connecting...'}
              </span>
            </div>

            <span className="topbar-user">
              <strong>{user?.username}</strong>
            </span>

            <button onClick={logout} className="btn-signout" title="Sign out of Delvo">
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Chat Window */}
        <ChatWindow chatId={activeChatId} onChatUpdated={loadChats} />
      </div>
    </div>
  );
};

export default Chat;
