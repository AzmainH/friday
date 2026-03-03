/**
 * JS-accessible theme constants for libraries that can't use CSS variables
 * (Recharts, dhtmlx-gantt, etc.)
 */

export const colors = {
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
  },
  surface: {
    50: '#fffbf5',
    100: '#fef7ed',
    200: '#fef0db',
    300: '#fde4ba',
  },
  text: {
    primary: '#1c1917',
    secondary: '#78716c',
    tertiary: '#a8a29e',
  },
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const

export const darkColors = {
  surface: {
    50: '#1c1917',
    100: '#292524',
    200: '#44403c',
    300: '#57534e',
  },
  text: {
    primary: '#fafaf9',
    secondary: '#a8a29e',
    tertiary: '#78716c',
  },
} as const

/** Priority colors — used in Recharts tooltips, Gantt task bars, etc. */
export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
  none: '#a8a29e',
}

/** RAG status colors */
export const RAG_COLORS: Record<string, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  none: '#a8a29e',
}

/** Workflow status category colors */
export const STATUS_CATEGORY_COLORS: Record<string, string> = {
  todo: '#a8a29e',
  in_progress: '#3b82f6',
  done: '#22c55e',
}

/** Chart color palette — warm & friendly */
export const CHART_COLORS = [
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#22c55e', // green
  '#ec4899', // pink
  '#f97316', // orange
] as const

/** Gantt chart palette */
export const GANTT_PALETTE = {
  light: {
    taskBar: '#f59e0b',
    taskBarHover: '#d97706',
    taskProgress: '#22c55e',
    milestone: '#8b5cf6',
    link: '#78716c',
    gridLine: '#e7e5e4',
    headerBg: '#fef7ed',
    headerText: '#1c1917',
    todayLine: '#ef4444',
    weekendBg: '#fef0db',
  },
  dark: {
    taskBar: '#fbbf24',
    taskBarHover: '#f59e0b',
    taskProgress: '#22c55e',
    milestone: '#a78bfa',
    link: '#a8a29e',
    gridLine: '#44403c',
    headerBg: '#292524',
    headerText: '#fafaf9',
    todayLine: '#ef4444',
    weekendBg: '#292524',
  },
} as const
