import { useState, useMemo } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Plus, ChevronDown, ChevronUp, Rocket } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useReleases, useCreateRelease } from '@/hooks/usePortfolio'
import type { ReleaseWithProjects } from '@/hooks/usePortfolio'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WORKSPACE_ID = 'default' // Placeholder until workspace context is wired

const STATUS_COLOR: Record<string, string> = {
  planned: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  released: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_OPTIONS = ['planned', 'in_progress', 'released', 'cancelled']

/* ------------------------------------------------------------------ */
/*  Release timeline SVG                                               */
/* ------------------------------------------------------------------ */

function ReleaseTimeline({ releases }: { releases: ReleaseWithProjects[] }) {
  const dated = releases
    .filter((r) => r.release_date)
    .sort(
      (a, b) =>
        new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime(),
    )

  if (dated.length === 0) return null

  const minDate = new Date(dated[0].release_date!)
  const maxDate = new Date(dated[dated.length - 1].release_date!)
  const rangeMs = maxDate.getTime() - minDate.getTime() || 86_400_000

  const SVG_WIDTH = 800
  const SVG_HEIGHT = 80
  const PADDING = 40

  const dateToX = (d: string) => {
    const t = new Date(d).getTime()
    return PADDING + ((t - minDate.getTime()) / rangeMs) * (SVG_WIDTH - PADDING * 2)
  }

  return (
    <div className="overflow-x-auto mb-6 p-4 bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md]">
      <h3 className="text-sm font-semibold text-text-primary mb-2">Release Timeline</h3>
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ display: 'block' }}>
        {/* Baseline */}
        <line
          x1={PADDING}
          y1={40}
          x2={SVG_WIDTH - PADDING}
          y2={40}
          stroke="var(--color-surface-300, #fde4ba)"
          strokeWidth={2}
        />

        {/* Today marker */}
        {(() => {
          const now = new Date()
          if (now >= minDate && now <= maxDate) {
            const x = dateToX(now.toISOString())
            return (
              <g>
                <line x1={x} y1={20} x2={x} y2={60} stroke="var(--color-primary-500, #f59e0b)" strokeWidth={2} strokeDasharray="3 2" />
                <text x={x} y={16} textAnchor="middle" fontSize={9} fill="var(--color-primary-500, #f59e0b)">
                  Today
                </text>
              </g>
            )
          }
          return null
        })()}

        {/* Release markers */}
        {dated.map((r) => {
          const x = dateToX(r.release_date!)
          const isReleased = r.status === 'released'
          return (
            <g key={r.id}>
              <circle
                cx={x}
                cy={40}
                r={8}
                fill={isReleased ? 'var(--color-success, #22c55e)' : 'var(--color-warning, #f59e0b)'}
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={x}
                y={66}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-text-secondary, #666)"
              >
                {r.name}
              </text>
              <text
                x={x}
                y={26}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-text-tertiary, #999)"
              >
                {formatDate(r.release_date)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Release card                                                       */
/* ------------------------------------------------------------------ */

function ReleaseCard({ release }: { release: ReleaseWithProjects }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-3 rounded-[--radius-md] border border-surface-200 bg-white dark:bg-dark-surface shadow-sm">
      <div className={cn('p-4', expanded && 'pb-2')}>
        <div className="flex items-center gap-3">
          <Rocket className="h-5 w-5 text-text-tertiary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-text-primary">{release.name}</h4>
            {release.description && (
              <p className="text-sm text-text-secondary truncate">{release.description}</p>
            )}
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0',
              STATUS_COLOR[release.status] ?? 'bg-surface-100 text-text-secondary border-surface-200'
            )}
          >
            {release.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-text-secondary min-w-[90px] text-right flex-shrink-0">
            {formatDate(release.release_date)}
          </span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded hover:bg-surface-100 text-text-secondary transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible project list */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[500px]' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-4">
          {release.projects.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No projects linked to this release.
            </p>
          ) : (
            <ul className="space-y-1">
              {release.projects.map((p) => (
                <li key={p.project_id} className="text-sm text-text-primary py-1">
                  {p.project_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ReleasesPage() {
  const { data: releases, isLoading, error } = useReleases(WORKSPACE_ID)
  const createRelease = useCreateRelease()

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'planned',
    release_date: '',
  })

  const sortedReleases = useMemo(() => {
    if (!releases) return []
    return [...releases].sort((a, b) => {
      if (!a.release_date) return 1
      if (!b.release_date) return -1
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    })
  }, [releases])

  const handleCreate = () => {
    createRelease.mutate(
      {
        workspace_id: WORKSPACE_ID,
        name: form.name,
        description: form.description || null,
        status: form.status,
        release_date: form.release_date || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({ name: '', description: '', status: 'planned', release_date: '' })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="skeleton-shimmer h-8 w-48 rounded mb-4" />
        <div className="skeleton-shimmer h-20 w-full rounded-[--radius-md] mb-4" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton-shimmer h-16 w-full rounded-[--radius-sm] mb-2" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm]">
          Failed to load releases: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Releases</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-[--radius-sm] bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[--shadow-sm] hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Release
        </button>
      </div>

      {/* Timeline visualization */}
      {sortedReleases.length > 0 && <ReleaseTimeline releases={sortedReleases} />}

      {/* Empty state */}
      {sortedReleases.length === 0 && (
        <div className="p-12 text-center rounded-[--radius-lg] bg-white dark:bg-dark-surface border border-surface-200">
          <p className="text-text-secondary mb-4">
            No releases yet. Create one to start tracking deliveries.
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-[--radius-sm] border border-primary-500 text-primary-600 px-4 py-2 text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Release
          </button>
        </div>
      )}

      {/* Release list */}
      {sortedReleases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}

      {/* ---- Create Release Dialog ---- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Dialog positioning */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-[--radius-md] bg-white dark:bg-dark-surface shadow-[--shadow-lg] border border-surface-200">
            <DialogTitle className="text-lg font-semibold text-text-primary px-6 pt-6 pb-2">
              Create Release
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
                  placeholder="Release name"
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
                  <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full appearance-none rounded-[--radius-sm] border border-surface-300 bg-white dark:bg-dark-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Release Date</label>
                  <input
                    type="date"
                    value={form.release_date}
                    onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
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
                disabled={!form.name.trim() || createRelease.isPending}
                className={cn(
                  'rounded-[--radius-sm] px-4 py-2 text-sm font-medium text-white shadow-[--shadow-sm] transition-colors',
                  !form.name.trim() || createRelease.isPending
                    ? 'bg-primary-300 cursor-not-allowed'
                    : 'bg-primary-500 hover:bg-primary-600'
                )}
              >
                {createRelease.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
