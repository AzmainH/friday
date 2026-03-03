import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useProjectDetail, useProjectMembers } from '@/hooks/useProjectSettings'
import { useAuthStore } from '@/stores/authStore'

// Lazy-load each settings tab for code splitting
const GeneralSettings = lazy(() => import('@/components/settings/GeneralSettings'))
const MemberSettings = lazy(() => import('@/components/settings/MemberSettings'))
const IssueTypeSettings = lazy(() => import('@/components/settings/IssueTypeSettings'))
const CustomFieldSettings = lazy(() => import('@/components/settings/CustomFieldSettings'))
const LabelSettings = lazy(() => import('@/components/settings/LabelSettings'))
const WorkflowEditor = lazy(() => import('@/components/settings/WorkflowEditor'))

const TAB_LABELS = [
  'General',
  'Members',
  'Issue Types',
  'Custom Fields',
  'Labels',
  'Workflow',
]

function TabFallback() {
  return (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
    </div>
  )
}

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const currentUserId = useAuthStore((s) => s.currentUserId)

  const { data: project, isLoading: projectLoading } = useProjectDetail(projectId)
  const { data: members = [] } = useProjectMembers(projectId)

  // Check if current user is an admin of this project
  const currentMember = members.find((m) => m.user_id === currentUserId)
  const isAdmin = currentMember?.role === 'admin'
  const hasCheckedAccess = !projectLoading && members.length > 0

  if (!projectId) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          No project ID provided.
        </div>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
        </div>
      </div>
    )
  }

  // Show access warning for non-admins (but still allow viewing for graceful UX)
  if (hasCheckedAccess && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-8 text-center">
          <Lock className="h-12 w-12 text-text-secondary mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Admin Access Required
          </h2>
          <p className="text-sm text-text-secondary">
            You need admin permissions on this project to access settings.
            Contact your project lead to request access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-4">
        {project?.name ?? 'Project'} Settings
      </h1>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mt-2">
        <TabGroup>
          <div className="border-b border-surface-200">
            <TabList className="flex gap-0 overflow-x-auto px-2" aria-label="Project settings tabs">
              {TAB_LABELS.map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    cn(
                      'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                      'border-b-2 outline-none focus-visible:bg-surface-50',
                      selected
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300'
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
                  <GeneralSettings projectId={projectId} />
                </TabPanel>
                <TabPanel className="py-4">
                  <MemberSettings projectId={projectId} />
                </TabPanel>
                <TabPanel className="py-4">
                  <IssueTypeSettings projectId={projectId} />
                </TabPanel>
                <TabPanel className="py-4">
                  <CustomFieldSettings projectId={projectId} />
                </TabPanel>
                <TabPanel className="py-4">
                  <LabelSettings projectId={projectId} />
                </TabPanel>
                <TabPanel className="py-4">
                  <WorkflowEditor projectId={projectId} />
                </TabPanel>
              </TabPanels>
            </Suspense>
          </div>
        </TabGroup>
      </div>
    </div>
  )
}
