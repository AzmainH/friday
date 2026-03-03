/**
 * DHTMLX Gantt theme configuration.
 *
 * Applies visual settings, column definitions, date formatting,
 * and dark/light colour schemes to the global `gantt` instance.
 */
import { gantt } from 'dhtmlx-gantt'
import { PRIORITY_COLORS } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Light / Dark palettes
// ---------------------------------------------------------------------------

interface GanttPalette {
  bg: string
  taskBg: string
  taskProgress: string
  taskText: string
  gridHeaderBg: string
  gridHeaderText: string
  gridBorder: string
  todayHighlight: string
  linkColor: string
}

const LIGHT_PALETTE: GanttPalette = {
  bg: '#FAFAF9',             // surface-50
  taskBg: '#B2DFDB',         // primary-100
  taskProgress: '#009688',   // primary-500
  taskText: '#1A1A1A',       // text-primary
  gridHeaderBg: '#F5F5F3',   // surface-100
  gridHeaderText: '#6B6B6B', // text-secondary
  gridBorder: '#EBEBEA',     // surface-200
  todayHighlight: 'rgba(0, 150, 136, 0.08)', // phthalo with alpha
  linkColor: '#009688',      // primary-500
}

const DARK_PALETTE: GanttPalette = {
  bg: '#0F1110',             // dark-bg
  taskBg: '#252826',         // dark surface
  taskProgress: '#009688',   // primary-500
  taskText: '#F2F2F0',       // light text
  gridHeaderBg: '#1A1C1B',   // dark-surface
  gridHeaderText: '#9E9E9E', // text-secondary
  gridBorder: '#252826',     // dark-border
  todayHighlight: 'rgba(0, 150, 136, 0.08)',
  linkColor: '#26A69A',      // primary-400
}

// ---------------------------------------------------------------------------
// configureGantt
// ---------------------------------------------------------------------------

export function configureGantt(isDark: boolean): void {
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE

  // ---- General config ----
  gantt.config.date_format = '%Y-%m-%d %H:%i'
  gantt.config.scale_unit = 'week'
  gantt.config.step = 1
  gantt.config.row_height = 36
  gantt.config.min_column_width = 50
  gantt.config.fit_tasks = true
  gantt.config.auto_scheduling = false
  gantt.config.drag_resize = true
  gantt.config.drag_move = true
  gantt.config.drag_progress = false
  gantt.config.readonly = false
  gantt.config.open_tree_initially = true

  // ---- Scales ----
  gantt.config.scales = [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'week', step: 1, format: 'Week #%W' },
  ]

  // ---- Grid columns ----
  gantt.config.columns = [
    {
      name: 'text',
      label: 'Issue',
      tree: true,
      width: 280,
      resize: true,
    },
    {
      name: 'start_date',
      label: 'Start',
      align: 'center' as const,
      width: 90,
    },
    {
      name: 'end_date',
      label: 'End',
      align: 'center' as const,
      width: 90,
    },
    {
      name: 'priority',
      label: 'Priority',
      align: 'center' as const,
      width: 70,
      template(task: Record<string, unknown>) {
        const p = (task.priority as string) ?? 'none'
        const color = PRIORITY_COLORS[p] ?? PRIORITY_COLORS.none
        return `<span style="color:${color};font-weight:600;text-transform:capitalize">${p}</span>`
      },
    },
  ]

  // ---- Templates ----

  // Assign CSS class based on priority for colour-coded bars
  gantt.templates.task_class = function (
    _start: Date,
    _end: Date,
    task: Record<string, unknown>,
  ): string {
    const priority = (task.priority as string) ?? 'none'
    return `gantt-priority-${priority}`
  }

  // Tooltip
  gantt.templates.tooltip_text = function (
    start: Date,
    end: Date,
    task: Record<string, unknown>,
  ): string {
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    return `<b>${task.text as string}</b><br/>
      ${fmt(start)} &ndash; ${fmt(end)}<br/>
      Priority: <strong>${(task.priority as string) ?? 'none'}</strong><br/>
      Progress: ${Math.round(((task.progress as number) ?? 0) * 100)}%`
  }

  // ---- Inject palette via CSS variables ----
  const styleId = 'friday-gantt-theme'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = `
    .gantt_container {
      background: ${palette.bg};
      border-color: ${palette.gridBorder};
    }
    .gantt_grid_head_cell {
      background: ${palette.gridHeaderBg} !important;
      color: ${palette.gridHeaderText} !important;
    }
    .gantt_cell, .gantt_row {
      border-color: ${palette.gridBorder} !important;
    }
    .gantt_task_line {
      background: ${palette.taskBg};
      color: ${palette.taskText};
      border-radius: 6px;
    }
    .gantt_task_progress {
      background: ${palette.taskProgress};
      border-radius: 6px;
    }
    .gantt_task_line.gantt-priority-critical {
      background: ${PRIORITY_COLORS.critical};
      color: #fff;
    }
    .gantt_task_line.gantt-priority-high {
      background: ${PRIORITY_COLORS.high};
      color: #fff;
    }
    .gantt_task_line.gantt-priority-medium {
      background: ${PRIORITY_COLORS.medium};
      color: #fff;
    }
    .gantt_task_line.gantt-priority-low {
      background: ${PRIORITY_COLORS.low};
      color: #fff;
    }
    .gantt_task_line.gantt-priority-none {
      background: ${palette.taskBg};
      color: ${palette.taskText};
    }
    .gantt_marker.gantt_today_marker {
      background: ${palette.todayHighlight};
    }
    .gantt_link_line_right,
    .gantt_link_line_left,
    .gantt_link_line_up,
    .gantt_link_line_down {
      background: ${palette.linkColor};
    }
    .gantt_link_arrow_right,
    .gantt_link_arrow_left {
      border-color: ${palette.linkColor};
    }
  `
}
