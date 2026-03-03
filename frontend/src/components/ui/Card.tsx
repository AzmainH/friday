import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = true, hover = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-surface-100',
          'rounded-[--radius-lg] shadow-xs',
          'border border-surface-200/80 dark:border-surface-200',
          padding && 'p-6',
          hover && 'hover:shadow-md hover:-translate-y-px transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
