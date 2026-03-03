import { useState } from 'react'
import { cn } from '@/lib/cn'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatNumber } from '@/utils/formatters'

type GroupBy = 'user' | 'issue' | 'date'

interface TimeReportEntry {
  label: string
  hours: number
  billable_hours: number
}

interface TimeReportsProps {
  projectId: string
}

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'user', label: 'By User' },
  { value: 'issue', label: 'By Issue' },
  { value: 'date', label: 'By Date' },
]

export default function TimeReports({ projectId }: TimeReportsProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('user')

  const { data: entries, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'time-reports', groupBy],
    queryFn: async () => {
      const res = await client.get<{ items: TimeReportEntry[] }>(
        `/projects/${projectId}/time-entries/report`,
        { params: { group_by: groupBy } },
      )
      return res.data.items ?? []
    },
    enabled: !!projectId,
  })

  const totalHours = (entries ?? []).reduce((s, e) => s + e.hours, 0)
  const totalBillable = (entries ?? []).reduce((s, e) => s + e.billable_hours, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Time Reports
        </h2>
        <div className="inline-flex rounded-lg border border-surface-200 bg-surface-50">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                groupBy === opt.value
                  ? 'bg-white text-text-primary shadow-sm rounded-lg'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-surface-300 border-t-primary-500" />
        </div>
      ) : (
        <>
          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4 mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entries ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#f59e0b" name="Total Hours" />
                <Bar dataKey="billable_hours" fill="#22c55e" name="Billable Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="px-3 py-2 text-left text-sm font-semibold">
                    {groupBy === 'user' ? 'User' : groupBy === 'issue' ? 'Issue' : 'Date'}
                  </th>
                  <th className="px-3 py-2 text-right text-sm font-semibold">Hours</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold">Billable</th>
                  <th className="px-3 py-2 text-right text-sm font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {(entries ?? []).map((entry) => (
                  <tr key={entry.label} className="border-b border-surface-100 hover:bg-surface-50 dark:hover:bg-dark-border/30">
                    <td className="px-3 py-2">{entry.label}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(entry.hours)}h</td>
                    <td className="px-3 py-2 text-right">{formatNumber(entry.billable_hours)}h</td>
                    <td className="px-3 py-2 text-right">
                      {totalHours > 0 ? formatNumber((entry.hours / totalHours) * 100) : 0}%
                    </td>
                  </tr>
                ))}
                <tr className="[&_td]:font-semibold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{formatNumber(totalHours)}h</td>
                  <td className="px-3 py-2 text-right">{formatNumber(totalBillable)}h</td>
                  <td className="px-3 py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
