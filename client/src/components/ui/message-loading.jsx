import React from 'react';
import { cn } from '@/lib/utils';

export function MessageLoading({ className }) {
  return (
    <div className={cn('flex items-center gap-1.5 py-1 px-1 text-muted-foreground', className)}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-current opacity-70 animate-bounce" />
    </div>
  );
}

export default MessageLoading;
