import type { FC } from 'react'
import { cn } from '@/lib/cn'
import { Kanban, List, GanttChart } from 'lucide-react'

export type ViewType = 'board' | 'table' | 'timeline'

export interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { value: ViewType; label: string; icon: React.ReactNode }[] = [
  { value: 'board', label: 'Board', icon: <Kanban size={16} /> },
  { value: 'table', label: 'Table', icon: <List size={16} /> },
  { value: 'timeline', label: 'Timeline', icon: <GanttChart size={16} /> },
]

const ViewSwitcher: FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div
      className="inline-flex items-center rounded-[--radius-sm] border border-surface-200 bg-surface-50 dark:bg-surface-100 p-0.5"
      role="group"
      aria-label="View switcher"
    >
      {views.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onViewChange(value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[6px] transition-all',
            currentView === value
              ? 'bg-white dark:bg-surface-200 text-primary-600 shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
          aria-label={label}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

export default ViewSwitcher
