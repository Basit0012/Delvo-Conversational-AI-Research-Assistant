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
} from 'lucide-react';
import StreamingText from '@/components/ui/streaming-text';
import { SearchStatus } from '@/components/ui/search-status';
import { NewsResultCard } from '@/components/ui/news-result-card';
import {
  ChatInput,
  ChatInputTextArea,
  ChatInputSubmit,
} from '@/components/ui/chat-input';

/** Threshold: show N results initially, rest behind Show More */
const INITIAL_RESULTS = 5;

/**
 * MessageItem — renders a single chat turn (user or assistant).
 * For web-search assistant responses, renders structured NewsResultCard list.
 * For direct answers, renders StreamingText prose.
 */
function MessageItem({ msg, onFollowUpClick }) {
  const isUser = msg.role === 'user';
  const sources = msg.sources || [];

  // Web-search results: sources that are external URLs (not doc chunks)
  const webSources = sources.filter((s) => s.url && !s.url.startsWith('#doc-'));
  // Doc sources
  const docSources = sources.filter((s) => s.url?.startsWith('#doc-'));
  const hasWebSources = webSources.length > 0;
  const hasDocSources = docSources.length > 0;

  const [showAll, setShowAll] = useState(false);

  // Displayed results respects Show More state
  const displayedSources = showAll ? webSources : webSources.slice(0, INITIAL_RESULTS);
  const hasMore = webSources.length > INITIAL_RESULTS;

  if (isUser) {
    return (
      <div className="msg-row msg-row--user">
        <div className="msg-user-avatar" aria-hidden="true">
          <User size={14} />
        </div>
        <div className="msg-user-bubble">
          <p className="msg-user-text">{msg.content}</p>
        </div>
      </div>
    );
  }

  // --- Assistant message ---
  return (
    <div className="msg-row msg-row--assistant">
      {/* Avatar */}
      <div className="msg-assistant-avatar" aria-hidden="true">
        <Sparkles size={14} />
      </div>

      <div className="msg-assistant-body">
        {/* Author + search status header */}
        <div className="msg-assistant-header">
          <span className="msg-author-name">Delvo</span>
          {hasWebSources && (
            <SearchStatus count={webSources.length} isSearching={false} />
          )}
          {hasDocSources && !hasWebSources && (
            <span className="msg-doc-badge">
              <FileText size={12} aria-hidden="true" />
              Referenced {docSources.length} document{docSources.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Web search results: structured news cards */}
        {hasWebSources && (
          <div className="news-results-list" role="list" aria-label="Search results">
            {displayedSources.map((source, i) => (
              <div key={source.url || i} role="listitem">
                <NewsResultCard source={source} index={i} />
              </div>
            ))}

            {/* Show more / less */}
            {hasMore && (
              <button
                type="button"
                className="show-more-btn"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
              >
                {showAll
                  ? `Show less`
                  : `Show ${webSources.length - INITIAL_RESULTS} more result${webSources.length - INITIAL_RESULTS !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* AI prose response — always shown (provides analysis/summary above results) */}
        <div className={`msg-prose-body ${hasWebSources ? 'msg-prose-body--with-sources' : ''}`}>
          <StreamingText
            content={msg.content}
            citations={sources}
            followUps={msg.followUps || []}
            instant={msg.instant ?? true}
            onFollowUpClick={onFollowUpClick}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ThinkingIndicator — shown while the AI agent is processing.
 * Uses skeleton pulse, not a distracting spinner.
 */
function ThinkingIndicator({ isSearching }) {
  return (
    <div className="msg-row msg-row--assistant" aria-live="polite" aria-label="Delvo is thinking">
      <div className="msg-assistant-avatar thinking-avatar" aria-hidden="true">
        <Sparkles size={14} />
      </div>
      <div className="msg-assistant-body">
        <div className="msg-assistant-header">
          <span className="msg-author-name">Delvo</span>
          {isSearching && <SearchStatus isSearching count={0} />}
        </div>
        <div className="thinking-skeleton">
          <span className="thinking-dot" />
          <span className="thinking-dot" style={{ animationDelay: '0.15s' }} />
          <span className="thinking-dot" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}
export const ChatWindow = ({ chatId, onChatUpdated }) => {
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!chatId) { setMessages([]); setAttachedFiles([]); return; }
    let isMounted = true;
    const fetchChatData = async () => {
      try {
        setIsLoadingMessages(true); setChatError(null); setIsThinking(false);
        const [chatData, filesData] = await Promise.all([
          api.get(`/api/chats/${chatId}`),
          api.get(`/api/chats/${chatId}/files`).catch(() => ({ files: [] })),
        ]);
        if (isMounted) {
          const historical = (chatData.messages || []).map((m) => ({ ...m, instant: true }));
          setMessages(historical);
          setAttachedFiles(filesData.files || []);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        if (isMounted) { console.error('[ChatWindow]:', err); setChatError(err.message || 'Could not load messages'); }
      } finally { if (isMounted) setIsLoadingMessages(false); }
    };
    fetchChatData();
    return () => { isMounted = false; };
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageReceived = (userMsg) => {
      if (userMsg.chatId === chatId) {
        setMessages((prev) => prev.some((m) => m._id === userMsg._id) ? prev : [...prev, userMsg]);
        scrollToBottom();
      }
    };
    const handleAgentThinking = (data) => {
      if (data.chatId === chatId) { setIsThinking(true); scrollToBottom(); }
    };
    const handleMessageResponse = (payload) => {
      if (payload.chatId === chatId) {
        const liveMessage = { ...payload.message, instant: false };
        setMessages((prev) => prev.some((m) => m._id === liveMessage._id) ? prev : [...prev, liveMessage]);
        setIsThinking(false); scrollToBottom();
        if (typeof onChatUpdated === 'function') onChatUpdated();
      }
    };
    const handleAgentError = (data) => {
      if (data.chatId === chatId) { setIsThinking(false); setChatError(data.error || 'Agent error'); }
    };
    const handleSocketError = (err) => { setIsThinking(false); setChatError(err.error || err.message || 'Socket error'); };
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    e.target.value = '';
    if (file.size > 15 * 1024 * 1024) { setChatError('File exceeds 15MB limit.'); return; }
    try {
      setIsUploadingFile(true);
      setUploadProgressText(`Uploading and indexing "${file.name}"...`);
      setChatError(null);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/api/chats/${chatId}/files`, formData);
      if (response.file) setAttachedFiles((prev) => [response.file, ...prev.filter((f) => f._id !== response.file._id)]);
    } catch (err) {
      console.error('[ChatWindow] File upload:', err);
      setChatError(err.message || 'Failed to upload document.');
    } finally { setIsUploadingFile(false); setUploadProgressText(''); }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/api/chats/${chatId}/files/${fileId}`);
      setAttachedFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error('[ChatWindow] Delete file:', err);
      setChatError(err.message || 'Failed to delete file.');
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const content = inputText.trim();
    if (!content || !chatId || isThinking) return;
    if (!isConnected || !socket) { setChatError('Real-time connection is not active.'); return; }
    setChatError(null); setIsThinking(true);
    socket.emit('message:send', { chatId, content });
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFollowUpClick = (prompt) => {
    setInputText(prompt);
    if (textareaRef.current) textareaRef.current.focus();
  };

  if (!chatId) {
    return (
      <div className="chat-placeholder">
        <div className="placeholder-icon"><Sparkles size={28} /></div>
        <h3>No Conversation Selected</h3>
        <p>Select a chat from the sidebar or click "New Chat" to begin a research session.</p>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      <div className="messages-scroll-area" role="log" aria-label="Conversation">
        {isLoadingMessages ? (
          <div className="messages-loading">
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty-state">
            <div className="empty-sparkle"><Sparkles size={24} /></div>
            <h3>Start Your Research</h3>
            <p>Ask any question or attach documents. Delvo searches the web or your files as needed.</p>
            <div className="starter-prompts">
              <button type="button" className="starter-chip" onClick={() => setInputText('What are the latest breakthroughs in AI agents today?')}>
                &ldquo;What are the latest breakthroughs in AI agents today?&rdquo;
              </button>
              <button type="button" className="starter-chip" onClick={() => setInputText('Explain quantum error correction simply.')}>
                &ldquo;Explain quantum error correction simply.&rdquo;
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-stream">
            {messages.map((msg) => (
              <MessageItem key={msg._id || Math.random()} msg={msg} onFollowUpClick={handleFollowUpClick} />
            ))}
            {isThinking && <ThinkingIndicator isSearching />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {chatError && (
        <div className="chat-error-bar" role="alert">
          <div className="chat-error-content">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{chatError}</span>
          </div>
          <button type="button" className="chat-error-dismiss" onClick={() => setChatError(null)}>Dismiss</button>
        </div>
      )}

      {attachedFiles.length > 0 && (
        <div className="attached-files-bar">
          <span className="attached-files-label">Docs:</span>
          <div className="attached-files-list">
            {attachedFiles.map((file) => (
              <div key={file._id} className="attached-file-chip">
                <FileText size={11} aria-hidden="true" />
                <span className="attached-file-name" title={file.fileName}>{file.fileName}</span>
                {file.status === 'ready' ? (
                  <CheckCircle2 size={11} className="file-status-ready" title="Ready" aria-label="Indexed" />
                ) : file.status === 'processing' ? (
                  <Loader2 size={11} className="file-status-processing animate-spin" title="Indexing..." aria-label="Processing" />
                ) : null}
                <button type="button" onClick={() => handleDeleteFile(file._id)} className="attached-file-remove" aria-label={`Remove ${file.fileName}`}><X size={11} aria-hidden="true" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUploadingFile && (
        <div className="upload-progress-bar" aria-live="polite">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          <span>{uploadProgressText || 'Uploading & embedding document...'}</span>
        </div>
      )}

      <div className="chat-input-wrapper">
        <ChatInput onSubmit={handleSendMessage}>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={handleFileUpload} style={{ display: 'none' }} aria-hidden="true" />
          <ChatInputTextArea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onSubmit={handleSendMessage} placeholder="Ask anything or inquire about your attached documents..." disabled={!isConnected} rows={1} maxRows={6} />
          <div className="chat-input-toolbar">
            <div className="chat-input-toolbar-left">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile || isThinking} title="Attach document" aria-label="Attach document" className="attach-btn">
                <Paperclip size={15} aria-hidden="true" />
              </button>
              <span className="input-hint" aria-hidden="true">Press <kbd>Enter</kbd> to send � <kbd>Shift+Enter</kbd> for newline</span>
            </div>
            <ChatInputSubmit loading={isThinking} disabled={!inputText.trim() || !isConnected} onStop={() => setIsThinking(false)} />
          </div>
        </ChatInput>
      </div>
    </div>
  );
};

export default ChatWindow;
