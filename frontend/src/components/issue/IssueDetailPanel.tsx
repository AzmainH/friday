import { useState, useCallback } from 'react'
import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react'
import { Maximize2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useProjectStore } from '@/stores/projectStore'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs'
import { Divider } from '@/components/ui/Divider'
import RichTextEditor from '@/components/editor/RichTextEditor'
import CommentSection from '@/components/issue/CommentSection'
import ActivityLog from '@/components/issue/ActivityLog'
import IssueFieldsPanel from '@/components/issue/IssueFieldsPanel'
import { useIssueDetail, useIssueUpdate } from '@/hooks/useIssueDetail'

interface IssueDetailPanelProps {
  issueId: string | null
  open: boolean
  onClose: () => void
}

export default function IssueDetailPanel({ issueId, open, onClose }: IssueDetailPanelProps) {
  const navigate = useNavigate()
  const projectId = useProjectStore((s) => s.currentProject?.id)
  const { data: issue, isLoading } = useIssueDetail(issueId)
  const updateMutation = useIssueUpdate()
  const [activeTab, setActiveTab] = useState(0)
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [summaryValue, setSummaryValue] = useState('')

  const handleSummaryClick = () => {
    if (issue) {
      setSummaryValue(issue.summary)
      setIsEditingSummary(true)
    }
  }

  const handleSummarySave = useCallback(() => {
    if (issue && summaryValue.trim() && summaryValue !== issue.summary) {
      updateMutation.mutate({ issueId: issue.id, body: { summary: summaryValue.trim() } })
    }
    setIsEditingSummary(false)
  }, [issue, summaryValue, updateMutation])

  const handleDescriptionChange = useCallback(
    (html: string) => {
      if (issue) {
        updateMutation.mutate({ issueId: issue.id, body: { description: html } })
      }
    },
    [issue, updateMutation],
  )

  return (
    <HeadlessDialog open={open} onClose={onClose} className="relative z-[--z-modal]">
      {/* Backdrop */}
      <DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 bg-black/30 backdrop-blur-sm',
          'transition duration-300 ease-out',
          'data-[closed]:opacity-0',
        )}
      />

      {/* Slide-over panel from right */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
            <DialogPanel
              transition
              className={cn(
                'pointer-events-auto w-screen max-w-[960px] md:w-[60vw]',
                'flex flex-col bg-white shadow-xl dark:bg-surface-100',
                'transition duration-300 ease-out',
                'data-[closed]:translate-x-full',
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex min-h-[56px] items-center justify-between',
                  'border-b border-surface-200 px-6 py-3',
                  'dark:border-surface-300',
                )}
              >
                {isLoading ? (
                  <div className="skeleton-shimmer h-6 w-2/5 rounded" />
                ) : issue ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 text-sm font-semibold text-text-secondary">
                      {issue.issue_key}
                    </span>

                    {isEditingSummary ? (
                      <input
                        value={summaryValue}
                        onChange={(e) => setSummaryValue(e.target.value)}
                        onBlur={handleSummarySave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSummarySave()
                          if (e.key === 'Escape') setIsEditingSummary(false)
                        }}
                        autoFocus
                        className={cn(
                          'flex-1 border-b border-primary-500 bg-transparent',
                          'text-lg font-semibold text-text-primary',
                          'focus:outline-none',
                        )}
                      />
                    ) : (
                      <h2
                        className={cn(
                          'cursor-pointer truncate text-lg font-semibold text-text-primary',
                          'hover:text-primary-600 transition-colors duration-150',
                        )}
                        onClick={handleSummaryClick}
                      >
                        {issue.summary}
                      </h2>
                    )}
                  </div>
                ) : null}

                <div className="ml-2 flex shrink-0 items-center gap-1">
                  {projectId && issueId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/projects/${projectId}/issues/${issueId}`)
                      }}
                      className={cn(
                        'rounded-[--radius-sm] p-1.5 text-text-secondary',
                        'hover:bg-surface-100 hover:text-text-primary',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        'dark:hover:bg-surface-200',
                      )}
                      title="Open full page"
                    >
                      <Maximize2 className="h-4 w-4" />
                      <span className="sr-only">Open full page</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      'rounded-[--radius-sm] p-1.5 text-text-secondary',
                      'hover:bg-surface-100 hover:text-text-primary',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      'dark:hover:bg-surface-200',
                    )}
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>

              {/* Body */}
              {isLoading ? (
                <div className="space-y-4 p-6">
                  <div className="skeleton-shimmer h-8 w-1/2 rounded" />
                  <div className="skeleton-shimmer h-5 w-1/3 rounded" />
                  <div className="skeleton-shimmer mt-4 h-[120px] rounded-[--radius-sm]" />
                  <div className="skeleton-shimmer h-4 w-full rounded" />
                  <div className="skeleton-shimmer h-4 w-4/5 rounded" />
                </div>
              ) : issue ? (
                <div className="flex flex-1 overflow-hidden">
                  {/* Left column: Description + Tabs (65%) */}
                  <div
                    className={cn(
                      'w-[65%] shrink-0 overflow-y-auto px-6 py-4',
                      'border-r border-surface-200 dark:border-surface-300',
                    )}
                  >
                    {/* Description */}
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">
                      Description
                    </h3>
                    <RichTextEditor
                      content={issue.description ?? ''}
                      onChange={handleDescriptionChange}
                      placeholder="Add a description..."
                      minHeight={120}
                    />

                    <Divider className="my-4" />

                    {/* Tabs: Comments / Activity */}
                    <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
                      <TabList>
                        <Tab>Comments</Tab>
                        <Tab>Activity</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel>
                          <CommentSection issueId={issue.id} />
                        </TabPanel>
                        <TabPanel>
                          <ActivityLog issueId={issue.id} />
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </div>

                  {/* Right column: Fields (35%) */}
                  <div className="w-[35%] overflow-y-auto py-2">
                    <IssueFieldsPanel issue={issue} />
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <span className="text-sm text-text-secondary">Issue not found.</span>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </div>
    </HeadlessDialog>
  )
}
