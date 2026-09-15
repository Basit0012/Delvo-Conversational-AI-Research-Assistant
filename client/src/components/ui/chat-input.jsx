import * as React from 'react';
import { ArrowUp, CornerDownLeft, Loader2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useTextareaResize } from '@/hooks/use-textarea-resize';

const ChatInputContext = React.createContext({});

export const ChatInput = React.forwardRef(
  ({ className, onSubmit, children, ...props }, ref) => {
    const handleFormSubmit = (e) => {
      e.preventDefault();
      if (onSubmit) onSubmit(e);
    };

    return (
      <ChatInputContext.Provider value={{ onSubmit }}>
        <form
          ref={ref}
          onSubmit={handleFormSubmit}
          className={cn(
            'relative flex flex-col w-full rounded-xl border border-input bg-background/80 backdrop-blur-xs p-2 shadow-xs transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
            className
          )}
          {...props}
        >
          {children}
        </form>
      </ChatInputContext.Provider>
    );
  }
);
ChatInput.displayName = 'ChatInput';

export const ChatInputTextArea = React.forwardRef(
  (
    {
      className,
      value,
      onChange,
      onKeyDown,
      onSubmit,
      placeholder = 'Type a message...',
      disabled = false,
      rows = 1,
      maxRows = 6,
      ...props
    },
    ref
  ) => {
    const internalRef = useTextareaResize(value, rows, maxRows);
    const resolvedRef = ref || internalRef;
    const context = React.useContext(ChatInputContext);

    const handleKeyDown = (e) => {
      if (onKeyDown) {
        onKeyDown(e);
        if (e.defaultPrevented) return;
      }

      // Enter submits, Shift+Enter adds newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const submitFn = onSubmit || context.onSubmit;
        if (submitFn) submitFn(e);
      }
    };

    return (
      <textarea
        ref={resolvedRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full resize-none border-0 bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
ChatInputTextArea.displayName = 'ChatInputTextArea';

export const ChatInputSubmit = React.forwardRef(
  (
    {
      className,
      loading = false,
      disabled = false,
      onStop,
      type = 'submit',
      size = 'icon-sm',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    if (loading && onStop) {
      return (
        <Button
          ref={ref}
          type="button"
          size={size}
          variant="secondary"
          onClick={onStop}
          className={cn('rounded-lg shrink-0', className)}
          title="Stop generating"
          {...props}
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        type={type}
        size={size}
        variant={variant}
        disabled={disabled || loading}
        className={cn('rounded-lg shrink-0', className)}
        title="Send message"
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )}
      </Button>
    );
  }
);
ChatInputSubmit.displayName = 'ChatInputSubmit';

export default ChatInput;
