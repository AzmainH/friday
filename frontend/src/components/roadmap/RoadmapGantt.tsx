import { useMemo, useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import { RAG_COLORS } from '@/utils/formatters'
import type {
  RoadmapTimelineProject,
  RoadmapTimelineIssue,
  RoadmapTimelineMilestone,
} from '@/hooks/useRoadmap'

/* ------------------------------------------------------------------ */
/*  Props & constants                                                  */
/* ------------------------------------------------------------------ */

export interface RoadmapGanttProps {
  timelineData: RoadmapTimelineProject[]
}

const ROW_HEIGHT = 32
const HEADER_HEIGHT = 48
const SWIMLANE_HEADER = 36
const LEFT_LABEL_WIDTH = 220
const MIN_DAY_WIDTH = 2
const MAX_DAY_WIDTH = 40
const MILESTONE_SIZE = 12
const BAR_HEIGHT = 18
const BAR_RADIUS = 4

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function computeTimeRange(projects: RoadmapTimelineProject[]) {
  let min = Infinity
  let max = -Infinity

  const push = (d: string | null | undefined) => {
    const dt = toDate(d)
    if (!dt) return
    const t = dt.getTime()
    if (t < min) min = t
    if (t > max) max = t
  }

  for (const p of projects) {
    push(p.start_date)
    push(p.target_date)
    for (const i of p.issues) {
      push(i.start_date)
      push(i.due_date)
    }
    for (const m of p.milestones) {
      push(m.due_date)
    }
  }

  if (!isFinite(min) || !isFinite(max)) {
    const now = new Date()
    min = now.getTime()
    max = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).getTime()
  }

  // Add 7-day padding on each side
  const padMs = 7 * 86_400_000
  return { start: new Date(min - padMs), end: new Date(max + padMs) }
}

