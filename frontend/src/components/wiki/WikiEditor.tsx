import { useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, Save } from 'lucide-react'
import { cn } from '@/lib/cn'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { useUpdatePage } from '@/hooks/useWiki'
import type { WikiPage } from '@/types/api'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiEditorProps {
  page: WikiPage
  onSave: (updatedPage: WikiPage) => void
}

// ---------------------------------------------------------------------------
// Save status
// ---------------------------------------------------------------------------

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ---------------------------------------------------------------------------
// WikiEditor
// ---------------------------------------------------------------------------

export default function WikiEditor({ page, onSave }: WikiEditorProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content ?? '')
  const [currentVersion, setCurrentVersion] = useState(page.version)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePage = useUpdatePage()

  // Reset state when page changes
  useEffect(() => {
    setTitle(page.title)
    setContent(page.content ?? '')
    setCurrentVersion(page.version)
    setSaveStatus('idle')
    updatePage.dismissConflict()
  }, [page.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (!title.trim()) return

    setSaveStatus('saving')

    updatePage.mutate(
      {
        pageId: page.id,
        title: title.trim(),
        content,
        expected_version: currentVersion,
      },
      {
        onSuccess: (updatedPage) => {
          setSaveStatus('saved')
          setCurrentVersion(updatedPage.version)
          onSave(updatedPage)

          // Clear "Saved" after 3 seconds
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(() => {
            setSaveStatus('idle')
          }, 3000)
        },
        onError: () => {
          // If not a version conflict, show generic error status
          if (!updatePage.conflictError) {
            setSaveStatus('error')
          }
        },
      },
    )
  }, [title, content, currentVersion, page.id, updatePage, onSave])

  const handleReload = useCallback(() => {
    // Reload the page from server - dismiss conflict and reset state
    updatePage.dismissConflict()
    setSaveStatus('idle')
    // Parent component should re-fetch the page
    window.location.reload()
  }, [updatePage])

  const handleContentChange = useCallback((html: string) => {
    setContent(html)
    setSaveStatus('idle')
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleSave])

  return (
    <div className="flex flex-col h-full">
      {/* Version conflict alert */}
      {updatePage.conflictError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-[--radius-sm] mb-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold mb-0.5">Version conflict</p>
            <p className="text-sm">
              This page was modified by another user since you started editing. Your version is{' '}
              {currentVersion}, but the server has version{' '}
              {updatePage.conflictError.current_version}. Reload to get the latest version,
              or copy your changes before reloading.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReload}
            className="text-sm font-medium text-amber-800 hover:text-amber-900 underline shrink-0"
          >
            Reload page
          </button>
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setSaveStatus('idle')
        }}
        placeholder="Page title"
        className="w-full text-[2rem] font-bold leading-tight outline-none bg-transparent border-none placeholder:text-text-tertiary mb-4"
      />

      {/* Content editor */}
      <div className="flex-1 min-h-0">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          minHeight={400}
        />
      </div>

      {/* Bottom bar: save button + status */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-200">
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
              <span className="text-sm text-text-secondary">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">Failed to save. Please try again.</span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-xs text-text-tertiary">Version {currentVersion}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !title.trim()}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[--radius-sm] transition-colors',
            'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
            'disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  )
}
