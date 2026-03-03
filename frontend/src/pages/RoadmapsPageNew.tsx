import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Plus, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useRoadmapPlans, useCreateRoadmap } from '@/hooks/useRoadmap'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RoadmapsPageNew() {
  const navigate = useNavigate()
  const { data: plans, isLoading, error } = useRoadmapPlans(WORKSPACE_ID)
  const createRoadmap = useCreateRoadmap()

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const handleCreate = () => {
    createRoadmap.mutate(
      {
        workspace_id: WORKSPACE_ID,
        name: form.name,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      },
      {
        onSuccess: (newPlan) => {
          setDialogOpen(false)
          setForm({ name: '', description: '', start_date: '', end_date: '' })
          navigate(`/roadmaps/${newPlan.id}`)
        },
      },
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Roadmaps</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-[--radius-sm] bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[--shadow-sm] hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Roadmap
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] mb-4">
          Failed to load roadmaps: {error.message}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-[--radius-md] border border-surface-200 bg-white dark:bg-dark-surface p-4"
            >
              <div className="skeleton-shimmer h-6 w-[70%] rounded mb-2" />
              <div className="skeleton-shimmer h-4 w-[50%] rounded mb-3" />
              <div className="skeleton-shimmer h-10 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && plans && plans.length === 0 && (
        <div className="p-12 text-center rounded-[--radius-lg] bg-white dark:bg-dark-surface border border-surface-200">
          <p className="text-text-secondary mb-4">
            No roadmaps yet. Create one to start planning across projects.
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-[--radius-sm] border border-primary-500 text-primary-600 px-4 py-2 text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Roadmap
          </button>
        </div>
      )}

      {/* Roadmap cards */}
      {!isLoading && plans && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => navigate(`/roadmaps/${plan.id}`)}
              className="rounded-[--radius-md] border border-surface-200 bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full"
            >
              <div className="p-4">
                <h3 className="text-base font-semibold text-text-primary truncate mb-1">
                  {plan.name}
                </h3>

                {plan.description && (
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Calendar className="h-4 w-4 text-text-secondary" />
                  <span className="text-xs text-text-secondary">
                    {formatDate(plan.start_date)} &mdash; {formatDate(plan.end_date)}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-primary-300 bg-primary-50 text-primary-700 px-2.5 py-0.5 text-xs font-medium">
                    Roadmap
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Create Roadmap Dialog ---- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Dialog positioning */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-[--radius-md] bg-white dark:bg-dark-surface shadow-[--shadow-lg] border border-surface-200">
            <DialogTitle className="text-lg font-semibold text-text-primary px-6 pt-6 pb-2">
              Create Roadmap
            </DialogTitle>

            <div className="px-6 py-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <input
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="Roadmap name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-[--radius-sm] px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || createRoadmap.isPending}
                className={cn(
                  'rounded-[--radius-sm] px-4 py-2 text-sm font-medium text-white shadow-[--shadow-sm] transition-colors',
                  !form.name.trim() || createRoadmap.isPending
                    ? 'bg-primary-300 cursor-not-allowed'
                    : 'bg-primary-500 hover:bg-primary-600'
                )}
              >
                {createRoadmap.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
