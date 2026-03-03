import { useState, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SaveIcon from '@mui/icons-material/Save'
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Version conflict alert */}
      {updatePage.conflictError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="warning" size="small" onClick={handleReload}>
              Reload page
            </Button>
          }
        >
          <AlertTitle>Version conflict</AlertTitle>
          This page was modified by another user since you started editing. Your version is{' '}
          {currentVersion}, but the server has version{' '}
          {updatePage.conflictError.current_version}. Reload to get the latest version,
          or copy your changes before reloading.
        </Alert>
      )}

      {/* Title */}
      <TextField
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setSaveStatus('idle')
        }}
        placeholder="Page title"
        variant="standard"
        fullWidth
        InputProps={{
          disableUnderline: true,
          sx: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.3,
          },
        }}
        sx={{ mb: 2 }}
      />

      {/* Content editor */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          minHeight={400}
        />
      </Box>

      {/* Bottom bar: save button + status */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saveStatus === 'saving' && (
            <>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Saving...
              </Typography>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
              <Typography variant="body2" color="success.main">
                Saved
              </Typography>
            </>
          )}
          {saveStatus === 'error' && (
            <Typography variant="body2" color="error">
              Failed to save. Please try again.
            </Typography>
          )}
          {saveStatus === 'idle' && (
            <Typography variant="caption" color="text.disabled">
              Version {currentVersion}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !title.trim()}
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}
