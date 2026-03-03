import { useNavigate } from 'react-router-dom'
import { PlusCircle, FolderPlus, Search, LayoutDashboard } from 'lucide-react'
import { useSearchStore } from '@/stores/searchStore'

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color: string
  bgClass: string
}

export default function QuickActions() {
  const navigate = useNavigate()
  const openSearch = useSearchStore((s) => s.open)

  const actions: QuickAction[] = [
    {
      label: 'Create Issue',
      icon: <PlusCircle className="w-7 h-7" />,
      onClick: () => navigate('/issues/new'),
      color: 'text-info',
      bgClass: 'bg-info/10 hover:bg-info/20',
    },
    {
      label: 'Create Project',
      icon: <FolderPlus className="w-7 h-7" />,
      onClick: () => navigate('/projects/new'),
      color: 'text-success',
      bgClass: 'bg-success/10 hover:bg-success/20',
    },
    {
      label: 'Search',
      icon: <Search className="w-7 h-7" />,
      onClick: openSearch,
      color: 'text-primary-500',
      bgClass: 'bg-primary-500/10 hover:bg-primary-500/20',
    },
    {
      label: 'View Board',
      icon: <LayoutDashboard className="w-7 h-7" />,
      onClick: () => navigate('/projects'),
      color: 'text-purple-600',
      bgClass: 'bg-purple-600/10 hover:bg-purple-600/20',
    },
  ]

  return (
    <div className="bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200 p-5">
      <h2 className="text-lg font-semibold text-text-primary mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center gap-1.5"
          >
            <button
              onClick={action.onClick}
              className={`w-14 h-14 flex items-center justify-center rounded-full ${action.color} ${action.bgClass} transition-all duration-[--duration-normal] cursor-pointer hover:-translate-y-0.5 hover:shadow-md`}
            >
              {action.icon}
            </button>
            <span className="text-xs text-text-secondary text-center">
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
