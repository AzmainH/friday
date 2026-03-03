import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import RoadmapGantt from '@/components/roadmap/RoadmapGantt'
import ScenarioPanel from '@/components/roadmap/ScenarioPanel'
import {
  useRoadmapDetail,
  useRoadmapTimeline,
  useAddProjectToRoadmap,
} from '@/hooks/useRoadmap'
import type { RoadmapScenario } from '@/hooks/useRoadmap'
import { formatDate } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RoadmapDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const { data: plan, isLoading: planLoading, error: planError } = useRoadmapDetail(planId)
  const { data: timeline, isLoading: timelineLoading } = useRoadmapTimeline(planId)
  const addProject = useAddProjectToRoadmap()

  // Sidebar state
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(true)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)

  // Filter state
  const [filterProjectId, setFilterProjectId] = useState<string>('all')

  // Add project dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newProjectId, setNewProjectId] = useState('')

  // Mock scenarios until backend wires up scenario endpoints
  const scenarios: RoadmapScenario[] = useMemo(
    () => [
      {
        id: 'baseline',
        plan_id: planId ?? '',
        name: 'Baseline',
        is_baseline: true,
        overrides: [],
        created_at: new Date().toISOString(),
      },
    ],
    [planId],
  )

  const filteredTimeline = useMemo(() => {
    if (!timeline) return []
    if (filterProjectId === 'all') return timeline.projects
    return timeline.projects.filter((p) => p.id === filterProjectId)
  }, [timeline, filterProjectId])

  const handleAddProject = () => {
    if (planId && newProjectId.trim()) {
      addProject.mutate({ plan_id: planId, project_id: newProjectId.trim() })
    }
    setNewProjectId('')
    setAddDialogOpen(false)
  }

  /* ---- Loading / Error states ---- */
  if (planLoading || timelineLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  if (planError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-[--radius-sm] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load roadmap: {planError.message}
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-[--radius-sm] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Roadmap not found.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 px-3 py-2">
          <div className="min-w-[200px] flex-1">
            <h2 className="text-xl font-bold text-text-primary">
              {plan.name}
            </h2>
            <p className="text-sm text-text-secondary">
              {formatDate(plan.start_date)} &mdash; {formatDate(plan.end_date)}
              {plan.description && ` | ${plan.description}`}
            </p>
          </div>

          {/* Project count chip */}
          <span className="rounded-full border border-surface-200 px-2 py-0.5 text-xs text-text-secondary">
            {timeline?.projects.length ?? 0} projects
          </span>

          {/* Filter by project */}
          <div className="relative flex min-w-[180px] items-center">
            <Filter className="pointer-events-none absolute left-2 h-4 w-4 text-text-secondary" />
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className={cn(
                'w-full appearance-none rounded-[--radius-sm] border border-surface-200 bg-white py-1.5 pl-8 pr-8 text-sm',
                'text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                'dark:bg-surface-50'
              )}
            >
              <option value="all">All Projects</option>
              {(timeline?.projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add project button */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddDialogOpen(true)}
            className="border border-surface-200"
          >
            Add Project
          </Button>

          {/* Toggle scenario panel */}
          <button
            type="button"
            onClick={() => setScenarioPanelOpen((o) => !o)}
            aria-label={scenarioPanelOpen ? 'Close scenarios' : 'Open scenarios'}
            className="rounded-[--radius-sm] p-1.5 text-text-secondary hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {scenarioPanelOpen ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Gantt chart */}
        <div className="flex-1 overflow-auto p-2">
          <RoadmapGantt timelineData={filteredTimeline} />
        </div>
      </div>

      {/* Collapsible right sidebar */}
      {scenarioPanelOpen && (
        <ScenarioPanel
          planId={planId ?? ''}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
        />
      )}

      {/* ---- Add Project Dialog ---- */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Project to Roadmap"
        size="sm"
      >
        <div>
          <label htmlFor="project-id-input" className="mb-1 block text-sm font-medium text-text-primary">
            Project ID
          </label>
          <input
            id="project-id-input"
            type="text"
            autoFocus
            placeholder="Enter a project ID"
            value={newProjectId}
            onChange={(e) => setNewProjectId(e.target.value)}
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 px-3 py-2 text-sm',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            )}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddProject}
            disabled={!newProjectId.trim() || addProject.isPending}
            loading={addProject.isPending}
          >
            {addProject.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
