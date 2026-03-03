import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { GateApproval } from '@/hooks/useMilestones'
import { formatDateTime } from '@/utils/formatters'

// ---- Status config ----

const STATUS_CONFIG: Record<
  string,
  { colorClasses: string; borderColor: string; icon: React.ReactElement; label: string }
> = {
  pending: {
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-l-amber-500',
    icon: <Clock className="h-3.5 w-3.5" />,
    label: 'Pending',
  },
  approved: {
    colorClasses: 'bg-green-50 text-green-700 border-green-200',
    borderColor: 'border-l-green-500',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    label: 'Approved',
  },
  rejected: {
    colorClasses: 'bg-red-50 text-red-700 border-red-200',
    borderColor: 'border-l-red-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Rejected',
  },
}

// ---- Props ----

interface GateApprovalCardProps {
  approval: GateApproval
  onDecide: (approvalId: string, decision: 'approved' | 'rejected', notes?: string) => void
}

// ---- Component ----

export default function GateApprovalCard({ approval, onDecide }: GateApprovalCardProps) {
  const config = STATUS_CONFIG[approval.status] ?? STATUS_CONFIG.pending

  return (
    <div
      className={`mb-3 border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface border-l-4 ${config.borderColor}`}
    >
      {/* Content */}
      <div className="px-4 py-3">
        {/* Approver row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {approval.approver_name.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 text-sm font-semibold text-text-primary">
            {approval.approver_name}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.colorClasses}`}
          >
            {config.icon}
            {config.label}
          </span>
        </div>

        {/* Notes */}
        {approval.notes && (
          <p className="text-sm text-text-secondary mb-2">{approval.notes}</p>
        )}

        {/* Decision timestamp */}
        {approval.decided_at && (
          <span className="text-xs text-text-tertiary">
            Decided: {formatDateTime(approval.decided_at)}
          </span>
        )}
      </div>

      {/* Action buttons for pending approvals */}
      {approval.status === 'pending' && (
        <div className="flex gap-2 px-4 pb-3">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<CheckCircle className="h-4 w-4" />}
            onClick={() => onDecide(approval.id, 'approved')}
            className="bg-green-500 hover:bg-green-600 active:bg-green-700"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<XCircle className="h-4 w-4" />}
            onClick={() => onDecide(approval.id, 'rejected')}
            className="bg-transparent text-red-600 border border-red-300 hover:bg-red-50 active:bg-red-100"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}
