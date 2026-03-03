import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: DividerOrientation;
  label?: string;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', label, className, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn('w-px bg-surface-200 h-full', className)}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn('flex items-center gap-3 w-full', className)}
          {...props}
        >
          <div className="flex-1 h-px bg-surface-200" />
          <span className="text-xs text-text-tertiary font-medium shrink-0 select-none">
            {label}
          </span>
          <div className="flex-1 h-px bg-surface-200" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn('h-px bg-surface-200 w-full', className)}
        {...props}
      />
    );
  },
);

Divider.displayName = 'Divider';
