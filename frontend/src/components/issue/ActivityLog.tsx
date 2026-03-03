import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  User,
  Tag,
  AlertTriangle,
  Calendar,
  Plus,
  Pencil,
} from 'lucide-react'
import client from '@/api/client'
import { formatRelativeTime } from '@/utils/formatters'

interface ActivityEntry {
  id: string
  user_id: string
  field: string
  old_value: string | null
  new_value: string | null
  created_at: string
  user?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface ActivityLogProps {
  issueId: string
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  status: <ArrowLeftRight className="w-3.5 h-3.5" />,
  assignee: <User className="w-3.5 h-3.5" />,
  priority: <AlertTriangle className="w-3.5 h-3.5" />,
  labels: <Tag className="w-3.5 h-3.5" />,
  due_date: <Calendar className="w-3.5 h-3.5" />,
  summary: <Pencil className="w-3.5 h-3.5" />,
  description: <Pencil className="w-3.5 h-3.5" />,
}

function getFieldIcon(field: string): React.ReactNode {
  return FIELD_ICONS[field] ?? <Pencil className="w-3.5 h-3.5" />
}

function formatFieldChange(entry: ActivityEntry): string {
  const { field, old_value, new_value } = entry

  if (!old_value && new_value) {
    return `set ${field.replace(/_/g, ' ')} to "${new_value}"`
  }
  if (old_value && !new_value) {
    return `removed ${field.replace(/_/g, ' ')}`
  }
  return `changed ${field.replace(/_/g, ' ')} from "${old_value}" to "${new_value}"`
}

export default function ActivityLog({ issueId }: ActivityLogProps) {
  const { data, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['issueActivity', issueId],
    queryFn: async () => {
      const { data: response } = await client.get(`/issues/${issueId}/activity`)
      return response.data ?? response
    },
    enabled: !!issueId,
  })

  const activities = data ?? []

  if (isLoading) {
    return (
      <div className="py-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3 mb-4 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-surface-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-[70%] bg-surface-200 rounded" />
              <div className="h-3 w-[30%] bg-surface-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-text-tertiary">
          No activity recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Activity
      </h3>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[13px] top-1 bottom-1 w-0.5 bg-surface-200 rounded-full" />

        {activities.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-3 mb-4 relative"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-100 text-text-secondary z-10 shrink-0">
              {getFieldIcon(entry.field)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary leading-relaxed">
                <span className="font-semibold">
                  {entry.user?.display_name ?? 'Someone'}
                </span>{' '}
                {formatFieldChange(entry)}
              </p>
              <p className="text-xs text-text-tertiary">
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>
          </div>
        ))}

        {/* Created entry */}
        <div className="flex gap-3 relative">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary-500 text-white z-10 shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <p className="text-xs text-text-tertiary mt-1.5">
            Issue created
          </p>
        </div>
      </div>
    </div>
  )
}
