import { useState } from 'react'
import { Plus, Star, Pencil } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { RoadmapScenario, ScenarioOverride } from '@/hooks/useRoadmap'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScenarioPanelProps {
  planId: string
  scenarios: RoadmapScenario[]
  selectedScenarioId?: string | null
  onSelectScenario?: (scenarioId: string) => void
  onCreateScenario?: (name: string) => void
  onUpdateOverride?: (scenarioId: string, override: ScenarioOverride) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScenarioPanel({
  planId: _planId,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onCreateScenario,
  onUpdateOverride,
}: ScenarioPanelProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [editingOverride, setEditingOverride] = useState<{
    scenarioId: string
    override: ScenarioOverride
  } | null>(null)

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ??
    scenarios.find((s) => s.is_baseline) ??
    scenarios[0]

  const handleCreate = () => {
    if (newScenarioName.trim() && onCreateScenario) {
      onCreateScenario(newScenarioName.trim())
    }
    setNewScenarioName('')
    setCreateDialogOpen(false)
  }

  const handleSaveOverride = () => {
    if (editingOverride && onUpdateOverride) {
      onUpdateOverride(editingOverride.scenarioId, editingOverride.override)
    }
    setEditingOverride(null)
  }

  return (
    <div className="flex h-full w-[340px] flex-col overflow-hidden border-l border-surface-200 bg-white dark:bg-surface-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-200 px-2 py-1.5">
        <h3 className="text-sm font-semibold text-text-primary">Scenarios</h3>
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          aria-label="New scenario"
          className="rounded-[--radius-sm] p-1.5 text-text-secondary hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Scenario list */}
      <div className="max-h-[220px] flex-shrink-0 overflow-y-auto">
        {scenarios.length === 0 && (
          <div className="px-2 py-2">
            <p className="text-sm text-text-secondary">
              No scenarios created yet.
            </p>
          </div>
        )}
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelectScenario?.(scenario.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm cursor-pointer',
              'hover:bg-surface-100',
              activeScenario?.id === scenario.id && 'bg-surface-100 font-medium'
            )}
          >
            <span className="flex-shrink-0">
              {scenario.is_baseline ? (
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              ) : (
                <Star className="h-4 w-4 text-text-tertiary" />
              )}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-text-primary">{scenario.name}</span>
              {scenario.is_baseline && (
                <span className="inline-block w-fit rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                  Baseline
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <hr className="border-surface-200" />

      {/* Overrides for active scenario */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-primary">
          Overrides
          {activeScenario && (
            <span className="ml-1 text-xs font-normal normal-case text-text-secondary">
              ({activeScenario.name})
            </span>
          )}
        </h4>

        {activeScenario && activeScenario.overrides.length === 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            No date or assignee overrides in this scenario.
          </p>
        )}

        {activeScenario && activeScenario.overrides.length > 0 && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="py-1.5 pr-2 font-semibold text-text-primary">Issue</th>
                <th className="py-1.5 pr-2 font-semibold text-text-primary">Start</th>
                <th className="py-1.5 pr-2 font-semibold text-text-primary">Due</th>
                <th className="w-8 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {activeScenario.overrides.map((ov) => (
                <tr key={ov.issue_id} className="border-b border-surface-100">
                  <td className="py-1.5 pr-2 text-text-primary">{ov.issue_id.slice(0, 8)}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{ov.start_date ?? '---'}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{ov.due_date ?? '---'}</td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOverride({ scenarioId: activeScenario.id, override: { ...ov } })
                      }
                      className="rounded p-1 text-text-secondary hover:bg-surface-100 hover:text-text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---- Create Scenario Dialog ---- */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create Scenario"
        size="sm"
      >
        <div>
          <label htmlFor="scenario-name-input" className="mb-1 block text-sm font-medium text-text-primary">
            Scenario Name
          </label>
          <input
            id="scenario-name-input"
            type="text"
            autoFocus
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            className={cn(
              'w-full rounded-[--radius-sm] border border-surface-200 px-3 py-2 text-sm',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
            )}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate} disabled={!newScenarioName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ---- Edit Override Dialog ---- */}
      <Dialog
        open={editingOverride !== null}
        onClose={() => setEditingOverride(null)}
        title="Edit Override"
        size="sm"
      >
        {editingOverride && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="override-start-date" className="mb-1 block text-sm font-medium text-text-primary">
                Start Date
              </label>
              <input
                id="override-start-date"
                type="date"
                value={editingOverride.override.start_date ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      start_date: e.target.value || null,
                    },
                  })
                }
                className={cn(
                  'w-full rounded-[--radius-sm] border border-surface-200 px-3 py-2 text-sm',
                  'text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                )}
              />
            </div>
            <div>
              <label htmlFor="override-due-date" className="mb-1 block text-sm font-medium text-text-primary">
                Due Date
              </label>
              <input
                id="override-due-date"
                type="date"
                value={editingOverride.override.due_date ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      due_date: e.target.value || null,
                    },
                  })
                }
                className={cn(
                  'w-full rounded-[--radius-sm] border border-surface-200 px-3 py-2 text-sm',
                  'text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                )}
              />
            </div>
            <div>
              <label htmlFor="override-assignee-id" className="mb-1 block text-sm font-medium text-text-primary">
                Assignee ID (override)
              </label>
              <input
                id="override-assignee-id"
                type="text"
                value={editingOverride.override.assignee_id ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      assignee_id: e.target.value || null,
                    },
                  })
                }
                className={cn(
                  'w-full rounded-[--radius-sm] border border-surface-200 px-3 py-2 text-sm',
                  'text-text-primary placeholder:text-text-tertiary',
                  'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                )}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setEditingOverride(null)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveOverride}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
