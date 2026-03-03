import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import StakeholderMatrix from '@/components/stakeholders/StakeholderMatrix'
import {
  useStakeholders,
  useCreateStakeholder,
  useUpdateStakeholder,
} from '@/hooks/useStakeholders'
import type { Stakeholder } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakeholderFormValues {
  name: string
  role: string
  interest_level: number
  influence_level: number
}

// ---------------------------------------------------------------------------
// Create / Edit Dialog
// ---------------------------------------------------------------------------

interface StakeholderDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  existing?: Stakeholder | null
}

function StakeholderDialog({ open, onClose, projectId, existing }: StakeholderDialogProps) {
  const createStakeholder = useCreateStakeholder()
  const updateStakeholder = useUpdateStakeholder()
  const isEdit = !!existing

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormValues>({
    defaultValues: {
      name: existing?.name ?? '',
      role: existing?.role ?? '',
      interest_level: existing?.interest_level ?? 5,
      influence_level: existing?.influence_level ?? 5,
    },
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (values: StakeholderFormValues) => {
      if (isEdit && existing) {
        await updateStakeholder.mutateAsync({
          id: existing.id,
          body: {
            name: values.name,
            role: values.role || null,
            interest_level: values.interest_level,
            influence_level: values.influence_level,
          },
        })
      } else {
        await createStakeholder.mutateAsync({
          project_id: projectId,
          name: values.name,
          role: values.role || null,
          interest_level: values.interest_level,
          influence_level: values.influence_level,
        })
      }
      handleClose()
    },
    [isEdit, existing, createStakeholder, updateStakeholder, projectId, handleClose],
  )

  return (
    <Dialog
      open={open}
      onClose={() => handleClose()}
      title={isEdit ? 'Edit Stakeholder' : 'Add Stakeholder'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5">
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <input
                  {...field}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                <input
                  {...field}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
              </div>
            )}
          />

          <Controller
            name="interest_level"
            control={control}
            render={({ field }) => (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-text-secondary">Interest Level</label>
                  <span className="text-sm font-semibold text-text-primary">{field.value}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onBlur={field.onBlur}
                  className="w-full accent-primary-500"
                />
              </div>
            )}
          />

          <Controller
            name="influence_level"
            control={control}
            render={({ field }) => (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-text-secondary">Influence Level</label>
                  <span className="text-sm font-semibold text-text-primary">{field.value}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onBlur={field.onBlur}
                  className="w-full accent-primary-500"
                />
              </div>
            )}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StakeholdersPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: stakeholders, isLoading, error } = useStakeholders(pid)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null)

  const handleEdit = useCallback((stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder)
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    setEditingStakeholder(null)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingStakeholder(null)
    setDialogOpen(true)
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500 mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Stakeholders</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
          Add Stakeholder
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Failed to load stakeholders.
        </div>
      )}

      {/* Matrix */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Interest vs Influence Matrix
        </h2>
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
          <StakeholderMatrix stakeholders={stakeholders ?? []} />
        </div>
      </div>

      {/* Table */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Stakeholder Directory
        </h2>
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Role</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">Interest</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">Influence</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!stakeholders || stakeholders.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center border-t border-surface-200">
                    <p className="text-sm text-text-secondary">
                      No stakeholders yet. Add one to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                stakeholders.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-2 border-t border-surface-200">{s.name}</td>
                    <td className="px-4 py-2 border-t border-surface-200">{s.role ?? '--'}</td>
                    <td className="px-4 py-2 border-t border-surface-200 text-center">{s.interest_level}</td>
                    <td className="px-4 py-2 border-t border-surface-200 text-center">{s.influence_level}</td>
                    <td className="px-4 py-2 border-t border-surface-200 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(s)}
                        className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <StakeholderDialog
        open={dialogOpen}
        onClose={handleClose}
        projectId={pid}
        existing={editingStakeholder}
      />
    </div>
  )
}
