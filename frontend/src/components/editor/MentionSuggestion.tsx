import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/cn'
import type { User } from '@/types/api'

interface MentionSuggestionProps {
  items: User[]
  command: (item: { id: string; label: string }) => void
}

export interface MentionSuggestionRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const MentionSuggestion = forwardRef<MentionSuggestionRef, MentionSuggestionProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command({ id: item.id, label: item.display_name })
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="border border-surface-200 rounded-[--radius-md] bg-white shadow-lg dark:bg-dark-surface dark:border-dark-border p-3">
          <p className="text-sm text-text-secondary">No users found</p>
        </div>
      )
    }

    return (
      <div className="border border-surface-200 rounded-[--radius-md] bg-white shadow-lg dark:bg-dark-surface dark:border-dark-border max-h-60 overflow-auto min-w-[220px]">
        {items.map((user, index) => (
          <button
            key={user.id}
            onClick={() => selectItem(index)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors',
              index === selectedIndex
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'hover:bg-surface-100 dark:hover:bg-dark-border',
            )}
          >
            <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary-100 text-primary-700 text-xs font-medium dark:bg-primary-900/30 dark:text-primary-300 overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.display_name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-text-primary truncate">
                {user.display_name}
              </span>
              <span className="block text-xs text-text-secondary truncate">
                {user.email}
              </span>
            </span>
          </button>
        ))}
      </div>
    )
  },
)

MentionSuggestion.displayName = 'MentionSuggestion'

export default MentionSuggestion
