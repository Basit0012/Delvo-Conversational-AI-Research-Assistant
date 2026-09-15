import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { MessageLoading } from './message-loading';

const chatBubbleVariants = cva('flex gap-2.5 max-w-[85%] items-start group relative mb-4', {
  variants: {
    variant: {
      sent: 'flex-row-reverse ml-auto items-end',
      received: 'flex-row mr-auto items-start',
    },
    layout: {
      default: '',
      compact: 'gap-1.5 mb-2',
    },
  },
  defaultVariants: {
    variant: 'received',
    layout: 'default',
  },
});

const ChatBubbleContext = React.createContext({
  variant: 'received',
});

export const ChatBubble = React.forwardRef(
  ({ className, variant = 'received', layout = 'default', children, ...props }, ref) => {
    return (
      <ChatBubbleContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn(chatBubbleVariants({ variant, layout }), className)}
          {...props}
        >
          {children}
        </div>
      </ChatBubbleContext.Provider>
    );
  }
);
ChatBubble.displayName = 'ChatBubble';

export const ChatBubbleAvatar = React.forwardRef(
  ({ className, src, fallback = 'AI', icon: Icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold shadow-xs',
          'border border-border/40 bg-muted text-muted-foreground',
          className
        )}
        {...props}
      >
        {Icon ? (
          <Icon className="h-4 w-4" />
        ) : src ? (
          <img src={src} alt="Avatar" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span>{fallback}</span>
        )}
      </div>
    );
  }
);
ChatBubbleAvatar.displayName = 'ChatBubbleAvatar';

const chatBubbleMessageVariants = cva(
  'p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words transition-colors shadow-xs',
  {
    variants: {
      variant: {
        sent: 'bg-[var(--color-primary,#0075DE)] text-white rounded-br-xs selection:bg-white/30 selection:text-white',
        received: 'bg-[var(--color-surface,#ffffff)] dark:bg-[#18181b] text-foreground border border-[var(--color-border,#e0e2e5)] dark:border-[#27272a] rounded-bl-xs',
      },
    },
    defaultVariants: {
      variant: 'received',
    },
  }
);

export const ChatBubbleMessage = React.forwardRef(
  ({ className, variant: propVariant, isLoading = false, children, ...props }, ref) => {
    const context = React.useContext(ChatBubbleContext);
    const variant = propVariant || context.variant || 'received';

    return (
      <div
        ref={ref}
        className={cn(chatBubbleMessageVariants({ variant }), className)}
        {...props}
      >
        {isLoading ? <MessageLoading /> : children}
      </div>
    );
  }
);
ChatBubbleMessage.displayName = 'ChatBubbleMessage';

export const ChatBubbleAction = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1', className)}
      {...props}
    >
      {children}
    </div>
  );
});
ChatBubbleAction.displayName = 'ChatBubbleAction';

export default ChatBubble;
