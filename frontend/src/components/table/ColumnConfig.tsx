import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react'

export interface ColumnInfo {
  id: string
  label: string
}

export interface ColumnConfigProps {
  /** Popover anchor element (null = closed). */
  anchorEl: HTMLElement | null
  /** Called to close the popover. */
  onClose: () => void
  /** All available columns (in current order). */
  columns: ColumnInfo[]
  /** IDs of currently visible columns. */
  visibleColumns: string[]
  /** Toggle visibility of a column. */
  onToggle: (columnId: string) => void
  /** Reorder columns (receives new ordered ID array). */
  onReorder: (newOrder: string[]) => void
  /** Reset to default visibility and order. */
  onReset: () => void
}

export default function ColumnConfig({
  anchorEl,
  onClose,
  columns,
  visibleColumns,
  onToggle,
  onReorder,
  onReset,
}: ColumnConfigProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const moveColumn = useCallback(
    (index: number, direction: -1 | 1) => {
      const ids = columns.map((c) => c.id)
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= ids.length) return
      const copy = [...ids]
      ;[copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]]
      onReorder(copy)
    },
    [columns, onReorder],
  )

  // Close on click outside
  useEffect(() => {
    if (!anchorEl) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorEl, onClose])

  if (!anchorEl) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 w-[280px] max-h-[420px] bg-white dark:bg-surface-100 border border-surface-200 rounded-[--radius-md] shadow-lg z-50 p-2"
    >
      <p className="px-2 pt-1 pb-2 text-sm font-semibold text-text-primary">Configure Columns</p>
      <div className="h-px bg-surface-200 mb-1" />

      <div className="overflow-y-auto max-h-[300px] py-1">
        {columns.map((col, index) => {
          // The "select" column cannot be hidden or reordered
          const isFixed = col.id === 'select'
          return (
            <div
              key={col.id}
              className="flex items-center px-1 rounded hover:bg-surface-50 transition-colors"
            >
              {/* Drag / reorder handle area */}
              <div className="flex flex-col mr-1">
                {!isFixed ? (
                  <>
                    <button
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                      className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                      aria-label={`Move ${col.label} up`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      disabled={index === columns.length - 1}
                      onClick={() => moveColumn(index, 1)}
                      className="p-0.5 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                      aria-label={`Move ${col.label} down`}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </>
                ) : (
                  <GripVertical size={16} className="text-text-tertiary mx-0.5" />
                )}
              </div>

              <label className="flex-1 flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.id)}
                  onChange={() => onToggle(col.id)}
                  disabled={isFixed}
                  className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary truncate">{col.label}</span>
              </label>
            </div>
          )
        })}
      </div>

      <div className="h-px bg-surface-200 my-1" />
      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        Reset to defaults
      </Button>
    </div>
  )
}
