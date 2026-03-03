import { useEffect, useRef, type FC } from 'react'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import type { Issue } from '@/types/api'
import { configureGantt } from '@/components/gantt/GanttTheme'
import { useUiStore } from '@/stores/uiStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IssueTimelineProps {
  issues: Issue[]
  onTaskUpdate?: (id: string, startDate: string, endDate: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map an Issue to a DHTMLX Gantt task object. */
function issueToGanttTask(issue: Issue) {
  const today = new Date().toISOString().slice(0, 10)
  const startDate = issue.start_date ?? issue.created_at?.slice(0, 10) ?? today
  const endDate = issue.due_date ?? startDate

  // Ensure end >= start; default to start + 7 days if no due date
  let end = new Date(endDate)
  const start = new Date(startDate)
  if (end <= start) {
    end = new Date(start)
    end.setDate(end.getDate() + 7)
  }

  return {
    id: issue.id,
    text: `${issue.issue_key} ${issue.summary}`,
    start_date: start,
    end_date: end,
    progress: (issue.percent_complete ?? 0) / 100,
    priority: issue.priority ?? 'none',
    parent: issue.parent_id ?? 0,
    open: true,
  }
}

function formatGanttDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const IssueTimeline: FC<IssueTimelineProps> = ({ issues, onTaskUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useUiStore((s) => s.themeMode === 'dark')
  const initializedRef = useRef(false)

  // Initialize gantt once
  useEffect(() => {
    if (!containerRef.current) return

    configureGantt(isDark)

    if (!initializedRef.current) {
      gantt.init(containerRef.current)
      initializedRef.current = true
    }

    return () => {
      // Cleanup on unmount
      gantt.clearAll()
      initializedRef.current = false
    }
    // We intentionally only run this on mount/unmount and isDark change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark])

  // Parse task data whenever issues change
  useEffect(() => {
    if (!initializedRef.current) return

    const tasks = issues.map(issueToGanttTask)
    // Build links from parent relationships (not scheduling links)
    const links: { id: string; source: string; target: string; type: string }[] = []

    gantt.clearAll()
    gantt.parse({ data: tasks, links })
  }, [issues])

  // Attach drag-end event for date updates
  useEffect(() => {
    if (!onTaskUpdate) return

    const eventId = gantt.attachEvent(
      'onAfterTaskDrag',
      (id: string | number, _mode: unknown, _e: unknown) => {
        const task = gantt.getTask(id)
        const startStr = formatGanttDate(task.start_date as Date)
        const endStr = formatGanttDate(task.end_date as Date)
        onTaskUpdate(String(id), startStr, endStr)
      },
    )

    return () => {
      gantt.detachEvent(eventId)
    }
  }, [onTaskUpdate])

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] [&_.gantt_container]:rounded-[--radius-sm] [&_.gantt_container]:border [&_.gantt_container]:border-surface-200"
    />
  )
}

export default IssueTimeline
