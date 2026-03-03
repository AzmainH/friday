import { useMemo, useCallback } from 'react'
import { useRACIMatrix, useUpdateRACICell, type RACIRole } from '@/hooks/useRACIMatrix'

// ---- RACI role config ----

const RACI_CYCLE: RACIRole[] = ['R', 'A', 'C', 'I', null]

const RACI_COLORS: Record<string, string> = {
  R: '#3b82f6', // Responsible - blue
  A: '#ef4444', // Accountable - red
  C: '#f59e0b', // Consulted - amber
  I: '#22c55e', // Informed - green
}

const RACI_LABELS: Record<string, string> = {
  R: 'Responsible',
  A: 'Accountable',
  C: 'Consulted',
  I: 'Informed',
}

function getNextRole(current: RACIRole): RACIRole {
  const idx = RACI_CYCLE.indexOf(current)
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length]
}

// ---- Props ----

interface RACIMatrixProps {
  projectId: string
}

// ---- Component ----

export default function RACIMatrix({ projectId }: RACIMatrixProps) {
  const { data, isLoading, isError } = useRACIMatrix(projectId)
  const updateCell = useUpdateRACICell(projectId)

  // Validation: check each row has exactly one 'A'
  const warnings = useMemo(() => {
    if (!data) return []
    const result: string[] = []
    for (const row of data.rows) {
      const accountableCount = Object.values(row.assignments).filter(
        (role) => role === 'A',
      ).length
      if (accountableCount === 0) {
        result.push(`"${row.issue_key}" has no Accountable (A) assignment.`)
      } else if (accountableCount > 1) {
        result.push(
          `"${row.issue_key}" has ${accountableCount} Accountable (A) assignments. Only one is recommended.`,
        )
      }
    }
    return result
  }, [data])

  const handleCellClick = useCallback(
    (issueId: string, userId: string, currentRole: RACIRole) => {
      const nextRole = getNextRole(currentRole)
      updateCell.mutate({ issue_id: issueId, user_id: userId, role: nextRole })
    },
    [updateCell],
  )

  if (isError) {
    return (
      <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Failed to load RACI matrix. Please try again.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="skeleton-shimmer h-[300px] rounded-lg" />
      </div>
    )
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">
          No activities or issues found to build a RACI matrix.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(RACI_COLORS).map(([role, color]) => (
          <div key={role} className="flex items-center gap-1">
            <div
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ backgroundColor: color }}
            >
              <span className="text-xs font-bold text-white">
                {role}
              </span>
            </div>
            <span className="text-xs text-text-secondary">
              {RACI_LABELS[role]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-stone-400 bg-stone-200" />
          <span className="text-xs text-text-secondary">
            Unassigned (click to set)
          </span>
        </div>
      </div>

      {/* Validation warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <p className="font-semibold mb-1">
            Validation warnings:
          </p>
          {warnings.map((w, i) => (
            <p key={i} className="text-sm">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Matrix grid */}
      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-[3] min-w-[180px] bg-white dark:bg-dark-surface px-3 py-2 text-left text-sm font-bold border-b border-surface-200">
                Activity / Issue
              </th>
              {data.members.map((member) => (
                <th
                  key={member.user_id}
                  className="min-w-[80px] px-3 py-2 text-center text-sm font-semibold border-b border-surface-200"
                >
                  <div
                    className="flex flex-col items-center gap-1"
                    title={member.display_name}
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.display_name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                        {member.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                      {member.display_name.split(' ')[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.issue_id} className="hover:bg-surface-50 dark:hover:bg-dark-border/30">
                <td className="sticky left-0 z-[1] bg-white dark:bg-dark-surface border-r border-surface-200 px-3 py-2">
                  <span className="text-sm font-semibold text-text-primary block">
                    {row.issue_key}
                  </span>
                  <span className="block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-text-secondary">
                    {row.issue_summary}
                  </span>
                </td>
                {data.members.map((member) => {
                  const role = row.assignments[member.user_id] ?? null
                  const color = role ? RACI_COLORS[role] : undefined

                  return (
                    <td
                      key={member.user_id}
                      className="cursor-pointer select-none text-center px-3 py-2 transition-colors hover:bg-surface-100 dark:hover:bg-dark-border/50"
                      onClick={() =>
                        handleCellClick(row.issue_id, member.user_id, role)
                      }
                    >
                      {role ? (
                        <div
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white transition-transform hover:scale-[1.15]"
                          style={{ backgroundColor: color }}
                          title={`${RACI_LABELS[role]} - Click to change`}
                        >
                          {role}
                        </div>
                      ) : (
                        <div
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-dashed border-stone-300 bg-stone-100 hover:border-primary-500 hover:bg-primary-50"
                          title="Click to assign"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