function monthLabels(start: Date, end: Date) {
  const labels: { label: string; offsetDays: number; spanDays: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    const monthStart = new Date(Math.max(cursor.getTime(), start.getTime()))
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const monthEnd = new Date(Math.min(nextMonth.getTime() - 86_400_000, end.getTime()))
    labels.push({
      label: cursor.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      offsetDays: daysBetween(start, monthStart),
      spanDays: daysBetween(monthStart, monthEnd) + 1,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return labels
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RoadmapGantt({ timelineData }: RoadmapGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dayWidth, setDayWidth] = useState(8)

  const handleZoomIn = useCallback(
    () => setDayWidth((w) => Math.min(w * 1.5, MAX_DAY_WIDTH)),
    [],
  )
  const handleZoomOut = useCallback(
    () => setDayWidth((w) => Math.max(w / 1.5, MIN_DAY_WIDTH)),
    [],
  )

  const { start, end } = useMemo(() => computeTimeRange(timelineData), [timelineData])
  const totalDays = daysBetween(start, end) + 1
  const chartWidth = totalDays * dayWidth
  const months = useMemo(() => monthLabels(start, end), [start, end])

  // Build flat row list: swimlane header, then issues, then milestones
  const rows = useMemo(() => {
    const result: {
      type: 'swimlane' | 'issue' | 'milestone'
      project: RoadmapTimelineProject
      issue?: RoadmapTimelineIssue
      milestone?: RoadmapTimelineMilestone
    }[] = []
    for (const project of timelineData) {
      result.push({ type: 'swimlane', project })
      for (const issue of project.issues) {
        result.push({ type: 'issue', project, issue })
      }
      for (const milestone of project.milestones) {
        result.push({ type: 'milestone', project, milestone })
      }
    }
    return result
  }, [timelineData])

  const totalHeight =
    HEADER_HEIGHT +
    rows.reduce((acc, r) => acc + (r.type === 'swimlane' ? SWIMLANE_HEADER : ROW_HEIGHT), 0)

  // Helper to convert a date to X
  const dateToX = (d: Date) => daysBetween(start, d) * dayWidth

  // Today marker
  const todayX = dateToX(new Date())

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Zoom controls */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 0.5 }}>
        <IconButton size="small" onClick={handleZoomOut} aria-label="Zoom out">
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleZoomIn} aria-label="Zoom in">
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: 600,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <svg
          width={LEFT_LABEL_WIDTH + chartWidth}
          height={totalHeight}
          style={{ display: 'block' }}
        >
          {/* ---- Header: month labels ---- */}
          <g>
            <rect
              x={0}
              y={0}
              width={LEFT_LABEL_WIDTH + chartWidth}
              height={HEADER_HEIGHT}
              fill="var(--mui-palette-action-hover, #f5f5f5)"
            />
            {months.map((m, i) => (
              <text
                key={i}
                x={LEFT_LABEL_WIDTH + m.offsetDays * dayWidth + (m.spanDays * dayWidth) / 2}
                y={HEADER_HEIGHT / 2 + 5}
                textAnchor="middle"
                fontSize={12}
                fill="var(--mui-palette-text-secondary, #666)"
              >
                {m.label}
              </text>
            ))}
            {/* Month divider lines */}
            {months.map((m, i) => (
              <line
                key={`ml-${i}`}
                x1={LEFT_LABEL_WIDTH + m.offsetDays * dayWidth}
                y1={0}
                x2={LEFT_LABEL_WIDTH + m.offsetDays * dayWidth}
                y2={totalHeight}
                stroke="var(--mui-palette-divider, #e0e0e0)"
                strokeWidth={1}
              />
            ))}
          </g>

          {/* ---- Today marker ---- */}
          {todayX >= 0 && todayX <= chartWidth && (
            <line
              x1={LEFT_LABEL_WIDTH + todayX}
              y1={0}
              x2={LEFT_LABEL_WIDTH + todayX}
              y2={totalHeight}
              stroke="#1976d2"
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}

          {/* ---- Rows ---- */}
          {(() => {
            let y = HEADER_HEIGHT
            return rows.map((row, idx) => {
              const currentY = y
              if (row.type === 'swimlane') {
                y += SWIMLANE_HEADER
                const ragColor = RAG_COLORS[row.project.rag_status] ?? RAG_COLORS.none
                const projStart = toDate(row.project.start_date)
                const projEnd = toDate(row.project.target_date)
                return (
                  <g key={`sw-${idx}`}>
                    {/* Swimlane background */}
                    <rect
                      x={0}
                      y={currentY}
                      width={LEFT_LABEL_WIDTH + chartWidth}
                      height={SWIMLANE_HEADER}
                      fill="var(--mui-palette-action-selected, #ebebeb)"
                    />
                    {/* RAG dot */}
                    <circle cx={14} cy={currentY + SWIMLANE_HEADER / 2} r={5} fill={ragColor} />
                    {/* Project name */}
                    <text
                      x={26}
                      y={currentY + SWIMLANE_HEADER / 2 + 4}
                      fontSize={13}
                      fontWeight={600}
                      fill="var(--mui-palette-text-primary, #212121)"
                    >
                      {row.project.name}
                    </text>
                    {/* Project bar */}
                    {projStart && projEnd && (
                      <rect
                        x={LEFT_LABEL_WIDTH + dateToX(projStart)}
                        y={currentY + (SWIMLANE_HEADER - BAR_HEIGHT) / 2}
                        width={Math.max(daysBetween(projStart, projEnd) * dayWidth, 4)}
                        height={BAR_HEIGHT}
                        rx={BAR_RADIUS}
                        fill={ragColor}
                        opacity={0.25}
                      />
                    )}
                  </g>
                )
              }

              if (row.type === 'issue' && row.issue) {
                y += ROW_HEIGHT
                const issue = row.issue
                const iStart = toDate(issue.start_date)
                const iEnd = toDate(issue.due_date)
                return (
                  <g key={`is-${idx}`}>
                    {/* Alternating row bg */}
                    {idx % 2 === 0 && (
                      <rect
                        x={0}
                        y={currentY}
                        width={LEFT_LABEL_WIDTH + chartWidth}
                        height={ROW_HEIGHT}
                        fill="var(--mui-palette-action-hover, rgba(0,0,0,0.02))"
                      />
                    )}
                    {/* Issue label */}
                    <text
                      x={24}
                      y={currentY + ROW_HEIGHT / 2 + 4}
                      fontSize={12}
                      fill="var(--mui-palette-text-secondary, #555)"
                    >
                      {issue.issue_key}
                    </text>
                    <text
                      x={90}
                      y={currentY + ROW_HEIGHT / 2 + 4}
                      fontSize={12}
                      fill="var(--mui-palette-text-primary, #333)"
                      clipPath={`inset(0 0 0 0)`}
                    >
                      {issue.summary.length > 20
                        ? issue.summary.slice(0, 19) + '\u2026'
                        : issue.summary}
                    </text>
                    {/* Issue bar */}
                    {iStart && iEnd && (
                      <Tooltip
                        title={`${issue.issue_key}: ${issue.summary} (${issue.percent_complete}%)`}
                        key={`tt-${idx}`}
                      >
                        <g>
                          {/* Background bar */}
                          <rect
                            x={LEFT_LABEL_WIDTH + dateToX(iStart)}
                            y={currentY + (ROW_HEIGHT - BAR_HEIGHT) / 2}
                            width={Math.max(daysBetween(iStart, iEnd) * dayWidth, 4)}
                            height={BAR_HEIGHT}
                            rx={BAR_RADIUS}
                            fill="#90caf9"
                          />
                          {/* Progress fill */}
                          {issue.percent_complete > 0 && (
                            <rect
                              x={LEFT_LABEL_WIDTH + dateToX(iStart)}
                              y={currentY + (ROW_HEIGHT - BAR_HEIGHT) / 2}
                              width={Math.max(
                                (daysBetween(iStart, iEnd) * dayWidth * issue.percent_complete) /
                                  100,
                                2,
                              )}
                              height={BAR_HEIGHT}
                              rx={BAR_RADIUS}
                              fill="#1976d2"
                            />
                          )}
                        </g>
                      </Tooltip>
                    )}
                  </g>
                )
              }

              if (row.type === 'milestone' && row.milestone) {
                y += ROW_HEIGHT
                const ms = row.milestone
                const mDate = toDate(ms.due_date)
                return (
                  <g key={`ms-${idx}`}>
                    {/* Label */}
                    <text
                      x={24}
                      y={currentY + ROW_HEIGHT / 2 + 4}
                      fontSize={12}
                      fontStyle="italic"
                      fill="var(--mui-palette-warning-main, #ed6c02)"
                    >
                      {ms.name}
                    </text>
                    {/* Diamond marker */}
                    {mDate && (
                      <Tooltip title={`Milestone: ${ms.name}`}>
                        <polygon
                          points={`
                            ${LEFT_LABEL_WIDTH + dateToX(mDate)},${currentY + ROW_HEIGHT / 2 - MILESTONE_SIZE / 2}
                            ${LEFT_LABEL_WIDTH + dateToX(mDate) + MILESTONE_SIZE / 2},${currentY + ROW_HEIGHT / 2}
                            ${LEFT_LABEL_WIDTH + dateToX(mDate)},${currentY + ROW_HEIGHT / 2 + MILESTONE_SIZE / 2}
                            ${LEFT_LABEL_WIDTH + dateToX(mDate) - MILESTONE_SIZE / 2},${currentY + ROW_HEIGHT / 2}
                          `}
                          fill="#ed6c02"
                        />
                      </Tooltip>
                    )}
                  </g>
                )
              }

              return null
            })
          })()}
        </svg>
      </Box>

      {/* Empty state */}
      {timelineData.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No projects added to this roadmap yet.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
