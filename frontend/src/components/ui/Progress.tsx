import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type ProgressSize = 'sm' | 'md';
export type ProgressColor = 'primary' | 'success' | 'warning' | 'error';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: ProgressSize;
  color?: ProgressColor;
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

const barColorStyles: Record<ProgressColor, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, size = 'md', color = 'primary', className, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'w-full bg-surface-200 rounded-full overflow-hidden',
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            barColorStyles[color],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';
