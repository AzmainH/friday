import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrgStore } from '@/stores/orgStore'
import { useOrganization, useUpdateOrganization } from '@/hooks/useSettings'

interface OrgFormValues {
  name: string
  description: string
}

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'
const labelClass = 'block text-sm font-medium text-text-primary mb-1'

export default function OrganizationSettings() {
  const currentOrgId = useOrgStore((s) => s.currentOrgId)
  const { data: org, isLoading } = useOrganization(currentOrgId)
  const updateOrg = useUpdateOrganization()

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<OrgFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (org) {
      reset({
        name: org.name ?? '',
        description: org.description ?? '',
      })
    }
  }, [org, reset])

  const onSubmit = (values: OrgFormValues) => {
    if (!currentOrgId) return
    updateOrg.mutate({ id: currentOrgId, body: values })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  if (!currentOrgId) {
    return (
      <div className="text-sm text-text-secondary py-4">
        No organization selected. Please select an organization to manage its settings.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Organization</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your organization details and branding.
        </p>
      </div>

      {/* Logo placeholder */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-surface-100 dark:bg-surface-200 flex items-center justify-center border border-surface-200">
          <Building2 className="h-8 w-8 text-text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{org?.name ?? 'Organization'}</p>
          <p className="text-xs text-text-secondary">Organization logo can be updated here</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Organization Name</label>
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
              <textarea {...field} rows={4} className={inputClass} />
            )}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={updateOrg.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
