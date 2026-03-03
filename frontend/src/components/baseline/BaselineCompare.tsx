import { useMemo } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatDate } from '@/utils/formatters'

// ---- Types ----

interface BaselineEntry {
  issue_id: string
  issue_key: string
  issue_summary: string
  baseline_start: string | null
  baseline_end: string | null
  current_start: string | null
  current_end: string | null
}

interface BaselineComparisonData {
  baseline_id: string
  baseline_name: string
  created_at: string
  entries: BaselineEntry[]
}

// ---- Props ----

interface BaselineCompareProps {
  baselineId: string
}

// ---- Helpers ----

/** Calculate variance in days between two date strings. Positive = slipped. */
function calcVarianceDays(
  baseline: string | null,
  current: string | null,
): number | null {
  if (!baseline || !current) return null
  const baselineMs = new Date(baseline).getTime()
  const currentMs = new Date(current).getTime()
  return Math.round((currentMs - baselineMs) / (1000 * 60 * 60 * 24))
}

// ---- Component ----

export default function BaselineCompare({ baselineId }: BaselineCompareProps) {
  const { data, isLoading, isError } = useQuery<BaselineComparisonData>({
    queryKey: ['baseline-compare', baselineId],
    queryFn: async () => {
      const { data } = await client.get(`/baselines/${baselineId}/compare`)
      return data
    },
    enabled: !!baselineId,
  })

  // Compute variance for each entry
  const rows = useMemo(() => {
    if (!data) return []
    return data.entries.map((entry) => {
      const startVariance = calcVarianceDays(entry.baseline_start, entry.current_start)
      const endVariance = calcVarianceDays(entry.baseline_end, entry.current_end)
      return { ...entry, startVariance, endVariance }
    })
  }, [data])

  // Summary stats
  const summary = useMemo(() => {
    const slipped = rows.filter(
      (r) => (r.startVariance !== null && r.startVariance > 0) ||
             (r.endVariance !== null && r.endVariance > 0),
    ).length
    const onTrack = rows.filter(
      (r) =>
        (r.startVariance === null || r.startVariance <= 0) &&
        (r.endVariance === null || r.endVariance <= 0),
    ).length
    const noData = rows.filter(
      (r) => r.startVariance === null && r.endVariance === null,
    ).length
    return { slipped, onTrack, noData, total: rows.length }
  }, [rows])

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm m-2">
        Failed to load baseline comparison. Please try again.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="skeleton-shimmer h-[300px] rounded-lg" />
      </div>
    )
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-[#78716c]">
          No baseline data available for comparison.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header with baseline info */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-base font-semibold">
            Baseline: {data.baseline_name}
          </p>
          <span className="text-xs text-[#78716c]">
            Created {formatDate(data.created_at)}
          </span>
        </div>
        <div className="flex gap-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: summary.slipped > 0 ? '#ef444420' : '#f5f5f4',
              color: summary.slipped > 0 ? '#ef4444' : '#78716c',
            }}
          >
            {summary.slipped} slipped
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: '#22c55e20',
              color: '#22c55e',
            }}
          >
            {summary.onTrack} on track
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-[#78716c]">
            {summary.total} total
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="px-3 py-2 text-left font-bold">Issue</th>
              <th className="px-3 py-2 text-left font-bold">Baseline Start</th>
              <th className="px-3 py-2 text-left font-bold">Current Start</th>
              <th className="px-3 py-2 text-center font-bold">Start Variance</th>
              <th className="px-3 py-2 text-left font-bold">Baseline End</th>
              <th className="px-3 py-2 text-left font-bold">Current End</th>
              <th className="px-3 py-2 text-center font-bold">End Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.issue_id} className="border-b border-surface-200 last:border-b-0 hover:bg-surface-50 transition-colors">
                {/* Issue key + summary */}
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold block">{row.issue_key}</span>
                  <span className="text-xs text-[#78716c] block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {row.issue_summary}
                  </span>
                </td>

                {/* Baseline start */}
                <td className="px-3 py-2 text-sm">{formatDate(row.baseline_start)}</td>

                {/* Current start */}
                <td className="px-3 py-2 text-sm">{formatDate(row.current_start)}</td>

                {/* Start variance */}
                <td className="px-3 py-2 text-center">
                  <VarianceBadge days={row.startVariance} />
                </td>

                {/* Baseline end */}
                <td className="px-3 py-2 text-sm">{formatDate(row.baseline_end)}</td>

                {/* Current end */}
                <td className="px-3 py-2 text-sm">{formatDate(row.current_end)}</td>

                {/* End variance */}
                <td className="px-3 py-2 text-center">
                  <VarianceBadge days={row.endVariance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- Variance badge sub-component ----

function VarianceBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <span className="text-xs text-surface-400">
        --
      </span>
    )
  }

  if (days === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold"
        style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}
      >
        <Minus size={14} />
        On time
      </span>
    )
  }

  const isSlipped = days > 0
  const color = isSlipped ? '#ef4444' : '#22c55e'
  const Icon = isSlipped ? ArrowDown : ArrowUp
  const label = isSlipped ? `+${days}d late` : `${Math.abs(days)}d early`

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <Icon size={14} />
      {label}
    </span>
  )
}
