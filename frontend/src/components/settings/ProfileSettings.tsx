import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useProfile, useUpdateProfile } from '@/hooks/useSettings'

interface ProfileFormValues {
  display_name: string
  email: string
  timezone: string
  language: string
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
]

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'
const labelClass = 'block text-sm font-medium text-text-primary mb-1'

export default function ProfileSettings() {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const { data: profile, isLoading } = useProfile(currentUserId)
  const updateProfile = useUpdateProfile()

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileFormValues>({
    defaultValues: {
      display_name: '',
      email: '',
      timezone: 'UTC',
      language: 'en',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        display_name: profile.display_name ?? profile.name ?? '',
        email: profile.email ?? '',
        timezone: profile.timezone ?? 'UTC',
        language: profile.language ?? 'en',
      })
    }
  }, [profile, reset])

  const onSubmit = (values: ProfileFormValues) => {
    if (!currentUserId) return
    updateProfile.mutate({ id: currentUserId, body: values })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-100 dark:bg-surface-200 flex items-center justify-center">
          <User className="h-8 w-8 text-text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {profile?.display_name ?? profile?.name ?? 'User'}
          </p>
          <p className="text-xs text-text-secondary">{profile?.email ?? 'No email set'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Display Name</label>
          <Controller
            name="display_name"
            control={control}
            render={({ field }) => <input {...field} className={inputClass} />}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <input {...field} type="email" className={inputClass} />}
          />
        </div>

        <div>
          <label className={labelClass}>Timezone</label>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <select {...field} className={inputClass}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className={labelClass}>Language</label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <select {...field} className={inputClass}>
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={updateProfile.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
