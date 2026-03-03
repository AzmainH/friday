import { Menu, MenuButton, MenuItems, MenuItem } from '@/components/ui/Menu'
import { X, ArrowLeftRight, User, Flag, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

export type BulkActionKind = 'status' | 'assignee' | 'priority' | 'delete'

export interface BulkActionToolbarProps {
  /** Number of currently selected rows. */
  selectedCount: number
  /** Called when a bulk action is confirmed. */
  onBulkAction: (action: BulkActionKind, value?: string) => void
  /** Clear the current selection. */
  onClearSelection: () => void
}

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
]

export default function BulkActionToolbar({
  selectedCount,
  onBulkAction,
  onClearSelection,
}: BulkActionToolbarProps) {
  const statuses = useProjectStore((s) => s.statuses)

  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-[--radius-sm] mb-2">
      <span className="text-sm font-semibold mr-2">{selectedCount} selected</span>

      {/* ---- Change Status ---- */}
      <Menu>
        <MenuButton className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[--radius-sm] border border-white/30 text-white hover:bg-white/10 transition-colors">
          <ArrowLeftRight size={16} />
          Status
        </MenuButton>
        <MenuItems>
          {statuses.map((s) => (
            <MenuItem
              key={s.id}
              onClick={() => onBulkAction('status', s.id)}
              icon={
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
              }
            >
              {s.name}
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      {/* ---- Change Assignee (placeholder -- opens action with no picker) ---- */}
      <button
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[--radius-sm] border border-white/30 text-white hover:bg-white/10 transition-colors"
        onClick={() => onBulkAction('assignee')}
      >
        <User size={16} />
        Assignee
      </button>

      {/* ---- Change Priority ---- */}
      <Menu>
        <MenuButton className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[--radius-sm] border border-white/30 text-white hover:bg-white/10 transition-colors">
          <Flag size={16} />
          Priority
        </MenuButton>
        <MenuItems>
          {PRIORITIES.map((p) => (
            <MenuItem key={p.value} onClick={() => onBulkAction('priority', p.value)}>
              {p.label}
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      {/* ---- Delete ---- */}
      <button
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[--radius-sm] border border-white/30 text-white hover:bg-white/10 transition-colors"
        onClick={() => onBulkAction('delete')}
      >
        <Trash2 size={16} />
        Delete
      </button>

      {/* ---- Clear selection ---- */}
      <div className="flex-1" />
      <button
        onClick={onClearSelection}
        className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  )
}
