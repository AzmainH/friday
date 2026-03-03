import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Paper from '@mui/material/Paper'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
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
    <Box
      sx={{
        '& p': { my: 0.5 },
        '& h1': { fontSize: '1.75rem', fontWeight: 700, mt: 3, mb: 1 },
        '& h2': { fontSize: '1.4rem', fontWeight: 600, mt: 2, mb: 0.75 },
        '& h3': { fontSize: '1.15rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
        '& ul, & ol': { pl: 3 },
        '& ul[data-type="taskList"]': {
          listStyle: 'none',
          pl: 0,
          '& li': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            '& label': { mt: 0.25 },
          },
        },
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
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 1,
        },
        '& mark': {
          bgcolor: 'warning.light',
          borderRadius: 0.25,
          px: 0.25,
        },
        '& blockquote': {
          borderLeft: '3px solid',
          borderColor: 'divider',
          pl: 2,
          ml: 0,
          color: 'text.secondary',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            px: 1.5,
            py: 1,
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 600,
          },
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          my: 2,
        },
      }}
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
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
        <Skeleton variant="text" width="60%" height={48} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 3 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={120} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
      </Box>
    )
  }

  // Page not found
  if (!page) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          The wiki page you are looking for does not exist or has been deleted.
        </Typography>
        {onBack && (
          <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
            Go back
          </Button>
        )}
      </Box>
    )
  }

  // Editing mode
  if (isEditing) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setIsEditing(false)}
            sx={{ mr: 'auto' }}
          >
            Back to view
          </Button>
        </Box>
        <WikiEditor page={page} onSave={handleSave} />
      </Box>
    )
  }

  // Read-only view
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
      {/* Back button */}
      {onBack && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 2 }}
          color="inherit"
          size="small"
        >
          Back
        </Button>
      )}

      {/* Title */}
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1.5 }}>
        {page.title}
      </Typography>

      {/* Metadata bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        {page.updated_by && (
          <Chip
            icon={<PersonIcon />}
            label={`Edited by ${page.updated_by}`}
            size="small"
            variant="outlined"
          />
        )}
        <Chip
          icon={<CalendarTodayIcon />}
          label={`Updated ${formatRelativeTime(page.updated_at)}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`v${page.version}`}
          size="small"
          variant="outlined"
          color="default"
        />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(true)}
          >
            History
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Content */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          minHeight: 200,
          borderRadius: 2,
        }}
      >
        {page.content ? (
          <PageContent page={page} />
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            This page has no content yet. Click &quot;Edit&quot; to start writing.
          </Typography>
        )}
      </Paper>

      {/* Page metadata footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 2,
          px: 1,
        }}
      >
        <Typography variant="caption" color="text.disabled">
          Created {formatDateTime(page.created_at)}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Last updated {formatDateTime(page.updated_at)}
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Comments section */}
      <WikiComments pageId={pageId} />

      {/* Version history drawer */}
      <WikiVersionHistory
        pageId={pageId}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        mode="drawer"
      />
    </Box>
  )
}
