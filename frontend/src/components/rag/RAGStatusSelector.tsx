import { useCallback } from 'react'
import { cn } from '@/lib/cn'
import { RAG_COLORS } from '@/utils/formatters'

// ---- Types ----

type RAGValue = 'green' | 'amber' | 'red' | 'none'

const RAG_OPTIONS: { value: RAGValue; label: string }[] = [
  { value: 'green', label: 'Green - On Track' },
  { value: 'amber', label: 'Amber - At Risk' },
  { value: 'red', label: 'Red - Off Track' },
]

// ---- Props ----

interface RAGStatusSelectorProps {
  value: RAGValue
  onChange: (value: RAGValue) => void
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  disabled?: boolean
}

// ---- Size map ----

const SIZE_MAP = {
  small: 20,
  medium: 28,
  large: 36,
}

// ---- Component ----

export default function RAGStatusSelector({
  value,
  onChange,
  size = 'medium',
  showLabel = false,
  disabled = false,
}: RAGStatusSelectorProps) {
  const circleSize = SIZE_MAP[size]

  const handleClick = useCallback(
    (ragValue: RAGValue) => {
      if (disabled) return
      // If already selected, toggle to 'none'; otherwise select it
      onChange(value === ragValue ? 'none' : ragValue)
    },
    [value, onChange, disabled],
  )

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      {RAG_OPTIONS.map(({ value: ragValue, label }) => {
        const isSelected = value === ragValue
        const color = RAG_COLORS[ragValue]

        return (
          <div
            key={ragValue}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-pressed={isSelected}
            title={label}
            onClick={() => handleClick(ragValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick(ragValue)
              }
            }}
            className={cn(
              'rounded-full cursor-pointer border-[3px] transition-all duration-150',
              'hover:opacity-100 hover:scale-110',
              'focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2',
              isSelected ? 'opacity-100' : 'opacity-50',
            )}
            style={{
              width: circleSize,
              height: circleSize,
              backgroundColor: color,
              borderColor: isSelected ? 'var(--color-text-primary, #1A1A1A)' : 'transparent',
              boxShadow: isSelected ? `0 0 0 2px ${color}40` : 'none',
            }}
          />
        )
      })}

      {showLabel && (
        <span
          className="ml-1 text-sm font-semibold capitalize"
          style={{
            color: value !== 'none' ? RAG_COLORS[value] : undefined,
          }}
        >
          {value === 'none' ? 'Not set' : value}
        </span>
      )}
    </div>
  )
}
