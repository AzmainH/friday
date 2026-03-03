import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

export interface TableCellProps {
  /** Current display value. */
  value: string | number | null
  /** Called when the user commits an edit. */
  onChange: (newValue: string | number | null) => void
  /** Input type for the editing control. */
  type: 'text' | 'select' | 'number' | 'date'
  /** Options for select type. */
  options?: SelectOption[]
  /** If true, the cell is not editable. */
  disabled?: boolean
}

export default function TableCell({ value, onChange, type, options = [], disabled = false }: TableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // Sync draft whenever the external value changes while not editing
  useEffect(() => {
    if (!editing) {
      setDraft(value != null ? String(value) : '')
    }
  }, [value, editing])

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [editing, type])

  const startEditing = useCallback(() => {
    if (!disabled) {
      setEditing(true)
    }
  }, [disabled])

  const commit = useCallback(() => {
    setEditing(false)
    if (draft === (value != null ? String(value) : '')) return
    if (type === 'number') {
      const n = draft === '' ? null : Number(draft)
      onChange(n != null && isNaN(n) ? value : n)
    } else {
      onChange(draft || null)
    }
  }, [draft, value, type, onChange])

  const cancel = useCallback(() => {
    setDraft(value != null ? String(value) : '')
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    },
    [commit, cancel],
  )

  // --- Render ---

  if (!editing) {
    return (
      <div
        onClick={startEditing}
        className={cn(
          'px-2 py-1 min-h-[32px] flex items-center rounded',
          disabled ? 'cursor-default' : 'cursor-pointer hover:bg-surface-100 transition-colors',
        )}
      >
        <span className="text-sm text-text-primary truncate">
          {value != null ? String(value) : '\u2014'}
        </span>
      </div>
    )
  }

  if (type === 'select') {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setEditing(false)
          onChange(e.target.value)
        }}
        onBlur={cancel}
        className="w-full min-w-[100px] px-2 py-1 text-sm border border-primary-500 rounded-[--radius-sm] outline-none bg-white dark:bg-surface-100 text-text-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 text-sm border border-primary-500 rounded-[--radius-sm] outline-none bg-white dark:bg-surface-100 text-text-primary"
    />
  )
}
