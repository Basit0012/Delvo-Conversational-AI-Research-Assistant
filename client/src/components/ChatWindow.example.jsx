import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';
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

/**
 * Reference Example: ChatWindow.example.jsx
 * Shows how ChatBubble and ChatInput primitives are composed.
 * (Not wired to real backend or sockets).
 */
export function ChatWindowExample() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am Delvo. How can I assist your research today?',
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you summarize recent breakthroughs in transformer models?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock reply after delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Here is a mock summary of transformer research breakthroughs...',
        },
      ]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 justify-between">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            variant={msg.role === 'user' ? 'sent' : 'received'}
          >
            <ChatBubbleAvatar
              icon={msg.role === 'user' ? User : Sparkles}
              fallback={msg.role === 'user' ? 'U' : 'AI'}
            />
            <ChatBubbleMessage variant={msg.role === 'user' ? 'sent' : 'received'}>
              {msg.content}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}

        {/* Loading Bubble */}
        {isLoading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar icon={Sparkles} fallback="AI" />
            <ChatBubbleMessage isLoading={true} />
          </ChatBubble>
        )}
      </div>

      {/* Input Box */}
      <div className="pt-4">
        <ChatInput onSubmit={handleSubmit}>
          <ChatInputTextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for newline
            </span>
            <ChatInputSubmit loading={isLoading} disabled={!input.trim()} />
          </div>
        </ChatInput>
      </div>
    </div>
  );
}

export default ChatWindowExample;
