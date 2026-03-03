import { Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from '@/lib/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
}

export function Switch({
  checked,
  onChange,
  label,
  className,
  disabled = false,
}: SwitchProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'group relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Track color
          'bg-surface-300 data-[checked]:bg-primary-500',
          'dark:bg-surface-400 dark:data-[checked]:bg-primary-500'
        )}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow ring-0',
            'transition duration-200 ease-in-out',
            'group-data-[checked]:translate-x-4'
          )}
        />
      </HeadlessSwitch>

      {label && (
        <span
          className={cn(
            'text-sm text-text-primary',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}
