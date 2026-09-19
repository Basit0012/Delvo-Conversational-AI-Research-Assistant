import React, { useState, useMemo } from 'react';
import {
  Search,
  PanelLeft,
  Plus,
  ChevronDown,
  Folder,
  Bell,
  Trash2,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/useAuth';

// ---- Custom Icons Matching Visual Reference ----

/**
 * Geometric Asterism logo mark (Anthropic / Delvo brand symbol)
 */
function BrandAsterismIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Computer / Bot screen icon from screenshot
 */
function ComputerIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <line x1="8" y1="12" x2="10" y2="12" strokeWidth="2.5" />
      <line x1="14" y1="12" x2="16" y2="12" strokeWidth="2.5" />
    </svg>
  );
}

/**
 * Artifacts split pane icon from screenshot
 */
function ArtifactsIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

/**
 * Customize / Hexagon settings icon from screenshot
 */
function CustomizeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.5l7.5 4.33v8.67L12 21.5l-7.5-4.33V6.83L12 2.5z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ---- Default Nav Items (from screenshot & code) ----

const DEFAULT_NAV_ITEMS = [
  { label: 'Computer', icon: ComputerIcon },
  { label: 'Artifacts', icon: ArtifactsIcon },
  { label: 'Customize', icon: CustomizeIcon },
];

// ---- Sub-components ----

function CollapsibleSection({
  label,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1 text-xs font-medium tracking-wide text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-150 text-neutral-400',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function NavRow({ icon: Icon, label, onClick, isActive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
        isActive
          ? 'bg-white/10 text-white font-medium'
          : 'text-neutral-300 hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
      <span className="truncate">{label}</span>
    </button>
  );
}

// ---- Main Component ----

export function Sidebar({
  brandName = 'Delvo Research',
  navItems = DEFAULT_NAV_ITEMS,
  sessions,
  chats = [],
  activeChatId = null,
  userName,
  userPlan = 'Free plan',
  userAvatarUrl,
  onNewChat,
  onSelectChat,
  onSelectSession,
  onDeleteChat,
  isLoading = false,
  className = '',
}) {
  const auth = useAuth();
  const currentUser = auth?.user;
  const logout = auth?.logout;

  // Derive active sessions list from either `sessions` prop or `chats` prop
  const sessionList = useMemo(() => {
    if (sessions && Array.isArray(sessions)) {
      return sessions;
    }
    return (chats || []).map((chat) => ({
      id: chat._id || chat.id,
      title: chat.title || 'Untitled Session',
    }));
  }, [sessions, chats]);

  // Search filter state for sessions
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessionList;
    return sessionList.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessionList, searchQuery]);

  // Select session handler
  const handleSelect = (id) => {
    if (onSelectSession) onSelectSession(id);
    if (onSelectChat) onSelectChat(id);
  };

  const displayName = userName || currentUser?.username || 'Abdul Basit';

  return (
    <aside
      className={cn(
        'flex h-screen w-[260px] min-w-[260px] max-w-[260px] flex-col bg-[#121212] text-white border-r border-white/10 shrink-0 select-none font-sans',
        className
      )}
    >
      {/* Top bar: Brand logo, Search toggle, PanelLeft toggle */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-300 hover:text-white transition-colors">
            <BrandAsterismIcon className="h-5 w-5" />
          </span>
          <span className="truncate text-sm font-semibold text-neutral-200">
            {brandName}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearching((prev) => !prev)}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              isSearching
                ? 'bg-white/10 text-white'
                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            )}
            title="Search sessions"
            aria-label="Search sessions"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Bar (expandable) */}
      {isSearching && (
        <div className="px-3 pt-1 pb-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              autoFocus
              className="w-full rounded-md bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/25 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* New chat button with shortcut badge */}
      <div className="px-3 pt-1">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-between rounded-lg bg-white/5 border border-white/5 px-3 py-2 text-[13px] font-medium text-white hover:bg-white/10 hover:border-white/10 transition-all shadow-sm"
          title="New Chat"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-neutral-300" />
            <span>New</span>
          </span>
          <span className="text-[11px] text-neutral-500 font-mono tracking-tight flex items-center gap-0.5">
            <span>^</span>
            <span>|</span>
          </span>
        </button>
      </div>

      {/* Primary nav items (Computer, Artifacts, Customize) */}
      <div className="px-1 pt-3 space-y-0.5">
        {navItems.map((item) => (
          <NavRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeNav === item.label}
            onClick={() => setActiveNav(item.label)}
          />
        ))}
      </div>

      {/* Scrollable middle section: Projects & Sessions */}
      <div className="flex-1 overflow-y-auto px-1">
        {/* Projects Section */}
        <CollapsibleSection label="Projects">
          <NavRow
            icon={Folder}
            label="New Space"
            onClick={() => onNewChat && onNewChat()}
          />
        </CollapsibleSection>

        {/* Sessions Section */}
        <CollapsibleSection label="Sessions" defaultOpen={true}>
          <div className="space-y-0.5">
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-neutral-500 text-center animate-pulse">
                Loading sessions…
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-500">
                {searchQuery ? 'No matching sessions' : 'No sessions yet'}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = activeChatId === session.id;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative flex items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors cursor-pointer',
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    )}
                    onClick={() => handleSelect(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelect(session.id);
                      }
                    }}
                  >
                    <span className="truncate flex-1 pr-1" title={session.title}>
                      {session.title}
                    </span>

                    {/* Delete button appears on hover */}
                    {onDeleteChat && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded transition-opacity shrink-0"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Upgrade plan pill button */}
      <div className="px-3 pb-2 pt-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 py-1.5 text-center text-[13px] text-neutral-300 hover:bg-white/5 hover:text-white hover:border-white/25 transition-all"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-400 text-[9px] font-bold">
            ↑
          </span>
          <span>Upgrade plan</span>
        </button>
      </div>

      {/* User footer with Profile, Plan, Notifications & Menu */}
      <div className="relative border-t border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-700 hover:ring-2 hover:ring-white/20 transition-all text-left"
            title="Account options"
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-amber-700 to-amber-500 text-xs font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* User info */}
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            <p className="truncate text-[13px] font-medium leading-tight text-white">
              {displayName}
            </p>
            <p className="truncate text-xs leading-tight text-neutral-400">
              {userPlan}
            </p>
          </div>

          {/* Notification bell */}
          <button
            type="button"
            className="relative shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
          </button>
        </div>

        {/* User Popup Menu (Sign Out) */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg bg-[#1e1e1e] border border-white/10 p-1 shadow-xl z-50">
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-xs font-medium text-white truncate">{displayName}</p>
              <p className="text-[11px] text-neutral-400 truncate">
                {currentUser?.email || 'Logged in'}
              </p>
            </div>
            {logout && (
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors mt-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
