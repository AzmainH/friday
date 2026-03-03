import { type ImgHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name, size = 'md', className, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;
    const initials = name ? getInitials(name) : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full',
          'ring-2 ring-transparent hover:ring-primary-300 transition-shadow duration-150',
          'overflow-hidden shrink-0',
          sizeStyles[size],
          className,
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? name ?? ''}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
            {...props}
          />
        ) : (
          <span
            className={cn(
              'flex h-full w-full items-center justify-center',
              'bg-gradient-to-br from-primary-400 to-primary-600',
              'font-medium text-white select-none',
            )}
            aria-label={alt ?? name ?? 'Avatar'}
          >
            {initials}
          </span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
