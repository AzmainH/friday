import { useState, useCallback } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import LinkIcon from '@mui/icons-material/Link'
import { useUpdateDecision } from '@/hooks/useDecisions'
import type { DecisionDetail as DecisionDetailType } from '@/hooks/useDecisions'
import { formatDate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DECISION_STATUSES = ['proposed', 'accepted', 'rejected', 'deferred', 'superseded'] as const

const STATUS_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  proposed: 'info',
  accepted: 'success',
  rejected: 'error',
  deferred: 'warning',
  superseded: 'default',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DecisionDetailProps {
  decision: DecisionDetailType
  onLinkIssue?: (decisionId: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DecisionDetail({ decision, onLinkIssue }: DecisionDetailProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: decision.title,
    description: decision.description ?? '',
    status: decision.status,
    outcome: decision.outcome ?? '',
    rationale: decision.rationale ?? '',
  })

  const updateDecision = useUpdateDecision()

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleEditStart = useCallback(() => {
    setDraft({
      title: decision.title,
      description: decision.description ?? '',
      status: decision.status,
      outcome: decision.outcome ?? '',
      rationale: decision.rationale ?? '',
    })
    setEditing(true)
    setExpanded(true)
  }, [decision])

  const handleEditCancel = useCallback(() => {
    setEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    await updateDecision.mutateAsync({
      id: decision.id,
      body: {
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        outcome: draft.outcome || null,
        rationale: draft.rationale || null,
      },
    })
    setEditing(false)
  }, [updateDecision, decision.id, draft])

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            onClick={handleToggle}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>

          {editing ? (
            <TextField
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              size="small"
              fullWidth
              variant="standard"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ flex: 1, cursor: 'pointer' }}
              onClick={handleToggle}
            >
              {decision.title}
            </Typography>
          )}

          <Chip
            label={decision.status}
            color={STATUS_COLORS[decision.status] ?? 'default'}
            size="small"
          />

          {!editing && (
            <IconButton size="small" onClick={handleEditStart}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {decision.decided_date && !expanded && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
            Decided {formatDate(decision.decided_date)}
          </Typography>
        )}
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Divider sx={{ mb: 2 }} />

          {editing ? (
            <Stack spacing={2}>
              <TextField
                select
                label="Status"
                size="small"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              >
                {DECISION_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Description"
                multiline
                minRows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Outcome"
                multiline
                minRows={2}
                value={draft.outcome}
                onChange={(e) => setDraft((d) => ({ ...d, outcome: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Rationale"
                multiline
                minRows={2}
                value={draft.rationale}
                onChange={(e) => setDraft((d) => ({ ...d, rationale: e.target.value }))}
                fullWidth
              />
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {decision.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Description
                  </Typography>
                  <Typography variant="body2">{decision.description}</Typography>
                </Box>
              )}

              {decision.outcome && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Outcome
                  </Typography>
                  <Typography variant="body2">{decision.outcome}</Typography>
                </Box>
              )}

              {decision.rationale && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Rationale
                  </Typography>
                  <Typography variant="body2">{decision.rationale}</Typography>
                </Box>
              )}

              {decision.decided_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Decided Date
                  </Typography>
                  <Typography variant="body2">{formatDate(decision.decided_date)}</Typography>
                </Box>
              )}

              {decision.linked_issue_ids.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Linked Issues
                  </Typography>
                  <Typography variant="body2">
                    {decision.linked_issue_ids.length} issue(s) linked
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          {editing ? (
            <>
              <Button
                size="small"
                startIcon={<CloseIcon />}
                onClick={handleEditCancel}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                variant="contained"
                disabled={updateDecision.isPending}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              {onLinkIssue && (
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => onLinkIssue(decision.id)}
                >
                  Link Issue
                </Button>
              )}
            </>
          )}
        </CardActions>
      </Collapse>
    </Card>
  )
}
