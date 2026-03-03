import { useState, useCallback } from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
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

interface TabPanelProps {
  children: React.ReactNode
  value: number
  index: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null
  return <Box sx={{ py: 2 }}>{children}</Box>
}

export default function IssueDetailPanel({ issueId, open, onClose }: IssueDetailPanelProps) {
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', md: '60%' },
            maxWidth: 960,
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 56,
        }}
      >
        {isLoading ? (
          <Skeleton variant="text" width="40%" height={32} />
        ) : issue ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
              sx={{ flexShrink: 0 }}
            >
              {issue.issue_key}
            </Typography>

            {isEditingSummary ? (
              <TextField
                value={summaryValue}
                onChange={(e) => setSummaryValue(e.target.value)}
                onBlur={handleSummarySave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSummarySave()
                  if (e.key === 'Escape') setIsEditingSummary(false)
                }}
                size="small"
                fullWidth
                autoFocus
                variant="standard"
                sx={{ '& .MuiInput-input': { fontSize: '1.1rem', fontWeight: 600 } }}
              />
            ) : (
              <Typography
                variant="h6"
                sx={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': { color: 'primary.main' },
                }}
                onClick={handleSummaryClick}
              >
                {issue.summary}
              </Typography>
            )}
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      {isLoading ? (
        <Box sx={{ p: 3 }}>
          <Skeleton variant="text" width="50%" height={36} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="30%" height={22} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 2 }} />
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
        </Box>
      ) : issue ? (
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left column: Description + Tabs */}
          <Box
            sx={{
              flex: '0 0 65%',
              overflow: 'auto',
              px: 3,
              py: 2,
              borderRight: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Description */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description
            </Typography>
            <RichTextEditor
              content={issue.description ?? ''}
              onChange={handleDescriptionChange}
              placeholder="Add a description..."
              minHeight={120}
            />

            <Divider sx={{ my: 2 }} />

            {/* Tabs: Comments / Activity */}
            <Tabs
              value={activeTab}
              onChange={(_e, val) => setActiveTab(val)}
              sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
            >
              <Tab label="Comments" />
              <Tab label="Activity" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <CommentSection issueId={issue.id} />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <ActivityLog issueId={issue.id} />
            </TabPanel>
          </Box>

          {/* Right column: Fields */}
          <Box
            sx={{
              flex: '0 0 35%',
              overflow: 'auto',
              py: 1,
            }}
          >
            <IssueFieldsPanel issue={issue} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary">Issue not found.</Typography>
        </Box>
      )}
    </Drawer>
  )
}
