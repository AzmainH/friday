import { useState } from 'react'
import { Check, X, CheckCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TaskMatch } from '@/hooks/useNLStatusParser'

interface ParsedUpdateReviewProps {
  matches: TaskMatch[]
  onConfirm: (confirmed: TaskMatch[]) => void
  onRejectAll: () => void
  isConfirming: boolean
}

function ConfidenceBadge({ score }: { score: number }) {
  const label = `${Math.round(score * 100)}%`

  if (score >= 0.8) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400">
        {label}
      </span>
    )
  }
  if (score >= 0.5) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/15 text-yellow-400">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400">
      {label}
    </span>
  )
}

export default function ParsedUpdateReview({
  matches,
  onConfirm,
  onRejectAll,
  isConfirming,
}: ParsedUpdateReviewProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const match of matches) {
      initial[match.task_id] = true
    }
    return initial
  })

  const toggleMatch = (taskId: string) => {
    setSelected((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const confirmAll = () => {
    const update: Record<string, boolean> = {}
    for (const match of matches) {
      update[match.task_id] = true
    }
    setSelected(update)
  }

  const rejectAll = () => {
    const update: Record<string, boolean> = {}
    for (const match of matches) {
      update[match.task_id] = false
    }
    setSelected(update)
  }

  const handleConfirm = () => {
    const confirmed = matches.filter((m) => selected[m.task_id])
    if (confirmed.length === 0) return
    onConfirm(confirmed)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {selectedCount} of {matches.length} matches selected
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={confirmAll}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/10 transition-colors"
          >
            <CheckCheck size={14} />
            Select All
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <XCircle size={14} />
            Deselect All
          </button>
        </div>
      </div>

      {/* Matches table */}
      <div className="overflow-x-auto rounded-lg border border-surface-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-100 dark:bg-surface-200">
              <th className="px-3 py-2 text-left font-medium text-text-secondary w-8" />
              <th className="px-3 py-2 text-left font-medium text-text-secondary">Task</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">Matched Text</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">Status</th>
              <th className="px-3 py-2 text-center font-medium text-text-secondary">%</th>
              <th className="px-3 py-2 text-center font-medium text-text-secondary">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const isSelected = selected[match.task_id] ?? false
              return (
                <tr
                  key={match.task_id}
                  className={cn(
                    'border-b border-surface-200 last:border-b-0 transition-colors',
                    isSelected
                      ? 'bg-primary-500/5'
                      : 'bg-transparent opacity-60',
                  )}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleMatch(match.task_id)}
                      className={cn(
                        'flex items-center justify-center w-5 h-5 rounded border transition-colors',
                        isSelected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-surface-300 text-transparent hover:border-primary-400',
                      )}
                    >
                      <Check size={12} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-text-primary font-medium">
                    {match.task_summary}
                  </td>
                  <td className="px-3 py-2 text-text-secondary italic">
                    &ldquo;{match.matched_text}&rdquo;
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {match.status ?? '--'}
                  </td>
                  <td className="px-3 py-2 text-center text-text-primary">
                    {match.percent_complete != null ? `${match.percent_complete}%` : '--'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <ConfidenceBadge score={match.confidence_score} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Blockers summary */}
      {matches.some((m) => m.blockers.length > 0) && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <p className="text-xs font-medium text-yellow-400 mb-1">Blockers Detected</p>
          <ul className="text-xs text-text-secondary space-y-0.5">
            {matches
              .filter((m) => m.blockers.length > 0)
              .map((m) =>
                m.blockers.map((b, i) => (
                  <li key={`${m.task_id}-${i}`}>
                    <span className="text-text-primary">{m.task_summary}:</span> {b}
                  </li>
                )),
              )}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRejectAll}
          disabled={isConfirming}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
            'border border-surface-200 text-text-secondary',
            'hover:bg-surface-100 transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <X size={16} />
          Discard
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedCount === 0 || isConfirming}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
            'bg-primary-600 text-white hover:bg-primary-700 transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Check size={16} />
          {isConfirming ? 'Applying...' : `Confirm ${selectedCount} Update${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
