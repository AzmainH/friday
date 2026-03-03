import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-surface-100 text-text-secondary dark:bg-surface-200 dark:text-text-primary',
  success:
    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error:
    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info:
    'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const dotColorStyles: Record<BadgeVariant, string> = {
  default: 'bg-text-secondary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium gap-1.5',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full', dotColorStyles[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
