import { cn } from '@/lib/cn'
import type { CapacityMember } from '@/hooks/useResourcePlanning'
import type { MemberAllocation } from '@/hooks/useResourcePlanning'

interface CapacityTableProps {
  members: CapacityMember[]
  allocations: MemberAllocation[]
  weeks: number
}

export default function CapacityTable({ members, allocations, weeks }: CapacityTableProps) {
  const allocationMap = new Map(allocations.map((a) => [a.user_id, a]))

  if (!members || members.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-8 text-center">
        No team members found.
      </div>
    )
  }

  // Generate week labels (Week 1, Week 2, etc.)
  const weekLabels = Array.from({ length: Math.min(weeks, 8) }, (_, i) => `Week ${i + 1}`)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-2 px-3 font-semibold text-text-secondary">Member</th>
            <th className="text-right py-2 px-3 font-semibold text-text-secondary">
              Capacity/wk
            </th>
            <th className="text-right py-2 px-3 font-semibold text-text-secondary">Allocated</th>
            <th className="text-right py-2 px-3 font-semibold text-text-secondary">Available</th>
            {weekLabels.map((label) => (
              <th key={label} className="text-right py-2 px-3 font-semibold text-text-secondary">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const alloc = allocationMap.get(member.user_id)
            const totalAllocated = alloc?.total_allocated_hours ?? 0
            const weeklyCapacity = member.weekly_capacity_hours
            const weeklyAllocated = weeks > 0 ? totalAllocated / weeks : 0
            const weeklyAvailable = weeklyCapacity - weeklyAllocated

            return (
              <tr
                key={member.user_id}
                className="border-b border-surface-100 hover:bg-surface-50 dark:hover:bg-surface-200/50"
              >
                <td className="py-2 px-3 font-medium text-text-primary">
                  {member.display_name}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-text-secondary">
                  {weeklyCapacity}h
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-text-secondary">
                  {weeklyAllocated.toFixed(1)}h
                </td>
                <td
                  className={cn(
                    'py-2 px-3 text-right tabular-nums font-medium',
                    weeklyAvailable < 0 && 'text-red-600 dark:text-red-400',
                    weeklyAvailable >= 0 && 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {weeklyAvailable.toFixed(1)}h
                </td>
                {weekLabels.map((label) => {
                  const avail = weeklyAvailable
                  return (
                    <td
                      key={label}
                      className={cn(
                        'py-2 px-3 text-right tabular-nums text-xs',
                        avail < 0 && 'text-red-500',
                        avail >= 0 && avail < 8 && 'text-amber-500',
                        avail >= 8 && 'text-text-tertiary',
                      )}
                    >
                      {avail.toFixed(0)}h
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
