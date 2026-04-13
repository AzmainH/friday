import { useState } from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RAGValue = 'green' | 'amber' | 'red'

interface RAGBadgeProps {
  status: RAGValue
  rationale?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<RAGValue, { label: string; dotColor: string; bgColor: string; textColor: string; borderColor: string }> = {
  green: {
    label: 'On Track',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  amber: {
    label: 'At Risk',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  red: {
    label: 'Off Track',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
  },
}

const SIZE_MAP = {
  sm: { dot: 'h-2.5 w-2.5', text: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1.5' },
  md: { dot: 'h-3.5 w-3.5', text: 'text-sm', padding: 'px-3 py-1', gap: 'gap-2' },
  lg: { dot: 'h-5 w-5', text: 'text-base', padding: 'px-4 py-1.5', gap: 'gap-2.5' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RAGBadge({
  status,
  rationale,
  size = 'md',
  showLabel = true,
  className,
}: RAGBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const config = STATUS_CONFIG[status]
  const sizeConfig = SIZE_MAP[size]

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          sizeConfig.padding,
          sizeConfig.gap,
          config.bgColor,
          config.textColor,
          config.borderColor,
          className,
        )}
        onMouseEnter={() => rationale && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className={cn('rounded-full flex-shrink-0', sizeConfig.dot, config.dotColor)} />
        {showLabel && (
          <span className={sizeConfig.text}>{config.label}</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && rationale && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-sm">
          <div className="rounded-lg bg-surface-800 dark:bg-surface-700 px-3 py-2 text-xs text-white shadow-lg">
            <div className="font-semibold mb-0.5">{config.label}</div>
            <div className="text-surface-300">{rationale}</div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-surface-800 dark:border-t-surface-700" />
        </div>
      )}
    </div>
  )
}
