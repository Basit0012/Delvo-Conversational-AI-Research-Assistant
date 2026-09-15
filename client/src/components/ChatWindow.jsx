import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/useSocket';
import { api } from '../api/client';
import {
  Sparkles,
  AlertCircle,
  Paperclip,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  User,
  Globe,
} from 'lucide-react';
import StreamingText from '@/components/ui/streaming-text';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat-bubble';
import {
  ChatInput,
  ChatInputTextArea,
  ChatInputSubmit,
} from '@/components/ui/chat-input';

export const ChatWindow = ({ chatId, onChatUpdated }) => {
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);

  // File Upload (RAG) States
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Auto-scroll to the bottom of the conversation
   */
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  /**
   * Load chronological message history and attached files for active chat
   */
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setAttachedFiles([]);
      return;
    }

    let isMounted = true;

    const fetchChatData = async () => {
      try {
        setIsLoadingMessages(true);
        setChatError(null);
        setIsThinking(false);

        // Fetch messages and files in parallel
        const [chatData, filesData] = await Promise.all([
          api.get(`/api/chats/${chatId}`),
          api.get(`/api/chats/${chatId}/files`).catch(() => ({ files: [] })),
        ]);

        if (isMounted) {
          const historical = (chatData.messages || []).map((m) => ({
            ...m,
            instant: true, // Past messages skip reveal animation
          }));
          setMessages(historical);
          setAttachedFiles(filesData.files || []);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ChatWindow]: Failed to fetch chat data:', err);
          setChatError(err.message || 'Could not load messages');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchChatData();

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
        const liveMessage = {
          ...payload.message,
          instant: false, // Stream in live with animation!
        };

        setMessages((prev) => {
          if (prev.some((m) => m._id === liveMessage._id)) return prev;
          return [...prev, liveMessage];
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
   * Handle File Upload for RAG analysis
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    // Reset native input so the same file can be re-selected if needed
    e.target.value = '';

    if (file.size > 15 * 1024 * 1024) {
      setChatError('File exceeds 15MB limit. Please upload a smaller document.');
      return;
    }

    try {
      setIsUploadingFile(true);
      setUploadProgressText(`Uploading and vector-indexing "${file.name}"...`);
      setChatError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/chats/${chatId}/files`, formData);

      if (response.file) {
        setAttachedFiles((prev) => [response.file, ...prev.filter((f) => f._id !== response.file._id)]);
      }
    } catch (err) {
      console.error('[ChatWindow]: File upload failed:', err);
      setChatError(err.message || 'Failed to upload and index document.');
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText('');
    }
  };

  /**
   * Handle deleting an attached document
   */
  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/api/chats/${chatId}/files/${fileId}`);
      setAttachedFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error('[ChatWindow]: Failed to delete file:', err);
      setChatError(err.message || 'Failed to delete file.');
    }
  };

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

    socket.emit('message:send', {
      chatId,
      content,
    });

    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFollowUpClick = (prompt) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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
    <div className="chat-window-container flex flex-col h-full justify-between">
      {/* Messages List Area */}
      <div className="messages-scroll-area flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoadingMessages ? (
          <div className="messages-loading flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span>Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty-state max-w-xl mx-auto py-12 text-center">
            <div className="empty-sparkle mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Start Your Research</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Ask any question or attach documents (PDF, DOCX, TXT, MD). Delvo automatically decides whether
              to answer directly, search the live web, or search your attached files.
            </p>

            <div className="starter-prompts flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                className="starter-chip text-left text-xs p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent transition-colors"
                onClick={() => {
                  setInputText('What are the latest breakthroughs in AI agents today?');
                }}
              >
                &ldquo;What are the latest breakthroughs in AI agents today?&rdquo;
              </button>
              <button
                className="starter-chip text-left text-xs p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent transition-colors"
                onClick={() => {
                  setInputText('Explain quantum error correction simply.');
                }}
              >
                &ldquo;Explain quantum error correction simply.&rdquo;
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-stream max-w-3xl mx-auto w-full space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const sources = msg.sources || [];
              const hasDocSources = sources.some((s) => s.url?.startsWith('#doc-'));
              const hasWebSources = sources.some((s) => !s.url?.startsWith('#doc-'));

              return (
                <ChatBubble
                  key={msg._id || Math.random()}
                  variant={isUser ? 'sent' : 'received'}
                >
                  <ChatBubbleAvatar
                    icon={isUser ? User : Sparkles}
                    fallback={isUser ? 'U' : 'AI'}
                    className={
                      isUser
                        ? 'bg-[var(--color-primary,#0075DE)] text-white'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }
                  />

                  <div className="flex flex-col gap-1 max-w-[calc(100%-40px)]">
                    {/* Meta info & badges */}
                    <div
                      className={`flex items-center gap-2 text-xs text-muted-foreground ${
                        isUser ? 'justify-end pr-1' : 'pl-1'
                      }`}
                    >
                      <span className="font-semibold text-foreground/80">
                        {isUser ? 'You' : 'Delvo'}
                      </span>

                      {!isUser && hasWebSources && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          title="This response consulted live web search via Tavily"
                        >
                          <Globe size={11} />
                          <span>Searched web</span>
                        </div>
                      )}

                      {!isUser && hasDocSources && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          title="This response consulted uploaded chat documents"
                        >
                          <FileText size={11} />
                          <span>Referenced documents</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Bubble Body */}
                    <ChatBubbleMessage variant={isUser ? 'sent' : 'received'}>
                      {isUser ? (
                        <div className="text-sm font-normal">{msg.content}</div>
                      ) : (
                        <StreamingText
                          content={msg.content}
                          citations={sources}
                          followUps={msg.followUps || []}
                          instant={msg.instant ?? true}
                          onFollowUpClick={handleFollowUpClick}
                        />
                      )}
                    </ChatBubbleMessage>
                  </div>
                </ChatBubble>
              );
            })}

            {/* Agent Thinking Indicator using ChatBubble & MessageLoading */}
            {isThinking && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  icon={Sparkles}
                  fallback="AI"
                  className="bg-primary/10 text-primary border-primary/20 animate-pulse"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                    <span className="font-semibold text-foreground/80">Delvo</span>
                    <span className="text-[11px] text-muted-foreground italic">
                      researching & synthesizing...
                    </span>
                  </div>
                  <ChatBubbleMessage variant="received" isLoading={true} />
                </div>
              </ChatBubble>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error notification banner */}
      {chatError && (
        <div className="chat-error-bar max-w-3xl mx-auto w-full px-4 py-2 my-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{chatError}</span>
          </div>
          <button
            onClick={() => setChatError(null)}
            className="text-xs font-semibold underline hover:no-underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Attached Files Chips Bar */}
      {attachedFiles.length > 0 && (
        <div className="max-w-3xl mx-auto w-full px-4 py-2 border-t border-border bg-muted/40 flex items-center gap-2 overflow-x-auto rounded-t-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Attached Docs:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {attachedFiles.map((file) => (
              <div
                key={file._id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                  bg-card border border-border text-foreground shadow-2xs hover:border-border/80 transition-colors"
              >
                <FileText size={12} className="text-primary" />
                <span className="font-medium max-w-[150px] truncate" title={file.fileName}>
                  {file.fileName}
                </span>
                {file.status === 'ready' ? (
                  <CheckCircle2 size={12} className="text-green-500" title="Ready for RAG search" />
                ) : file.status === 'processing' ? (
                  <Loader2 size={12} className="text-amber-500 animate-spin" title="Indexing..." />
                ) : null}
                <button
                  type="button"
                  onClick={() => handleDeleteFile(file._id)}
                  title="Remove document"
                  className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploading progress indicator */}
      {isUploadingFile && (
        <div className="max-w-3xl mx-auto w-full px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center gap-2 text-xs text-primary animate-pulse">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span>{uploadProgressText || 'Uploading & embedding document...'}</span>
        </div>
      )}

      {/* Chat Input Section */}
      <div className="chat-input-wrapper max-w-3xl mx-auto w-full p-4 pt-1">
        <ChatInput onSubmit={handleSendMessage} className="bg-card border-border shadow-xs">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <ChatInputTextArea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onSubmit={handleSendMessage}
            placeholder="Ask anything or inquire about your attached documents..."
            disabled={!isConnected}
            rows={1}
            maxRows={6}
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-border/30 mt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile || isThinking}
                title="Attach document (.pdf, .docx, .txt, .md) for RAG analysis"
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded-md hover:bg-muted cursor-pointer"
              >
                <Paperclip size={16} />
              </button>
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
                Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> to send,{' '}
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Shift+Enter</kbd> for newline
              </span>
            </div>

            <ChatInputSubmit
              loading={isThinking}
              disabled={!inputText.trim() || !isConnected}
              onStop={() => setIsThinking(false)}
            />
          </div>
        </ChatInput>
      </div>
    </div>
  );
};

export default ChatWindow;
