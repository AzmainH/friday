/** Date formatters */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

/** Number formatters */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${hours.toFixed(1)}h`
}

/** Priority helpers */
export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#d32f2f',
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50',
  none: '#9e9e9e',
}

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
}

/** RAG status colors */
export const RAG_COLORS: Record<string, string> = {
  green: '#4caf50',
  amber: '#ff9800',
  red: '#f44336',
  none: '#9e9e9e',
}

/** Status category colors */
export const STATUS_CATEGORY_COLORS: Record<string, string> = {
  todo: '#9e9e9e',
  in_progress: '#2196f3',
  done: '#4caf50',
}

/** File size formatter */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '\u2026'
}
