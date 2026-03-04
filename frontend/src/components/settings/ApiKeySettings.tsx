import { useState } from 'react'
import { Copy, Eye, EyeOff, Key, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ApiKey {
  id: string
  name: string
  partial_key: string
  created_at: string
  last_used_at: string | null
}

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'

// Stub data for UI shell
const STUB_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'CI/CD Pipeline',
    partial_key: 'fri_****...a3b2',
    created_at: '2026-01-15T10:30:00Z',
    last_used_at: '2026-03-03T14:20:00Z',
  },
  {
    id: '2',
    name: 'External Integration',
    partial_key: 'fri_****...9f1e',
    created_at: '2026-02-20T08:00:00Z',
    last_used_at: null,
  },
]

export default function ApiKeySettings() {
  const [keys, setKeys] = useState<ApiKey[]>(STUB_KEYS)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    const fakeFullKey = `fri_${crypto.randomUUID().replace(/-/g, '')}`
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName.trim(),
      partial_key: `fri_****...${fakeFullKey.slice(-4)}`,
      created_at: new Date().toISOString(),
      last_used_at: null,
    }
    setKeys((prev) => [newKey, ...prev])
    setCreatedKey(fakeFullKey)
    setNewKeyName('')
  }

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id))
    setConfirmRevoke(null)
  }

  const handleCloseCreate = () => {
    setShowCreate(false)
    setCreatedKey(null)
    setNewKeyName('')
    setShowKey(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage API keys for external integrations and automation.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          New Key
        </Button>
      </div>

      {/* Create new key dialog */}
      {showCreate && (
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4 space-y-4">
          {!createdKey ? (
            <>
              <h3 className="text-sm font-semibold text-text-primary">Create New API Key</h3>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Key Name
                </label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., CI/CD Pipeline"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleCreate} disabled={!newKeyName.trim()}>
                  Create Key
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCloseCreate}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-text-primary">API Key Created</h3>
              <p className="text-xs text-text-secondary">
                Copy this key now. You will not be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm bg-surface-50 dark:bg-surface-100 border border-surface-200 rounded-lg px-3 py-2 break-all">
                  {showKey ? createdKey : createdKey.replace(/./g, '*').slice(0, 20) + '...'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 text-text-secondary hover:text-text-primary"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(createdKey)}
                  className="p-2 text-text-secondary hover:text-text-primary"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCloseCreate}>
                Done
              </Button>
            </>
          )}
        </div>
      )}

      {/* Existing keys list */}
      {keys.length === 0 ? (
        <div className="border border-surface-200 rounded-lg p-8 text-center">
          <Key className="h-10 w-10 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No API keys yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="border border-surface-200 rounded-lg divide-y divide-surface-200">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-primary">{key.name}</p>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="font-mono">{key.partial_key}</span>
                  <span>Created {formatDate(key.created_at)}</span>
                  {key.last_used_at ? (
                    <span>Last used {formatDate(key.last_used_at)}</span>
                  ) : (
                    <span>Never used</span>
                  )}
                </div>
              </div>
              <div>
                {confirmRevoke === key.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Revoke?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRevoke(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRevoke(key.id)}
                    className="p-2 text-text-secondary hover:text-error transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
