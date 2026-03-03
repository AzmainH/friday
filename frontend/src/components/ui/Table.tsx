import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

/* ── Table ── */

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={cn('w-full text-sm', className)}
        {...props}
      />
    );
  },
);

Table.displayName = 'Table';

/* ── TableHeader ── */

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={cn(
        'bg-surface-50 dark:bg-surface-100 sticky top-0',
        className,
      )}
      {...props}
    />
  );
});

TableHeader.displayName = 'TableHeader';

/* ── TableBody ── */

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
});

TableBody.displayName = 'TableBody';

/* ── TableRow ── */

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-surface-100',
          'hover:bg-surface-50/50 transition-colors',
          className,
        )}
        {...props}
      />
    );
  },
);

TableRow.displayName = 'TableRow';

/* ── TableHead ── */

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-4 py-3 text-left font-medium',
          'text-text-secondary text-xs uppercase tracking-wide',
          className,
        )}
        {...props}
      />
    );
  },
);

TableHead.displayName = 'TableHead';

/* ── TableCell ── */

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('px-4 py-3 text-text-primary', className)}
        {...props}
      />
    );
  },
);

TableCell.displayName = 'TableCell';
