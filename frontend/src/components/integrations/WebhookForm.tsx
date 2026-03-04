import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { useCreateIntegration, useUpdateIntegration, useTestWebhook } from '@/hooks/useIntegrations'
import type { Integration } from '@/hooks/useIntegrations'
import { Send, CheckCircle, XCircle } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'issue_created', label: 'Issue Created' },
  { key: 'issue_updated', label: 'Issue Updated' },
  { key: 'comment_added', label: 'Comment Added' },
  { key: 'sprint_started', label: 'Sprint Started' },
]

interface WebhookFormProps {
  open: boolean
  onClose: () => void
  projectId: string
  existing?: Integration | null
}

export default function WebhookForm({ open, onClose, projectId, existing }: WebhookFormProps) {
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
  const [url, setUrl] = useState(existingConfig.url ?? '')
  const [secret, setSecret] = useState(existingConfig.secret ?? '')
  const [events, setEvents] = useState<string[]>(existingConfig.events ?? [])
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const createIntegration = useCreateIntegration()
  const updateIntegration = useUpdateIntegration(projectId)
  const testWebhook = useTestWebhook()

  const toggleEvent = (key: string) => {
    setEvents((prev) => (prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]))
  }

  const buildConfig = () =>
    JSON.stringify({ url, secret, events })

  const handleSave = async () => {
    if (!url || !name) return
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
        type: 'webhook',
        name,
        config_json,
      })
    }
    onClose()
  }

  const handleTest = async () => {
    if (!existing) return
    setTestResult(null)
    try {
      const result = await testWebhook.mutateAsync({ id: existing.id })
      setTestResult({
        success: result.success,
        message: result.success
          ? `OK (${result.status_code})`
          : `Failed: ${result.response_body ?? 'No response'}`,
      })
    } catch {
      setTestResult({ success: false, message: 'Request failed' })
    }
  }

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

  const isPending = createIntegration.isPending || updateIntegration.isPending

  return (
    <Dialog open={open} onClose={() => onClose()} title={isEdit ? 'Edit Webhook' : 'Add Webhook'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Webhook"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">URL</label>
          <input
            type="url"
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Secret <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="webhook-secret"
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

        {isEdit && (
          <div className="pt-2 border-t border-surface-200">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleTest}
              loading={testWebhook.isPending}
              disabled={testWebhook.isPending}
            >
              Test Webhook
            </Button>
            {testResult && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.message}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={isPending || !url || !name} loading={isPending}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
