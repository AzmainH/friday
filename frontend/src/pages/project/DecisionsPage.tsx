import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import DecisionDetail from '@/components/decisions/DecisionDetail'
import { useDecisions, useCreateDecision } from '@/hooks/useDecisions'
import type { DecisionDetail as DecisionDetailType } from '@/hooks/useDecisions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DECISION_STATUSES = ['proposed', 'accepted', 'rejected', 'deferred', 'superseded'] as const

// ---------------------------------------------------------------------------
// Create Decision Dialog
// ---------------------------------------------------------------------------

interface CreateFormValues {
  title: string
  description: string
  status: string
}

interface CreateDecisionDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
}

function CreateDecisionDialog({ open, onClose, projectId }: CreateDecisionDialogProps) {
  const createDecision = useCreateDecision()
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: { title: '', description: '', status: 'proposed' },
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (values: CreateFormValues) => {
      await createDecision.mutateAsync({
        project_id: projectId,
        title: values.title,
        description: values.description || null,
        status: values.status,
      })
      handleClose()
    },
    [createDecision, projectId, handleClose],
  )

  return (
    <Dialog open={open} onClose={() => handleClose()} title="New Decision" size="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5">
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                  {...field}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                <select
                  {...field}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                >
                  {DECISION_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  {...field}
                  rows={3}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
              </div>
            )}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DecisionsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: decisions, isLoading, error } = useDecisions(pid)

  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (!decisions) return []
    if (statusFilter === 'all') return decisions
    return decisions.filter((d) => d.status === statusFilter)
  }, [decisions, statusFilter])

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
        <h1 className="text-2xl font-bold text-text-primary">Decisions</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
          New Decision
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[160px] rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
        >
          <option value="all">All Statuses</option>
          {DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Failed to load decisions.
        </div>
      )}

      {/* Decision list */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-white border border-surface-200 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary">
            No decisions found. Create one to get started.
          </p>
        </div>
      ) : (
        filtered.map((decision) => (
          <DecisionDetail
            key={decision.id}
            decision={decision as DecisionDetailType}
          />
        ))
      )}

      {/* Create dialog */}
      <CreateDecisionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={pid}
      />
    </div>
  )
}
