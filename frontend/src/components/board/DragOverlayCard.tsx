import type { Issue } from '@/types/api'
import { PRIORITY_COLORS, truncate } from '@/utils/formatters'

interface DragOverlayCardProps {
  issue: Issue
}

/**
 * Rendered inside <DragOverlay> while an issue card is being dragged.
 * Same layout as BoardCard but with elevated shadow and slight rotation
 * to give a "lifted" visual cue.
 */
export default function DragOverlayCard({ issue }: DragOverlayCardProps) {
  const priorityColor = PRIORITY_COLORS[issue.priority] ?? PRIORITY_COLORS.none

  return (
    <div className="cursor-grabbing w-[260px] rotate-3 shadow-xl border-2 border-primary-500 rounded-[--radius-md] bg-white dark:bg-surface-100 p-3">
      {/* Top row: issue key chip */}
      <div className="flex items-center mb-1.5">
        <span className="inline-flex px-1.5 py-0.5 text-[11px] font-semibold bg-surface-100 text-text-secondary rounded">
          {issue.issue_key}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm font-medium text-text-primary leading-snug mb-2 break-words">
        {truncate(issue.summary, 80)}
      </p>

      {/* Bottom row: priority dot + assignee avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor }}
          />
          <span className="text-xs text-text-secondary capitalize">
            {issue.priority}
          </span>
        </div>

        {issue.assignee ? (
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[11px] font-semibold flex items-center justify-center shrink-0 overflow-hidden">
            {issue.assignee.avatar_url ? (
              <img
                src={issue.assignee.avatar_url}
                alt={issue.assignee.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              issue.assignee.display_name.charAt(0).toUpperCase()
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-surface-200 text-text-tertiary text-[11px] flex items-center justify-center">
            ?
          </div>
        )}
      </div>
    </div>
  )
}
