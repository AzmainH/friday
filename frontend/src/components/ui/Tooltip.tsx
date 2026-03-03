import { type ReactNode, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';

export type TooltipSide = 'top' | 'bottom';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 150);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setVisible(false);
  }, []);

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute left-1/2 -translate-x-1/2 z-50',
            'px-2.5 py-1.5 rounded-md',
            'bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium',
            'whitespace-nowrap shadow-lg',
            'pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            side === 'top' && 'bottom-full mb-2',
            side === 'bottom' && 'top-full mt-2',
          )}
        >
          {content}
          <span
            className={cn(
              'absolute left-1/2 -translate-x-1/2',
              'h-0 w-0 border-x-[5px] border-x-transparent',
              side === 'top' && 'top-full border-t-[5px] border-t-gray-900 dark:border-t-gray-800',
              side === 'bottom' && 'bottom-full border-b-[5px] border-b-gray-900 dark:border-b-gray-800',
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
