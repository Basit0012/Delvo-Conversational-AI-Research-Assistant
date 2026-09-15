import { useState } from 'react';
import { User, Sparkles, Globe, FileText } from 'lucide-react';
import StreamingText from '@/components/ui/streaming-text';

export const MessageBubble = ({ message, onFollowUpClick, onRetry }) => {
  const isUser = message.role === 'user';
  const sources = message.sources || [];
  const hasDocSources = sources.some((s) => s.url?.startsWith('#doc-'));
  const hasWebSources = sources.some((s) => !s.url?.startsWith('#doc-'));

  return (
    <div className={`message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      {/* Avatar */}
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Message Body */}
      <div className="message-content-container">
        {/* Author header / Meta */}
        <div className="message-meta">
          <span className="message-author">{isUser ? 'You' : 'Delvo'}</span>

          {/* Research indicator badges */}
          {!isUser && hasWebSources && (
            <div className="search-badge" title="This response consulted live web search via Tavily">
              <Globe size={13} />
              <span>Searched web</span>
            </div>
          )}

          {!isUser && hasDocSources && (
            <div className="search-badge bg-amber-50 text-amber-700 border-amber-200" title="This response consulted uploaded chat documents">
              <FileText size={13} />
              <span>Referenced documents</span>
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {isUser ? (
            <div className="message-text-user">{message.content}</div>
          ) : (
            <StreamingText
              content={message.content}
              citations={sources}
              followUps={message.followUps || []}
              instant={message.instant ?? true}
              onFollowUpClick={onFollowUpClick}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
