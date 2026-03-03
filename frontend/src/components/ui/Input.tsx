import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full rounded-[--radius-sm] border bg-white px-3 py-2 text-sm',
            'text-text-primary placeholder:text-text-tertiary',
            'transition-colors duration-150',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:bg-surface-100 dark:border-surface-200 dark:text-text-primary',
            error
              ? 'border-error text-error focus:border-error focus:ring-error/20'
              : 'border-surface-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
