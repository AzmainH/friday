import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import CloseIcon from '@mui/icons-material/Close'
import RestoreIcon from '@mui/icons-material/Restore'
import HistoryIcon from '@mui/icons-material/History'
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Version {version.version}</Typography>
            <Chip label={formatRelativeTime(version.created_at)} size="small" variant="outlined" />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {version.title}
        </Typography>
        {version.content ? (
          <Box
            sx={{
              '& p': { my: 0.5 },
              '& h1': { fontSize: '1.75rem', fontWeight: 700, mt: 2, mb: 1 },
              '& h2': { fontSize: '1.4rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
              '& h3': { fontSize: '1.15rem', fontWeight: 600, mt: 1, mb: 0.5 },
              '& ul, & ol': { pl: 3 },
              '& pre': {
                bgcolor: 'action.hover',
                borderRadius: 1,
                p: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflow: 'auto',
              },
              '& code': {
                bgcolor: 'action.hover',
                borderRadius: 0.5,
                px: 0.5,
                py: 0.25,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
              '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
            }}
            dangerouslySetInnerHTML={{ __html: version.content }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            (empty content)
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<RestoreIcon />}
          onClick={onRestore}
          disabled={isRestoring}
        >
          Restore this version
        </Button>
      </DialogActions>
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
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        ))}
      </Box>
    )
  }

  const versionList = versions ?? []

  if (versionList.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No version history available yet.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <List disablePadding>
        {versionList.map((version, index) => (
          <Box key={version.id}>
            <ListItemButton
              onClick={() => setSelectedVersion(version)}
              selected={selectedVersion?.id === version.id}
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Version {version.version}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Current" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" component="span">
                      {formatDateTime(version.created_at)}
                    </Typography>
                    {version.change_summary && (
                      <Typography variant="caption" color="text.secondary" component="span">
                        {version.change_summary}
                      </Typography>
                    )}
                    {version.edited_by && (
                      <Typography variant="caption" color="text.disabled" component="span">
                        by {version.edited_by}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
            {index < versionList.length - 1 && <Divider />}
          </Box>
        ))}
      </List>

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
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Restore version</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This will replace the current page content with version {selectedVersion?.version}.
            The current version will be saved in history.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestore(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRestore}
            disabled={restoreVersion.isPending}
            startIcon={<RestoreIcon />}
          >
            Restore
          </Button>
        </DialogActions>
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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              <Typography variant="h6">Version history</Typography>
            </Box>
            {onClose && (
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <VersionList pageId={pageId} onClose={onClose} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 360, maxWidth: '100vw' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Version history
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <VersionList pageId={pageId} onClose={onClose} />
      </Box>
    </Drawer>
  )
}
