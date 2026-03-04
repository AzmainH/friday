import { FileBarChart, AlertTriangle, Calendar } from 'lucide-react'

interface AIQuickActionsProps {
  onAction: (action: string) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  {
    key: 'status_report',
    label: 'Status Report',
    icon: FileBarChart,
    message: 'Generate a weekly status report for this project.',
  },
  {
    key: 'risk_analysis',
    label: 'Risk Analysis',
    icon: AlertTriangle,
    message: 'Analyze potential risks and blockers in this project.',
  },
  {
    key: 'smart_schedule',
    label: 'Smart Schedule',
    icon: Calendar,
    message: 'Suggest an optimized schedule for the current tasks.',
  },
] as const

export default function AIQuickActions({ onAction, disabled }: AIQuickActionsProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.key}
            onClick={() => onAction(action.message)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary hover:border-[#009688] hover:text-[#009688] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon size={13} />
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
