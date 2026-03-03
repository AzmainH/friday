import { useState } from 'react'
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  label?: string
  value: string | null
  onChange: (value: string | null) => void
  options: ComboboxOption[]
  error?: string
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function Combobox({
  label,
  value,
  onChange,
  options,
  error,
  className,
  placeholder = 'Search...',
  disabled = false,
}: ComboboxProps) {
  const [query, setQuery] = useState('')

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        )

  const selectedOption = options.find((o) => o.value === value) ?? null

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      <HeadlessCombobox
        value={value}
        onChange={onChange}
        disabled={disabled}
        onClose={() => setQuery('')}
      >
        <div className="relative">
          <ComboboxInput
            className={cn(
              'w-full rounded-[--radius-md] border bg-white px-3 py-2 pr-10 text-sm',
              'border-surface-300 shadow-xs',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-surface-300 dark:bg-surface-100 dark:text-text-primary',
              error && 'border-error focus:border-error focus:ring-error/20'
            )}
            placeholder={placeholder}
            displayValue={() => selectedOption?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
          />

          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          transition
          anchor="bottom start"
          className={cn(
            'z-[--z-dropdown] mt-1 w-[var(--input-width)] overflow-auto rounded-[--radius-md] border border-surface-200 bg-white py-1 shadow-lg',
            'max-h-60 focus:outline-none',
            'dark:border-surface-300 dark:bg-surface-100',
            // Transition classes
            'transition duration-150 ease-out',
            'data-[closed]:scale-95 data-[closed]:opacity-0',
            'data-[enter]:ease-out data-[leave]:ease-in'
          )}
        >
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="px-4 py-2 text-sm text-text-tertiary">
              No results found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className={cn(
                  'relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm text-text-primary',
                  'data-[focus]:bg-primary-50 data-[focus]:text-primary-700',
                  'dark:data-[focus]:bg-primary-900/30 dark:data-[focus]:text-primary-300'
                )}
              >
                {({ selected }) => (
                  <>
                    <span className={cn('block truncate', selected && 'font-medium')}>
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </HeadlessCombobox>

      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  )
}
