import { Fragment, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import {
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  LineChart,
  List,
  Users,
  ClipboardList,
  Clock,
  Flag,
  Star,
  FolderOpen,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WidgetTypeDefinition {
  type: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  defaultSize: { w: number; h: number; minW: number; minH: number }
}

export interface WidgetPickerProps {
  open: boolean
  onClose: () => void
  onAddWidget: (widgetType: WidgetTypeDefinition) => void
}

// ---------------------------------------------------------------------------
// Available widget types
// ---------------------------------------------------------------------------

export const WIDGET_TYPES: WidgetTypeDefinition[] = [
  {
    type: 'issues_by_status',
    label: 'Issues by Status',
    description: 'Bar chart showing issue counts grouped by workflow status.',
    icon: BarChart3,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
  },
  {
    type: 'progress_donut',
    label: 'Progress Donut',
    description: 'Donut chart showing overall completion percentage.',
    icon: PieChart,
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
  },
  {
    type: 'milestone_timeline',
    label: 'Milestone Timeline',
    description: 'Horizontal timeline of upcoming milestones.',
    icon: Flag,
    defaultSize: { w: 6, h: 2, minW: 4, minH: 2 },
  },
  {
    type: 'burn_up',
    label: 'Burn-Up Chart',
    description: 'Line chart tracking total scope versus completed work.',
    icon: LineChart,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2 },
  },
  {
    type: 'activity_feed',
    label: 'Activity Feed',
    description: 'Recent activity stream for the project or workspace.',
    icon: List,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 2 },
  },
  {
    type: 'workload',
    label: 'Team Workload',
    description: 'Bar chart or heatmap showing team member workload.',
    icon: Users,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
  },
  {
    type: 'my_issues',
    label: 'My Issues',
    description: 'Count of issues assigned to you, grouped by status.',
    icon: ClipboardList,
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
  },
  {
    type: 'overdue',
    label: 'Overdue Count',
    description: 'Count of issues past their due date.',
    icon: Clock,
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
  },
  {
    type: 'milestone_timeline',
    label: 'Milestones',
    description: 'Compact timeline of project milestones.',
    icon: TrendingUp,
    defaultSize: { w: 6, h: 2, minW: 4, minH: 2 },
  },
  {
    type: 'favorites',
    label: 'Favorites',
    description: 'Quick access to your starred items.',
    icon: Star,
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
  },
  {
    type: 'projects_overview',
    label: 'Projects Overview',
    description: 'Summary cards for all projects you are a member of.',
    icon: FolderOpen,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2 },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WidgetPicker({ open, onClose, onAddWidget }: WidgetPickerProps) {
  const handleSelect = useCallback(
    (widgetType: WidgetTypeDefinition) => {
      onAddWidget(widgetType)
      onClose()
    },
    [onAddWidget, onClose],
  )

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </TransitionChild>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-2xl rounded-[--radius-lg] bg-white dark:bg-dark-surface shadow-xl">
              {/* Title bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                <DialogTitle className="text-lg font-semibold text-text-primary">
                  Add Widget
                </DialogTitle>
                <button
                  onClick={onClose}
                  aria-label="Close widget picker"
                  className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {WIDGET_TYPES.map((wt) => {
                    const Icon = wt.icon
                    return (
                      <button
                        key={`${wt.type}-${wt.label}`}
                        onClick={() => handleSelect(wt)}
                        className="w-full text-left p-4 border border-surface-200 rounded-[--radius-md] hover:border-primary-500 hover:shadow-md transition-all bg-white dark:bg-dark-surface"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-text-primary">
                            {wt.label}
                          </span>
                        </div>
                        <span className="text-xs text-text-secondary leading-snug">
                          {wt.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
