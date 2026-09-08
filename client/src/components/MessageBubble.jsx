import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Globe, ExternalLink, User, Sparkles, Copy, Check } from 'lucide-react';

export const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sources = message.sources || [];
  const visibleSources = showAllSources ? sources : sources.slice(0, 3);

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

          {/* Web search indicator badge */}
          {!isUser && message.usedSearch && (
            <div className="search-badge" title="This response consulted live web search via Tavily">
              <Globe size={13} />
              <span>Searched the web</span>
            </div>
          )}

          {!isUser && (
            <button
              className="btn-copy"
              onClick={handleCopy}
              title={copied ? 'Copied to clipboard' : 'Copy message'}
              aria-label="Copy message"
            >
              {copied ? <Check size={13} className="copy-success-icon" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* Message Bubble */}
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {isUser ? (
            <div className="message-text-user">{message.content}</div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Web Search Sources / Citations */}
        {!isUser && sources.length > 0 && (
          <div className="sources-container">
            <div className="sources-header">
              <Globe size={13} className="sources-globe-icon" />
              <span>Sources ({sources.length})</span>
            </div>

            <div className="sources-grid">
              {visibleSources.map((source, idx) => {
                let domain = '';
                try {
                  domain = new URL(source.url).hostname.replace('www.', '');
                } catch {
                  domain = source.url || 'web';
                }

                return (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-card"
                    title={source.snippet || source.title}
                  >
                    <div className="source-index">{idx + 1}</div>
                    <div className="source-info">
                      <div className="source-title">{source.title || 'Untitled Source'}</div>
                      <div className="source-domain">
                        <span>{domain}</span>
                        <ExternalLink size={11} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {sources.length > 3 && (
              <button
                className="sources-toggle-btn"
                onClick={() => setShowAllSources(!showAllSources)}
              >
                {showAllSources ? 'Show fewer sources' : `+${sources.length - 3} more sources`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
