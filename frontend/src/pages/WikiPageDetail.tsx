import { useState, useCallback } from 'react'
import { Pencil, History, ArrowLeft, User, Calendar } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from '@/components/ui/Skeleton'
import { Divider } from '@/components/ui/Divider'
import WikiEditor from '@/components/wiki/WikiEditor'
import WikiVersionHistory from '@/components/wiki/WikiVersionHistory'
import WikiComments from '@/components/wiki/WikiComments'
import { useWikiPage } from '@/hooks/useWiki'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'
import type { WikiPage } from '@/types/api'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiPageDetailProps {
  pageId: string
  onBack?: () => void
}

// ---------------------------------------------------------------------------
// Read-only rendered content
// ---------------------------------------------------------------------------

function PageContent({ page }: { page: WikiPage }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
    />
  )
}

// ---------------------------------------------------------------------------
// WikiPageDetail
// ---------------------------------------------------------------------------

export default function WikiPageDetail({ pageId, onBack }: WikiPageDetailProps) {
  const { data: page, isLoading, refetch } = useWikiPage(pageId)
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleSave = useCallback(
    (_updatedPage: WikiPage) => {
      setIsEditing(false)
      refetch()
    },
    [refetch],
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto p-8">
        <Skeleton width="60%" height={40} rounded="sm" />
        <div className="flex gap-2 mt-3 mb-6">
          <Skeleton width={80} height={24} rounded="full" />
          <Skeleton width={120} height={24} rounded="full" />
          <Skeleton width={100} height={24} rounded="full" />
        </div>
        <Skeleton width="100%" height={400} rounded="sm" />
      </div>
    )
  }

  // Page not found
  if (!page) {
    return (
      <div className="max-w-[900px] mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Page not found
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          The wiki page you are looking for does not exist or has been deleted.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        )}
      </div>
    )
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="max-w-[900px] mx-auto p-8">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mr-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to view
          </button>
        </div>
        <WikiEditor page={page} onSave={handleSave} />
      </div>
    )
  }

  // Read-only view
  return (
    <div className="max-w-[900px] mx-auto p-8">
      {/* Back button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-text-primary mb-3">
        {page.title}
      </h1>

      {/* Metadata bar */}
      <div className="flex items-center flex-wrap gap-3 mb-6">
        {page.updated_by && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-surface-200 rounded-full text-text-secondary">
            <User className="h-3 w-3" />
            Edited by {page.updated_by}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-surface-200 rounded-full text-text-secondary">
          <Calendar className="h-3 w-3" />
          Updated {formatRelativeTime(page.updated_at)}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-surface-200 rounded-full text-text-secondary">
          v{page.version}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[--radius-sm] border border-surface-200 text-text-primary hover:bg-surface-50 transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[--radius-sm] transition-colors',
              'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
            )}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      <Divider className="mb-6" />

      {/* Content */}
      <div className="p-8 min-h-[200px] border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
        {page.content ? (
          <PageContent page={page} />
        ) : (
          <p className="text-sm text-text-secondary italic">
            This page has no content yet. Click &quot;Edit&quot; to start writing.
          </p>
        )}
      </div>

      {/* Page metadata footer */}
      <div className="flex justify-between mt-4 px-2">
        <span className="text-xs text-text-tertiary">
          Created {formatDateTime(page.created_at)}
        </span>
        <span className="text-xs text-text-tertiary">
          Last updated {formatDateTime(page.updated_at)}
        </span>
      </div>

      <Divider className="my-8" />

      {/* Comments section */}
      <WikiComments pageId={pageId} />

      {/* Version history drawer */}
      <WikiVersionHistory
        pageId={pageId}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        mode="drawer"
      />
    </div>
  )
}
