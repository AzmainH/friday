import { useState, useCallback } from 'react'
import { ChevronDown, Pencil, Save, X, Link } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { useUpdateDecision } from '@/hooks/useDecisions'
import type { DecisionDetail as DecisionDetailType } from '@/hooks/useDecisions'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DECISION_STATUSES = ['proposed', 'accepted', 'rejected', 'deferred', 'superseded'] as const

const STATUS_CHIP_CLASSES: Record<string, string> = {
  proposed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  deferred: 'bg-amber-100 text-amber-700',
  superseded: 'bg-gray-100 text-gray-600',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DecisionDetailProps {
  decision: DecisionDetailType
  onLinkIssue?: (decisionId: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DecisionDetail({ decision, onLinkIssue }: DecisionDetailProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: decision.title,
    description: decision.description ?? '',
    status: decision.status,
    outcome: decision.outcome ?? '',
    rationale: decision.rationale ?? '',
  })

  const updateDecision = useUpdateDecision()

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleEditStart = useCallback(() => {
    setDraft({
      title: decision.title,
      description: decision.description ?? '',
      status: decision.status,
      outcome: decision.outcome ?? '',
      rationale: decision.rationale ?? '',
    })
    setEditing(true)
    setExpanded(true)
  }, [decision])

  const handleEditCancel = useCallback(() => {
    setEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    await updateDecision.mutateAsync({
      id: decision.id,
      body: {
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        outcome: draft.outcome || null,
        rationale: draft.rationale || null,
      },
    })
    setEditing(false)
  }, [updateDecision, decision.id, draft])

  return (
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-3">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            className="p-1 rounded hover:bg-surface-100 transition-colors"
          >
            <ChevronDown
              className={cn(
                'h-5 w-5 text-text-secondary transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>

          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="flex-1 border-b border-surface-300 bg-transparent px-1 py-0.5 text-sm font-semibold text-text-primary focus:outline-none focus:border-primary-500"
            />
          ) : (
            <span
              className="flex-1 text-sm font-semibold text-text-primary cursor-pointer"
              onClick={handleToggle}
            >
              {decision.title}
            </span>
          )}

          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              STATUS_CHIP_CLASSES[decision.status] ?? 'bg-gray-100 text-gray-600',
            )}
          >
            {decision.status}
          </span>

          {!editing && (
            <button
              type="button"
              onClick={handleEditStart}
              className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {decision.decided_date && !expanded && (
          <p className="text-xs text-text-secondary ml-8">
            Decided {formatDate(decision.decided_date)}
          </p>
        )}
      </div>

      {/* Collapsible body */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[2000px]' : 'max-h-0',
        )}
      >
        <div className="px-4 pb-4">
          <hr className="border-surface-200 mb-4" />

          {editing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                >
                  {DECISION_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Outcome</label>
                <textarea
                  rows={2}
                  value={draft.outcome}
                  onChange={(e) => setDraft((d) => ({ ...d, outcome: e.target.value }))}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Rationale</label>
                <textarea
                  rows={2}
                  value={draft.rationale}
                  onChange={(e) => setDraft((d) => ({ ...d, rationale: e.target.value }))}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {decision.description && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary">Description</p>
                  <p className="text-sm text-text-primary">{decision.description}</p>
                </div>
              )}

              {decision.outcome && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary">Outcome</p>
                  <p className="text-sm text-text-primary">{decision.outcome}</p>
                </div>
              )}

              {decision.rationale && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary">Rationale</p>
                  <p className="text-sm text-text-primary">{decision.rationale}</p>
                </div>
              )}

              {decision.decided_date && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary">Decided Date</p>
                  <p className="text-sm text-text-primary">{formatDate(decision.decided_date)}</p>
                </div>
              )}

              {decision.linked_issue_ids.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary">Linked Issues</p>
                  <p className="text-sm text-text-primary">
                    {decision.linked_issue_ids.length} issue(s) linked
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-200">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={handleEditCancel}>
                  Cancel
                </Button>
                <Button size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} disabled={updateDecision.isPending}>
                  Save
                </Button>
              </>
            ) : (
              <>
                {onLinkIssue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Link className="h-4 w-4" />}
                    onClick={() => onLinkIssue(decision.id)}
                  >
                    Link Issue
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
