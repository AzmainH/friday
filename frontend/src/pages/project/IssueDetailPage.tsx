import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs'
import { Divider } from '@/components/ui/Divider'
import RichTextEditor from '@/components/editor/RichTextEditor'
import CommentSection from '@/components/issue/CommentSection'
import ActivityLog from '@/components/issue/ActivityLog'
import IssueFieldsPanel from '@/components/issue/IssueFieldsPanel'
import { useIssueDetail, useIssueUpdate } from '@/hooks/useIssueDetail'

export default function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>()
  const navigate = useNavigate()
  const { data: issue, isLoading } = useIssueDetail(issueId ?? null)
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton-shimmer h-8 w-1/3 rounded" />
        <div className="skeleton-shimmer h-6 w-1/2 rounded" />
        <div className="skeleton-shimmer mt-4 h-[200px] rounded-[--radius-sm]" />
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-sm text-text-secondary">Issue not found.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-300">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
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
                'text-xl font-semibold text-text-primary',
                'focus:outline-none',
              )}
            />
          ) : (
            <h1
              className={cn(
                'cursor-pointer text-xl font-semibold text-text-primary',
                'hover:text-primary-600 transition-colors duration-150',
              )}
              onClick={handleSummaryClick}
            >
              {issue.summary}
            </h1>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Description + Tabs (65%) */}
        <div
          className={cn(
            'w-[65%] shrink-0 overflow-y-auto px-6 py-4',
            'border-r border-surface-200 dark:border-surface-300',
          )}
        >
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Description</h3>
          <RichTextEditor
            content={issue.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder="Add a description..."
            minHeight={160}
          />

          <Divider className="my-4" />

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
    </div>
  )
}
