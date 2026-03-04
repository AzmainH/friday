import { lazy, Suspense } from 'react'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { cn } from '@/lib/cn'

const ProfileSettings = lazy(() => import('@/components/settings/ProfileSettings'))
const PreferenceSettings = lazy(() => import('@/components/settings/PreferenceSettings'))
const OrganizationSettings = lazy(() => import('@/components/settings/OrganizationSettings'))
const WorkspaceSettings = lazy(() => import('@/components/settings/WorkspaceSettings'))
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings'))
const ApiKeySettings = lazy(() => import('@/components/settings/ApiKeySettings'))

const TAB_LABELS = [
  'Profile',
  'Preferences',
  'Organization',
  'Workspace',
  'Notifications',
  'API Keys',
]

function TabFallback() {
  return (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Settings</h1>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mt-2">
        <TabGroup>
          <div className="border-b border-surface-200">
            <TabList className="flex gap-0 overflow-x-auto px-2" aria-label="Settings tabs">
              {TAB_LABELS.map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    cn(
                      'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                      'border-b-2 outline-none focus-visible:bg-surface-50',
                      selected
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
                    )
                  }
                >
                  {label}
                </Tab>
              ))}
            </TabList>
          </div>

          <div className="px-4">
            <Suspense fallback={<TabFallback />}>
              <TabPanels>
                <TabPanel className="py-4">
                  <ProfileSettings />
                </TabPanel>
                <TabPanel className="py-4">
                  <PreferenceSettings />
                </TabPanel>
                <TabPanel className="py-4">
                  <OrganizationSettings />
                </TabPanel>
                <TabPanel className="py-4">
                  <WorkspaceSettings />
                </TabPanel>
                <TabPanel className="py-4">
                  <NotificationSettings />
                </TabPanel>
                <TabPanel className="py-4">
                  <ApiKeySettings />
                </TabPanel>
              </TabPanels>
            </Suspense>
          </div>
        </TabGroup>
      </div>
    </div>
  )
}
