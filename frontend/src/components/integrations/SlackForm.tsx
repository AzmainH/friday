import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations'
import type { Integration } from '@/hooks/useIntegrations'

const EVENT_TYPES = [
  { key: 'issue_created', label: 'Issue Created' },
  { key: 'issue_updated', label: 'Issue Updated' },
  { key: 'comment_added', label: 'Comment Added' },
  { key: 'sprint_started', label: 'Sprint Started' },
]

interface SlackFormProps {
  open: boolean
  onClose: () => void
  projectId: string
  existing?: Integration | null
}

export default function SlackForm({ open, onClose, projectId, existing }: SlackFormProps) {
  const isEdit = !!existing

  const parseConfig = (configStr: string) => {
    try {
      return JSON.parse(configStr)
    } catch {
      return {}
    }
  }

  const existingConfig = existing ? parseConfig(existing.config_json) : {}

  const [name, setName] = useState(existing?.name ?? '')
  const [webhookUrl, setWebhookUrl] = useState(existingConfig.webhook_url ?? '')
  const [channel, setChannel] = useState(existingConfig.channel ?? '')
  const [events, setEvents] = useState<string[]>(existingConfig.events ?? [])

  const createIntegration = useCreateIntegration()
  const updateIntegration = useUpdateIntegration(projectId)

  const toggleEvent = (key: string) => {
    setEvents((prev) => (prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]))
  }

  const buildConfig = () =>
    JSON.stringify({ webhook_url: webhookUrl, channel, events })

  const handleSave = async () => {
    if (!webhookUrl || !name) return
    const config_json = buildConfig()

    if (isEdit && existing) {
      await updateIntegration.mutateAsync({
        id: existing.id,
        name,
        config_json,
      })
    } else {
      await createIntegration.mutateAsync({
        project_id: projectId,
        type: 'slack',
        name,
        config_json,
      })
    }
    onClose()
  }

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

  const isPending = createIntegration.isPending || updateIntegration.isPending

  return (
    <Dialog open={open} onClose={() => onClose()} title={isEdit ? 'Edit Slack Integration' : 'Add Slack Integration'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Slack Channel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Webhook URL</label>
          <input
            type="url"
            className={inputClass}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Channel Name <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="#project-updates"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Event Types</label>
          <div className="space-y-2">
            {EVENT_TYPES.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(key)}
                  onChange={() => toggleEvent(key)}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={isPending || !webhookUrl || !name} loading={isPending}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
