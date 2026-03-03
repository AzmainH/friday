import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import type { GateApproval } from '@/hooks/useMilestones'
import { formatDateTime } from '@/utils/formatters'

// ---- Status config ----

const STATUS_CONFIG: Record<
  string,
  { color: 'default' | 'success' | 'error' | 'warning'; icon: React.ReactElement; label: string }
> = {
  pending: {
    color: 'warning',
    icon: <HourglassEmptyIcon fontSize="small" />,
    label: 'Pending',
  },
  approved: {
    color: 'success',
    icon: <CheckCircleOutlineIcon fontSize="small" />,
    label: 'Approved',
  },
  rejected: {
    color: 'error',
    icon: <CancelOutlinedIcon fontSize="small" />,
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
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderLeft: '4px solid',
        borderLeftColor:
          approval.status === 'approved'
            ? 'success.main'
            : approval.status === 'rejected'
              ? 'error.main'
              : 'warning.main',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Approver row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
            {approval.approver_name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {approval.approver_name}
          </Typography>
          <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Notes */}
        {approval.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {approval.notes}
          </Typography>
        )}

        {/* Decision timestamp */}
        {approval.decided_at && (
          <Typography variant="caption" color="text.secondary">
            Decided: {formatDateTime(approval.decided_at)}
          </Typography>
        )}
      </CardContent>

      {/* Action buttons for pending approvals */}
      {approval.status === 'pending' && (
        <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => onDecide(approval.id, 'approved')}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelOutlinedIcon />}
            onClick={() => onDecide(approval.id, 'rejected')}
          >
            Reject
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
