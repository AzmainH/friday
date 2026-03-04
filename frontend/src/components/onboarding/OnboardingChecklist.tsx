import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react'

const CHECKLIST_DISMISSED_KEY = 'friday-checklist-dismissed'
const BOARD_EXPLORED_KEY = 'friday-board-explored'

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

function useChecklistItems(): ChecklistItem[] {
  // In a real app these would query real API state.
  // For now we use localStorage / static checks.
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: 'project', label: 'Create a project', checked: false },
    { id: 'issue', label: 'Create your first issue', checked: false },
    { id: 'team', label: 'Invite a team member', checked: false },
    { id: 'workflow', label: 'Set up a workflow', checked: true }, // default exists
    { id: 'board', label: 'Explore the board view', checked: false },
  ])

  useEffect(() => {
    const boardExplored = localStorage.getItem(BOARD_EXPLORED_KEY) === 'true'
    setItems((prev) =>
      prev.map((item) =>
        item.id === 'board' ? { ...item, checked: boardExplored } : item,
      ),
    )
  }, [])

  return items
}

interface OnboardingChecklistProps {
  onDismiss: () => void
}

export default function OnboardingChecklist({ onDismiss }: OnboardingChecklistProps) {
  const [expanded, setExpanded] = useState(false)
  const items = useChecklistItems()

  const completedCount = items.filter((i) => i.checked).length
  const totalCount = items.length
  const progress = Math.round((completedCount / totalCount) * 100)

  const handleDismiss = useCallback(() => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, 'true')
    onDismiss()
  }, [onDismiss])

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs w-72">
      <div className="rounded-lg border border-surface-200 bg-white shadow-lg dark:bg-surface-100 dark:border-surface-300">
        {/* Header - always visible */}
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            {/* Circular progress indicator */}
            <div className="relative h-8 w-8 shrink-0">
              <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-surface-200"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress} 100`}
                  strokeLinecap="round"
                  className="text-primary-500 transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary">
                {completedCount}/{totalCount}
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">Getting Started</span>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          ) : (
            <ChevronUp className="h-4 w-4 text-text-tertiary" />
          )}
        </button>

        {/* Expanded checklist */}
        {expanded && (
          <div className="border-t border-surface-200 px-4 py-3 dark:border-surface-300">
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  {item.checked ? (
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 shrink-0 text-text-tertiary" />
                  )}
                  <span
                    className={`text-sm ${
                      item.checked
                        ? 'text-text-secondary line-through'
                        : 'text-text-primary'
                    }`}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
              Don't show again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { CHECKLIST_DISMISSED_KEY, BOARD_EXPLORED_KEY }
