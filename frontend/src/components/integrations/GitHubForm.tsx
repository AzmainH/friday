import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations'
import type { Integration } from '@/hooks/useIntegrations'

const SYNC_OPTIONS = [
  { key: 'sync_issues', label: 'Sync Issues' },
  { key: 'sync_prs', label: 'Sync Pull Requests' },
  { key: 'sync_comments', label: 'Sync Comments' },
]

interface GitHubFormProps {
  open: boolean
  onClose: () => void
  projectId: string
  existing?: Integration | null
}

export default function GitHubForm({ open, onClose, projectId, existing }: GitHubFormProps) {
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
  const [repoUrl, setRepoUrl] = useState(existingConfig.repo_url ?? '')
  const [token, setToken] = useState(existingConfig.token ?? '')
  const [syncOptions, setSyncOptions] = useState<string[]>(existingConfig.sync_options ?? [])

  const createIntegration = useCreateIntegration()
  const updateIntegration = useUpdateIntegration(projectId)

  const toggleOption = (key: string) => {
    setSyncOptions((prev) =>
      prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key],
    )
  }

  const buildConfig = () =>
    JSON.stringify({ repo_url: repoUrl, token, sync_options: syncOptions })

  const handleSave = async () => {
    if (!repoUrl || !name) return
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
        type: 'github',
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
    <Dialog open={open} onClose={() => onClose()} title={isEdit ? 'Edit GitHub Integration' : 'Add GitHub Integration'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My GitHub Repo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Repository URL</label>
          <input
            type="url"
            className={inputClass}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Personal Access Token
          </label>
          <input
            type="password"
            className={inputClass}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Sync Options</label>
          <div className="space-y-2">
            {SYNC_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncOptions.includes(key)}
                  onChange={() => toggleOption(key)}
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
        <Button onClick={handleSave} disabled={isPending || !repoUrl || !name} loading={isPending}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
