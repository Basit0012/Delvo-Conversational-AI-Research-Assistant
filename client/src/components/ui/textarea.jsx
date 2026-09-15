import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
