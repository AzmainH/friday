import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked = false, onChange, disabled = false, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2 select-none',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        <span className="relative inline-flex items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'h-5 w-5 rounded-[4px] border-2 transition-colors duration-150',
              'flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/20 peer-focus-visible:ring-offset-2',
              checked
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-surface-300 bg-white dark:bg-surface-100 dark:border-surface-300',
              !disabled && !checked && 'hover:border-primary-400',
            )}
            aria-hidden="true"
          >
            {checked && <CheckIcon className="h-3 w-3" />}
          </span>
        </span>
        {label && (
          <span className="text-sm text-text-primary">{label}</span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
