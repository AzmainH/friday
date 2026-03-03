import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type SkeletonRounded = 'sm' | 'md' | 'lg' | 'full';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: SkeletonRounded;
}

const roundedStyles: Record<SkeletonRounded, string> = {
  sm: 'rounded-[--radius-sm]',
  md: 'rounded-[--radius-md]',
  lg: 'rounded-[--radius-lg]',
  full: 'rounded-full',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, rounded = 'md', className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn('skeleton-shimmer', roundedStyles[rounded], className)}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  },
);

Skeleton.displayName = 'Skeleton';

/* ── SkeletonText ── */

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  gap?: string;
  lastLineWidth?: string;
}

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, gap = '0.75rem', lastLineWidth = '60%', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn('flex flex-col', className)}
        style={{ gap }}
        {...props}
      >
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            height={12}
            rounded="sm"
            style={{
              width: i === lines - 1 ? lastLineWidth : '100%',
            }}
          />
        ))}
      </div>
    );
  },
);

SkeletonText.displayName = 'SkeletonText';

/* ── SkeletonAvatar ── */

export interface SkeletonAvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export const SkeletonAvatar = forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = 40, className, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        width={size}
        height={size}
        rounded="full"
        className={cn('shrink-0', className)}
        {...props}
      />
    );
  },
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

/* ── SkeletonCard ── */

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  hasAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ hasAvatar = false, lines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'bg-white dark:bg-surface-100',
          'rounded-[--radius-lg] shadow-sm',
          'border border-surface-200 dark:border-surface-200',
          'p-6',
          className,
        )}
        {...props}
      >
        {hasAvatar && (
          <div className="flex items-center gap-3 mb-4">
            <SkeletonAvatar size={36} />
            <div className="flex-1 space-y-2">
              <Skeleton height={12} rounded="sm" style={{ width: '40%' }} />
              <Skeleton height={10} rounded="sm" style={{ width: '25%' }} />
            </div>
          </div>
        )}
        <SkeletonText lines={lines} />
      </div>
    );
  },
);

SkeletonCard.displayName = 'SkeletonCard';
