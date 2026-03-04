import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Webhook, Github, MessageSquare, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import WebhookForm from '@/components/integrations/WebhookForm'
import GitHubForm from '@/components/integrations/GitHubForm'
import SlackForm from '@/components/integrations/SlackForm'
import WebhookLogs from '@/components/integrations/WebhookLogs'
import {
  useIntegrations,
  useUpdateIntegration,
  useDeleteIntegration,
} from '@/hooks/useIntegrations'
import type { Integration, IntegrationType } from '@/hooks/useIntegrations'

// ---------------------------------------------------------------------------
// Type selector dialog
// ---------------------------------------------------------------------------

interface TypeSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (type: IntegrationType) => void
}

function TypeSelector({ open, onClose, onSelect }: TypeSelectorProps) {
  const types: { type: IntegrationType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: 'webhook',
      label: 'Webhook',
      description: 'Send HTTP POST to an external URL on events.',
      icon: <Webhook className="h-6 w-6 text-primary-500" />,
    },
    {
      type: 'github',
      label: 'GitHub',
      description: 'Sync issues and pull requests with a GitHub repository.',
      icon: <Github className="h-6 w-6 text-text-primary" />,
    },
    {
      type: 'slack',
      label: 'Slack',
      description: 'Send notifications to a Slack channel.',
      icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
    },
  ]

  return (
    <Dialog open={open} onClose={() => onClose()} title="Add Integration" size="md">
      <div className="space-y-3">
        {types.map(({ type, label, description, icon }) => (
          <button
            key={type}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors text-left"
            onClick={() => onSelect(type)}
          >
            <div className="flex-shrink-0">{icon}</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>
      <DialogFooter className="mt-4 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Integration card
// ---------------------------------------------------------------------------

function typeIcon(type: IntegrationType) {
  switch (type) {
    case 'webhook':
      return <Webhook className="h-5 w-5 text-primary-500" />
    case 'github':
      return <Github className="h-5 w-5 text-text-primary" />
    case 'slack':
      return <MessageSquare className="h-5 w-5 text-purple-500" />
  }
}

interface IntegrationCardProps {
  integration: Integration
  projectId: string
  onEdit: (integration: Integration) => void
  onViewLogs: (integration: Integration) => void
}

function IntegrationCard({ integration, projectId, onEdit, onViewLogs }: IntegrationCardProps) {
  const updateIntegration = useUpdateIntegration(projectId)
  const deleteIntegration = useDeleteIntegration(projectId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleToggle = async () => {
    await updateIntegration.mutateAsync({
      id: integration.id,
      is_active: !integration.is_active,
    })
  }

  const handleDelete = async () => {
    await deleteIntegration.mutateAsync(integration.id)
    setConfirmDelete(false)
  }

  return (
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {typeIcon(integration.type)}
          <div>
            <p className="text-sm font-semibold text-text-primary">{integration.name}</p>
            <p className="text-xs text-text-tertiary capitalize">{integration.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggle}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors"
            title={integration.is_active ? 'Deactivate' : 'Activate'}
          >
            {integration.is_active ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => onEdit(integration)}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              integration.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-surface-100 text-text-tertiary'
            }`}
          >
            {integration.is_active ? 'Active' : 'Inactive'}
          </span>
          {integration.last_triggered_at && (
            <span>Last triggered: {new Date(integration.last_triggered_at).toLocaleString()}</span>
          )}
        </div>
        {integration.type === 'webhook' && (
          <button
            onClick={() => onViewLogs(integration)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            View Logs
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Integration" size="sm">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete &quot;{integration.name}&quot;? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4 border-t-0 px-0">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteIntegration.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = projectId ?? ''

  const { data: integrations, isLoading, error } = useIntegrations(pid)

  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false)
  const [formType, setFormType] = useState<IntegrationType | null>(null)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [logsIntegration, setLogsIntegration] = useState<Integration | null>(null)

  const handleTypeSelected = (type: IntegrationType) => {
    setTypeSelectorOpen(false)
    setFormType(type)
    setEditingIntegration(null)
  }

  const handleEdit = (integration: Integration) => {
    setFormType(integration.type)
    setEditingIntegration(integration)
  }

  const handleFormClose = () => {
    setFormType(null)
    setEditingIntegration(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500 mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Integrations</h1>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setTypeSelectorOpen(true)}
        >
          Add Integration
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          Failed to load integrations.
        </div>
      )}

      {/* Integration list */}
      {(!integrations || integrations.length === 0) ? (
        <div className="border border-dashed border-surface-300 rounded-[--radius-md] p-12 text-center">
          <Webhook className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-1">No integrations configured</p>
          <p className="text-xs text-text-tertiary mb-4">
            Add a webhook, GitHub, or Slack integration to connect Friday with your tools.
          </p>
          <Button size="sm" onClick={() => setTypeSelectorOpen(true)}>
            Add Integration
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              projectId={pid}
              onEdit={handleEdit}
              onViewLogs={setLogsIntegration}
            />
          ))}
        </div>
      )}

      {/* Type selector */}
      <TypeSelector
        open={typeSelectorOpen}
        onClose={() => setTypeSelectorOpen(false)}
        onSelect={handleTypeSelected}
      />

      {/* Type-specific forms */}
      {formType === 'webhook' && (
        <WebhookForm
          open
          onClose={handleFormClose}
          projectId={pid}
          existing={editingIntegration}
        />
      )}
      {formType === 'github' && (
        <GitHubForm
          open
          onClose={handleFormClose}
          projectId={pid}
          existing={editingIntegration}
        />
      )}
      {formType === 'slack' && (
        <SlackForm
          open
          onClose={handleFormClose}
          projectId={pid}
          existing={editingIntegration}
        />
      )}

      {/* Webhook logs dialog */}
      {logsIntegration && (
        <Dialog
          open={!!logsIntegration}
          onClose={() => setLogsIntegration(null)}
          title={`Delivery Logs: ${logsIntegration.name}`}
          size="xl"
        >
          <WebhookLogs integrationId={logsIntegration.id} />
          <DialogFooter className="mt-4 border-t-0 px-0">
            <Button variant="ghost" onClick={() => setLogsIntegration(null)}>Close</Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  )
}
