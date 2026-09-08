import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/useSocket';
import { api } from '../api/client';
import MessageBubble from './MessageBubble';
import { Send, Sparkles, Loader2, AlertCircle, ArrowDown } from 'lucide-react';

export const ChatWindow = ({ chatId, onChatUpdated }) => {
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /**
   * Auto-scroll to the bottom of the conversation
   */
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  /**
   * Load chronological message history for active chat
   */
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      try {
        setIsLoadingMessages(true);
        setChatError(null);
        setIsThinking(false);

        const data = await api.get(`/api/chats/${chatId}`);
        if (isMounted) {
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ChatWindow]: Failed to fetch message history:', err);
          setChatError(err.message || 'Could not load messages');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [chatId, scrollToBottom]);

  /**
   * Socket.IO Event Listeners for real-time messaging lifecycle
   */
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (userMsg) => {
      if (userMsg.chatId === chatId) {
        setMessages((prev) => {
          // Avoid duplicate user message if already present
          if (prev.some((m) => m._id === userMsg._id)) return prev;
          return [...prev, userMsg];
        });
        scrollToBottom();
      }
    };

    const handleAgentThinking = (data) => {
      if (data.chatId === chatId) {
        setIsThinking(true);
        scrollToBottom();
      }
    };

    const handleMessageResponse = (payload) => {
      if (payload.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === payload.message._id)) return prev;
          return [...prev, payload.message];
        });
        setIsThinking(false);
        scrollToBottom();
        if (typeof onChatUpdated === 'function') {
          onChatUpdated();
        }
      }
    };

    const handleAgentError = (data) => {
      if (data.chatId === chatId) {
        setIsThinking(false);
        setChatError(data.error || 'Agent encountered an error while responding');
      }
    };

    const handleSocketError = (err) => {
      setIsThinking(false);
      setChatError(err.error || err.message || 'Socket error occurred');
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('agent:thinking', handleAgentThinking);
    socket.on('message:response', handleMessageResponse);
    socket.on('agent:error', handleAgentError);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('agent:thinking', handleAgentThinking);
      socket.off('message:response', handleMessageResponse);
      socket.off('agent:error', handleAgentError);
      socket.off('error', handleSocketError);
    };
  }, [socket, chatId, scrollToBottom, onChatUpdated]);

  /**
   * Handle sending message over Socket.IO
   */
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const content = inputText.trim();

    if (!content || !chatId || isThinking) return;

    if (!isConnected || !socket) {
      setChatError('Cannot send message: Real-time connection is not active.');
      return;
    }

    setChatError(null);
    setIsThinking(true);

    // Emit message to backend Socket.IO handler
    socket.emit('message:send', {
      chatId,
      content,
    });

    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle Enter key press (Shift+Enter for newline)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Auto-expand textarea height as user types
   */
  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  if (!chatId) {
    return (
      <div className="chat-placeholder">
        <div className="placeholder-icon">
          <Sparkles size={32} />
        </div>
        <h3>No Conversation Selected</h3>
        <p>Select a chat from the sidebar or click "New Chat" to begin a research session.</p>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      {/* Messages List Area */}
      <div className="messages-scroll-area">
        {isLoadingMessages ? (
          <div className="messages-loading">
            <Loader2 size={24} className="spinner" />
            <span>Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty-state">
            <div className="empty-sparkle">
              <Sparkles size={28} />
            </div>
            <h3>Start Your Research</h3>
            <p>
              Ask any question. Delvo will automatically decide whether to answer directly
              or search the live web using Tavily.
            </p>

            <div className="starter-prompts">
              <button
                className="starter-chip"
                onClick={() => {
                  setInputText('What are the latest breakthroughs in AI agents today?');
                }}
              >
                "What are the latest breakthroughs in AI agents today?"
              </button>
              <button
                className="starter-chip"
                onClick={() => {
                  setInputText('Explain quantum error correction simply.');
                }}
              >
                "Explain quantum error correction simply."
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-stream">
            {messages.map((msg) => (
              <MessageBubble key={msg._id || Math.random()} message={msg} />
            ))}

            {/* Agent Thinking Indicator */}
            {isThinking && (
              <div className="thinking-row">
                <div className="thinking-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="thinking-bubble">
                  <div className="thinking-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="thinking-text">Delvo is thinking & researching...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error notification banner */}
      {chatError && (
        <div className="chat-error-bar">
          <AlertCircle size={16} />
          <span>{chatError}</span>
          <button onClick={() => setChatError(null)} className="error-close-btn">
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Input Section */}
      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask anything (e.g. current events, research topics, code)..."
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={!isConnected}
          />

          <button
            type="submit"
            className="btn-send"
            disabled={!inputText.trim() || isThinking || !isConnected}
            title={!isConnected ? 'Connecting to real-time server...' : 'Send message (Enter)'}
          >
            {isThinking ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>

        <div className="input-footnote">
          Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for newline
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
