import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import GavelIcon from '@mui/icons-material/Gavel'
import HistoryIcon from '@mui/icons-material/History'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Approval {
  id: string
  entity_type: string
  entity_id: string
  entity_summary: string
  step_name: string
  requested_by: string
  requested_by_name: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  decided_at: string | null
  created_at: string
}

interface ApprovalDecisionInput {
  decision: 'approved' | 'rejected'
  notes?: string | null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function usePendingApprovals() {
  return useQuery<Approval[]>({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const { data } = await client.get('/approvals/pending')
      return data.data ?? data
    },
  })
}

function useApprovalHistory() {
  return useQuery<Approval[]>({
    queryKey: ['approvals', 'history'],
    queryFn: async () => {
      const { data } = await client.get('/approvals/history')
      return data.data ?? data
    },
  })
}

function useDecideApproval() {
  const qc = useQueryClient()
  return useMutation<Approval, Error, { id: string; body: ApprovalDecisionInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.post(`/approvals/${id}/decide`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const { data: pending, isLoading: loadingPending } = usePendingApprovals()
  const { data: history, isLoading: loadingHistory } = useApprovalHistory()
  const decideMutation = useDecideApproval()

  const [activeTab, setActiveTab] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const handleDecide = useCallback(
    (id: string, decision: 'approved' | 'rejected') => {
      decideMutation.mutate({
        id,
        body: { decision, notes: notes[id]?.trim() || null },
      })
    },
    [decideMutation, notes],
  )

  const updateNotes = useCallback((id: string, value: string) => {
    setNotes((prev) => ({ ...prev, [id]: value }))
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <GavelIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Approvals
        </Typography>
        {pending && pending.length > 0 && (
          <Chip
            label={`${pending.length} pending`}
            size="small"
            color="warning"
          />
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab
          label="Pending"
          icon={<GavelIcon />}
          iconPosition="start"
        />
        <Tab
          label="History"
          icon={<HistoryIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* Pending tab */}
      {activeTab === 0 && (
        <>
          {loadingPending && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          )}

          {!loadingPending && (!pending || pending.length === 0) && (
            <Box
              sx={{
                p: 6,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No pending approvals at this time.
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pending?.map((approval) => (
              <Card key={approval.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {approval.entity_summary}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Requested by {approval.requested_by_name} on{' '}
                        {formatDateTime(approval.created_at)}
                      </Typography>
                    </Box>
                    <Chip
                      label={approval.step_name}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <TextField
                    size="small"
                    label="Notes (optional)"
                    placeholder="Add review notes..."
                    value={notes[approval.id] ?? ''}
                    onChange={(e) => updateNotes(approval.id, e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleDecide(approval.id, 'approved')}
                      disabled={decideMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDecide(approval.id, 'rejected')}
                      disabled={decideMutation.isPending}
                    >
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* History tab */}
      {activeTab === 1 && (
        <>
          {loadingHistory && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          )}

          {!loadingHistory && (!history || history.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No approval history.
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {history?.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={item.status}
                      size="small"
                      color={item.status === 'approved' ? 'success' : 'error'}
                      variant="outlined"
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {item.entity_summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.step_name} — {formatDateTime(item.decided_at)}
                      </Typography>
                    </Box>
                    {item.notes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {item.notes}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Container>
  )
}
