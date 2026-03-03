/**
 * JS-accessible theme constants for libraries that can't use CSS variables
 * (Recharts, dhtmlx-gantt, etc.)
 */

export const colors = {
  primary: {
    50: '#E0F2F1',
    100: '#B2DFDB',
    200: '#80CBC4',
    300: '#4DB6AC',
    400: '#26A69A',
    500: '#009688',
    600: '#00796B',
    700: '#00695C',
  },
  secondary: {
    50: '#F8F9FA',
    100: '#ECEEF1',
    500: '#8E9AAF',
    600: '#6E7A8E',
    700: '#515C6E',
  },
  surface: {
    50: '#FAFAF9',
    100: '#F5F5F3',
    200: '#EBEBEA',
    300: '#DCDBD9',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#6B6B6B',
    tertiary: '#A3A3A3',
  },
  success: '#2E9E5A',
  warning: '#E8A317',
  error: '#D84040',
  info: '#3574D4',
} as const

export const darkColors = {
  surface: {
    50: '#0F1110',
    100: '#1A1C1B',
    200: '#252826',
    300: '#333634',
  },
  text: {
    primary: '#F2F2F0',
    secondary: '#9E9E9E',
    tertiary: '#6B6B6B',
  },
} as const

/** Priority colors */
export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#C62828',
  high: '#D84040',
  medium: '#E8A317',
  low: '#26A69A',
  none: '#A3A3A3',
}

/** RAG status colors */
export const RAG_COLORS: Record<string, string> = {
  green: '#2E9E5A',
  amber: '#E8A317',
  red: '#D84040',
  none: '#A3A3A3',
}

/** Workflow status category colors */
export const STATUS_CATEGORY_COLORS: Record<string, string> = {
  todo: '#A3A3A3',
  in_progress: '#3574D4',
  done: '#2E9E5A',
}

/** Chart color palette — phthalo green & silver */
export const CHART_COLORS = [
  '#009688', // phthalo green
  '#8E9AAF', // silver
  '#3574D4', // steel blue
  '#D84040', // muted red
  '#7E57C2', // muted violet
  '#00838F', // deep cyan
  '#C2185B', // muted rose
  '#EF6C00', // deep orange
] as const

/** Gantt chart palette */
export const GANTT_PALETTE = {
  light: {
    taskBar: '#009688',
    taskBarHover: '#00796B',
    taskProgress: '#8E9AAF',
    milestone: '#7E57C2',
    link: '#6B6B6B',
    gridLine: '#EBEBEA',
    headerBg: '#F5F5F3',
    headerText: '#1A1A1A',
    todayLine: '#D84040',
    weekendBg: '#F5F5F3',
  },
  dark: {
    taskBar: '#26A69A',
    taskBarHover: '#009688',
    taskProgress: '#8E9AAF',
    milestone: '#9575CD',
    link: '#9E9E9E',
    gridLine: '#252826',
    headerBg: '#1A1C1B',
    headerText: '#F2F2F0',
    todayLine: '#D84040',
    weekendBg: '#1A1C1B',
  },
} as const
