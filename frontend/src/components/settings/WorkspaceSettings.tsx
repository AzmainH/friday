import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrgStore } from '@/stores/orgStore'
import { useWorkspace, useUpdateWorkspace, useWorkspaceMembers } from '@/hooks/useSettings'

interface WorkspaceFormValues {
  name: string
  description: string
}

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'
const labelClass = 'block text-sm font-medium text-text-primary mb-1'

export default function WorkspaceSettings() {
  const currentWorkspaceId = useOrgStore((s) => s.currentWorkspaceId)
  const { data: workspace, isLoading } = useWorkspace(currentWorkspaceId)
  const { data: members = [] } = useWorkspaceMembers(currentWorkspaceId)
  const updateWorkspace = useUpdateWorkspace()

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<WorkspaceFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name ?? '',
        description: workspace.description ?? '',
      })
    }
  }, [workspace, reset])

  const onSubmit = (values: WorkspaceFormValues) => {
    if (!currentWorkspaceId) return
    updateWorkspace.mutate({ id: currentWorkspaceId, body: values })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  if (!currentWorkspaceId) {
    return (
      <div className="text-sm text-text-secondary py-4">
        No workspace selected. Please select a workspace to manage its settings.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Workspace</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your workspace details and view members.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Workspace Name</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <input {...field} className={inputClass} />}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea {...field} rows={3} className={inputClass} />
            )}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={updateWorkspace.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Members list */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members ({members.length})
        </h3>
        {members.length === 0 ? (
          <p className="text-sm text-text-secondary">No members found.</p>
        ) : (
          <div className="border border-surface-200 rounded-lg divide-y divide-surface-200">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-surface-100 dark:bg-surface-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-text-secondary">
                      {(member.name ?? member.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {member.name ?? 'Unnamed'}
                    </p>
                    <p className="text-xs text-text-secondary">{member.email ?? ''}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-text-secondary bg-surface-100 dark:bg-surface-200 px-2 py-1 rounded">
                  {member.role ?? 'member'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
