import { useState } from 'react'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type DigestFrequency = 'none' | 'daily' | 'weekly'

interface NotificationPref {
  label: string
  key: string
  inApp: boolean
  email: boolean
}

const DEFAULT_PREFS: NotificationPref[] = [
  { label: 'Issue assigned', key: 'issue_assigned', inApp: true, email: true },
  { label: 'Comment added', key: 'comment_added', inApp: true, email: false },
  { label: 'Status changed', key: 'status_changed', inApp: true, email: false },
  { label: 'Sprint started', key: 'sprint_started', inApp: true, email: true },
  { label: 'Mentioned', key: 'mentioned', inApp: true, email: true },
]

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS)
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>('none')
  const [saved, setSaved] = useState(false)

  const updatePref = (key: string, field: 'inApp' | 'email', value: boolean) => {
    setPrefs((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    )
  }

  const handleSave = () => {
    // Would save to backend when endpoint is available
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
        <p className="text-sm text-text-secondary mt-1">
          Choose how and when you want to be notified.
        </p>
      </div>

      {/* Notification type toggles */}
      <div className="border border-surface-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2 bg-surface-50 dark:bg-surface-100 border-b border-surface-200">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Event
          </span>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">
            In-app
          </span>
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">
            Email
          </span>
        </div>

        {/* Rows */}
        {prefs.map((pref) => (
          <div
            key={pref.key}
            className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 border-b border-surface-200 last:border-b-0"
          >
            <span className="text-sm text-text-primary">{pref.label}</span>
            <div className="flex justify-center">
              <Switch
                checked={pref.inApp}
                onChange={(val) => updatePref(pref.key, 'inApp', val)}
              />
            </div>
            <div className="flex justify-center">
              <Switch
                checked={pref.email}
                onChange={(val) => updatePref(pref.key, 'email', val)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Digest frequency */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Digest Frequency
        </label>
        <div className="flex gap-3">
          {(['none', 'daily', 'weekly'] as DigestFrequency[]).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setDigestFrequency(freq)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors capitalize',
                digestFrequency === freq
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600'
                  : 'border-surface-200 bg-white dark:bg-dark-surface text-text-secondary hover:border-surface-300',
              )}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button type="button" variant="primary" size="md" onClick={handleSave}>
          Save Notification Settings
        </Button>
        {saved && <span className="text-sm text-green-600">Settings saved</span>}
      </div>
    </div>
  )
}
