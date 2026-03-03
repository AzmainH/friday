import { Menu, MenuItems, MenuItem } from '@/components/ui/Menu'
import { MenuButton as HeadlessMenuButton } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { WorkflowStatus } from '@/types/api'

const CATEGORY_COLORS: Record<string, string> = {
  todo: '#9e9e9e',
  in_progress: '#2196f3',
  done: '#4caf50',
}

interface StatusTransitionDropdownProps {
  currentStatusId: string
  statuses: WorkflowStatus[]
  onChange: (statusId: string) => void
}

export default function StatusTransitionDropdown({
  currentStatusId,
  statuses,
  onChange,
}: StatusTransitionDropdownProps) {
  const currentStatus = statuses.find((s) => s.id === currentStatusId)

  const statusColor = currentStatus
    ? CATEGORY_COLORS[currentStatus.category] ?? currentStatus.color
    : '#9e9e9e'

  const sortedStatuses = [...statuses].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <Menu>
      <HeadlessMenuButton
        className={cn(
          'inline-flex items-center gap-2 rounded-[--radius-sm] border px-3 py-1.5',
          'text-sm font-medium text-text-primary',
          'hover:bg-surface-50 transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        )}
        style={{ borderColor: statusColor }}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        {currentStatus?.name ?? 'Unknown'}
        <ChevronDown className="h-4 w-4 text-text-secondary" />
      </HeadlessMenuButton>

      <MenuItems anchor="bottom start" className="min-w-[200px]">
        <span className="block px-3 py-1.5 text-xs font-semibold text-text-secondary">
          Change status
        </span>

        {sortedStatuses.map((status) => {
          const color = CATEGORY_COLORS[status.category] ?? status.color
          const isActive = status.id === currentStatusId

          return (
            <MenuItem
              key={status.id}
              onClick={() => onChange(status.id)}
              icon={
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              }
              className={cn(isActive && 'font-semibold')}
            >
              {status.name}
            </MenuItem>
          )
        })}
      </MenuItems>
    </Menu>
  )
}
