import { useState, useCallback } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { CheckCircle, XCircle, Gavel, History } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Gavel className="h-6 w-6 text-primary-500" />
        <h1 className="text-xl font-semibold text-text-primary">
          Approvals
        </h1>
        {pending && pending.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex gap-1 border-b border-surface-200 mb-6">
          <Tab className={({ selected }) => cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            selected
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}>
            <Gavel className="h-4 w-4" />
            Pending
          </Tab>
          <Tab className={({ selected }) => cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            selected
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}>
            <History className="h-4 w-4" />
            History
          </Tab>
        </TabList>

        <TabPanels>
          {/* Pending tab */}
          <TabPanel>
            {loadingPending && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="skeleton-shimmer h-[120px] rounded-lg" />
                ))}
              </div>
            )}

            {!loadingPending && (!pending || pending.length === 0) && (
              <div className="p-12 rounded-xl bg-white border border-surface-200 text-center dark:bg-dark-surface dark:border-dark-border">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-medium text-text-secondary mb-1">
                  All caught up!
                </h3>
                <p className="text-sm text-text-secondary">
                  No pending approvals at this time.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {pending?.map((approval) => (
                <div key={approval.id} className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
                  <div className="p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h4 className="text-base font-semibold text-text-primary">
                          {approval.entity_summary}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          Requested by {approval.requested_by_name} on{' '}
                          {formatDateTime(approval.created_at)}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 h-fit">
                        {approval.step_name}
                      </span>
                    </div>

                    <hr className="border-surface-200 my-3" />

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-secondary mb-1">Notes (optional)</label>
                      <textarea
                        placeholder="Add review notes..."
                        value={notes[approval.id] ?? ''}
                        onChange={(e) => updateNotes(approval.id, e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                        onClick={() => handleDecide(approval.id, 'approved')}
                        disabled={decideMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 active:bg-green-700 focus-visible:ring-green-500/30"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        leftIcon={<XCircle className="h-4 w-4" />}
                        onClick={() => handleDecide(approval.id, 'rejected')}
                        disabled={decideMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>

          {/* History tab */}
          <TabPanel>
            {loadingHistory && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="skeleton-shimmer h-[60px] rounded-lg" />
                ))}
              </div>
            )}

            {!loadingHistory && (!history || history.length === 0) && (
              <p className="py-8 text-center text-sm text-text-secondary">
                No approval history.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {history?.map((item) => (
                <div key={item.id} className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                          item.status === 'approved'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700',
                        )}
                      >
                        {item.status}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {item.entity_summary}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.step_name} — {formatDateTime(item.decided_at)}
                        </p>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-text-secondary max-w-[200px] truncate">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
