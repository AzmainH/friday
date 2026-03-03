import { type HTMLAttributes, forwardRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  label: string;
  color?: string;
  onRemove?: () => void;
  size?: ChipSize;
}

const sizeStyles: Record<ChipSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

const removeButtonSizes: Record<ChipSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ label, color, onRemove, size = 'md', className, style, ...props }, ref) => {
    const colorStyles = useMemo(() => {
      if (!color) return {};
      return {
        backgroundColor: `${color}26`, // 15% opacity (hex 26 = ~15%)
        color,
      };
    }, [color]);

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          'transition-colors duration-150',
          !color && 'bg-surface-100 text-text-secondary dark:bg-surface-200',
          sizeStyles[size],
          className,
        )}
        style={{ ...colorStyles, ...style }}
        {...props}
      >
        {label}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'opacity-60 hover:opacity-100 transition-opacity',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-current',
            )}
            aria-label={`Remove ${label}`}
          >
            <X className={removeButtonSizes[size]} />
          </button>
        )}
      </span>
    );
  },
);

Chip.displayName = 'Chip';
