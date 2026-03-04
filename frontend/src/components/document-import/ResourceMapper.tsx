import { useQuery } from '@tanstack/react-query'
import { User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import client from '@/api/client'
import type { ResourceMatchPreview } from '@/hooks/useDocumentImport'

interface UserOption {
  id: string
  display_name: string
  email: string
}

interface ResourceMapperProps {
  resources: ResourceMatchPreview[]
  mapping: Record<string, string | null>
  onMappingChange: (mapping: Record<string, string | null>) => void
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.9)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="h-3 w-3" /> High
      </span>
    )
  if (confidence >= 0.6)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <AlertCircle className="h-3 w-3" /> Partial
      </span>
    )
  if (confidence > 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="h-3 w-3" /> Low
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
      No match
    </span>
  )
}

export default function ResourceMapper({
  resources,
  mapping,
  onMappingChange,
}: ResourceMapperProps) {
  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ['users-for-mapping'],
    queryFn: async () => {
      const { data } = await client.get('/users')
      const items = data?.data ?? data
      return Array.isArray(items) ? items : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleChange = (documentName: string, userId: string) => {
    onMappingChange({
      ...mapping,
      [documentName]: userId || null,
    })
  }

  if (resources.length === 0) {
    return (
      <div className="text-sm text-text-secondary text-center py-4">
        No team members found in the documents.
      </div>
    )
  }

  return (
    <div className="border border-surface-200 rounded-[--radius-md] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Document Name
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Confidence
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Assign to User
            </th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr
              key={resource.document_name}
              className="border-t border-surface-200 hover:bg-surface-50/50"
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                  <span className="text-text-primary font-medium">
                    {resource.document_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <ConfidenceBadge confidence={resource.confidence} />
              </td>
              <td className="px-4 py-2.5">
                <select
                  value={mapping[resource.document_name] ?? ''}
                  onChange={(e) => handleChange(resource.document_name, e.target.value)}
                  className={cn(
                    'w-full max-w-[260px] px-2.5 py-1.5 text-sm rounded-[--radius-sm]',
                    'border border-surface-300 bg-white dark:bg-dark-surface',
                    'text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                  )}
                >
                  <option value="">-- Not assigned --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name} ({user.email})
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
