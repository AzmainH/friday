import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X, RotateCcw, History } from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePageVersions, useRestoreVersion } from '@/hooks/useWiki'
import type { WikiPageVersion } from '@/hooks/useWiki'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiVersionHistoryProps {
  pageId: string
  open?: boolean
  onClose?: () => void
  mode?: 'drawer' | 'dialog'
}

// ---------------------------------------------------------------------------
// Version preview dialog
// ---------------------------------------------------------------------------

function VersionPreview({
  version,
  open,
  onClose,
  onRestore,
  isRestoring,
}: {
  version: WikiPageVersion | null
  open: boolean
  onClose: () => void
  onRestore: () => void
  isRestoring: boolean
}) {
  if (!version) return null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-xl">
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-semibold text-text-primary">
                Version {version.version}
              </DialogTitle>
              <span className="px-2 py-0.5 text-xs border border-surface-300 text-text-secondary rounded-full">
                {formatRelativeTime(version.created_at)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-5 py-3 border-t border-b border-surface-200">
            <h2 className="text-xl font-semibold text-text-primary mb-3">
              {version.title}
            </h2>
            {version.content ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: version.content }}
              />
            ) : (
              <p className="text-sm text-text-secondary">(empty content)</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onRestore}
              disabled={isRestoring}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw size={14} />
              Restore this version
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Version list
// ---------------------------------------------------------------------------

function VersionList({
  pageId,
  onClose,
}: {
  pageId: string
  onClose?: () => void
}) {
  const { data: versions, isLoading } = usePageVersions(pageId)
  const restoreVersion = useRestoreVersion()
  const [selectedVersion, setSelectedVersion] = useState<WikiPageVersion | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)

  const handleRestore = () => {
    if (!selectedVersion) return
    restoreVersion.mutate(
      { pageId, versionId: selectedVersion.id },
      {
        onSuccess: () => {
          setConfirmRestore(false)
          setSelectedVersion(null)
          onClose?.()
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="mb-4">
            <div className="h-4 w-[60%] bg-surface-100 animate-pulse rounded mb-1" />
            <div className="h-3.5 w-[40%] bg-surface-100 animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  const versionList = versions ?? []

  if (versionList.length === 0) {
    return (
      <div className="p-6 text-center">
        <History size={40} className="mx-auto text-text-tertiary mb-2" />
        <p className="text-sm text-text-secondary">
          No version history available yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <div>
        {versionList.map((version, index) => (
          <div key={version.id}>
            <button
              type="button"
              onClick={() => setSelectedVersion(version)}
              className={cn(
                'w-full text-left px-4 py-3 transition-colors',
                selectedVersion?.id === version.id
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-surface-50',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  Version {version.version}
                </span>
                {index === 0 && (
                  <span className="px-2 py-0.5 text-xs border border-primary-500 text-primary-600 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-xs text-text-tertiary">
                  {formatDateTime(version.created_at)}
                </span>
                {version.change_summary && (
                  <span className="text-xs text-text-tertiary">
                    {version.change_summary}
                  </span>
                )}
                {version.edited_by && (
                  <span className="text-xs text-text-tertiary opacity-60">
                    by {version.edited_by}
                  </span>
                )}
              </div>
            </button>
            {index < versionList.length - 1 && (
              <hr className="border-surface-200" />
            )}
          </div>
        ))}
      </div>

      {/* Version preview */}
      <VersionPreview
        version={selectedVersion}
        open={!!selectedVersion}
        onClose={() => setSelectedVersion(null)}
        onRestore={() => setConfirmRestore(true)}
        isRestoring={restoreVersion.isPending}
      />

      {/* Restore confirmation */}
      <Dialog
        open={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        className="relative z-[70]"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-xl">
            <DialogTitle className="text-lg font-semibold px-5 pt-5 pb-2 text-text-primary">
              Restore version
            </DialogTitle>
            <div className="px-5 pb-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-[var(--radius-sm)] p-3 text-sm mt-1">
                This will replace the current page content with version {selectedVersion?.version}.
                The current version will be saved in history.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setConfirmRestore(false)}
                className="px-3 py-1.5 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoreVersion.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw size={14} />
                Restore
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// WikiVersionHistory (drawer or dialog wrapper)
// ---------------------------------------------------------------------------

export default function WikiVersionHistory({
  pageId,
  open = true,
  onClose,
  mode = 'drawer',
}: WikiVersionHistoryProps) {
  if (mode === 'dialog') {
    return (
      <Dialog
        open={open}
        onClose={onClose ?? (() => {})}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <History size={20} className="text-text-secondary" />
                <DialogTitle className="text-lg font-semibold text-text-primary">
                  Version history
                </DialogTitle>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto border-t border-surface-200">
              <VersionList pageId={pageId} onClose={onClose} />
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    )
  }

  // Drawer mode: slide-over from right using Headless UI Dialog
  return (
    <Dialog
      open={open}
      onClose={onClose ?? (() => {})}
      className="relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel
          className="w-[360px] max-w-full flex flex-col bg-white dark:bg-surface-800 shadow-xl transition duration-300 data-[closed]:translate-x-full"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <History size={20} className="text-text-secondary" />
              <DialogTitle className="text-base font-semibold text-text-primary">
                Version history
              </DialogTitle>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            <VersionList pageId={pageId} onClose={onClose} />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
