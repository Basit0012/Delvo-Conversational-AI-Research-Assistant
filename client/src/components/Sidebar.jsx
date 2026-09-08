import { MessageSquare, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';

export const Sidebar = ({
  chats = [],
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading = false,
}) => {
  return (
    <aside className="sidebar-container">
      {/* Sidebar Header with Brand & New Chat */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Sparkles size={18} />
          </div>
          <span className="sidebar-title">Delvo Research</span>
        </div>

        <button
          className="btn-new-chat"
          onClick={onNewChat}
          title="Start a new chat session"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List Section */}
      <div className="sidebar-chat-list-wrapper">
        <div className="sidebar-section-label">Recent Conversations</div>

        {isLoading ? (
          <div className="sidebar-loading">
            <Loader2 size={20} className="spinner" />
            <span>Loading conversations...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="sidebar-empty">
            <MessageSquare size={28} />
            <p>No conversations yet</p>
            <span>Click New Chat to begin research</span>
          </div>
        ) : (
          <div className="sidebar-chat-list">
            {chats.map((chat) => {
              const isActive = activeChatId === chat._id;
              return (
                <div
                  key={chat._id}
                  className={`sidebar-chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectChat(chat._id);
                    }
                  }}
                >
                  <MessageSquare
                    size={16}
                    className="chat-item-icon"
                  />

                  <span className="chat-item-title" title={chat.title}>
                    {chat.title || 'Untitled Session'}
                  </span>

                  {onDeleteChat && (
                    <button
                      className="chat-item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat._id);
                      }}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <span>Mistral AI + Tavily Web Search</span>
      </div>
    </aside>
  );
};

export default Sidebar;
