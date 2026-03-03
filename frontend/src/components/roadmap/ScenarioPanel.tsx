import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import AddIcon from '@mui/icons-material/Add'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import EditIcon from '@mui/icons-material/Edit'
import type { RoadmapScenario, ScenarioOverride } from '@/hooks/useRoadmap'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ScenarioPanelProps {
  planId: string
  scenarios: RoadmapScenario[]
  selectedScenarioId?: string | null
  onSelectScenario?: (scenarioId: string) => void
  onCreateScenario?: (name: string) => void
  onUpdateOverride?: (scenarioId: string, override: ScenarioOverride) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScenarioPanel({
  planId: _planId,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onCreateScenario,
  onUpdateOverride,
}: ScenarioPanelProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState('')
  const [editingOverride, setEditingOverride] = useState<{
    scenarioId: string
    override: ScenarioOverride
  } | null>(null)

  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ??
    scenarios.find((s) => s.is_baseline) ??
    scenarios[0]

  const handleCreate = () => {
    if (newScenarioName.trim() && onCreateScenario) {
      onCreateScenario(newScenarioName.trim())
    }
    setNewScenarioName('')
    setCreateDialogOpen(false)
  }

  const handleSaveOverride = () => {
    if (editingOverride && onUpdateOverride) {
      onUpdateOverride(editingOverride.scenarioId, editingOverride.override)
    }
    setEditingOverride(null)
  }

  return (
    <Box
      sx={{
        width: 340,
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Scenarios
        </Typography>
        <IconButton size="small" onClick={() => setCreateDialogOpen(true)} aria-label="New scenario">
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Scenario list */}
      <List dense sx={{ flex: '0 0 auto', overflowY: 'auto', maxHeight: 220 }}>
        {scenarios.length === 0 && (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No scenarios created yet.
            </Typography>
          </Box>
        )}
        {scenarios.map((scenario) => (
          <ListItemButton
            key={scenario.id}
            selected={activeScenario?.id === scenario.id}
            onClick={() => onSelectScenario?.(scenario.id)}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {scenario.is_baseline ? (
                <StarIcon fontSize="small" color="warning" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={scenario.name}
              secondary={
                scenario.is_baseline ? (
                  <Chip label="Baseline" size="small" color="warning" variant="outlined" />
                ) : undefined
              }
            />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Overrides for active scenario */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" gutterBottom>
          Overrides
          {activeScenario && (
            <Typography component="span" variant="caption" sx={{ ml: 1 }} color="text.secondary">
              ({activeScenario.name})
            </Typography>
          )}
        </Typography>

        {activeScenario && activeScenario.overrides.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No date or assignee overrides in this scenario.
          </Typography>
        )}

        {activeScenario && activeScenario.overrides.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Issue</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Start</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Due</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {activeScenario.overrides.map((ov) => (
                <TableRow key={ov.issue_id}>
                  <TableCell sx={{ fontSize: 12 }}>{ov.issue_id.slice(0, 8)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{ov.start_date ?? '---'}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{ov.due_date ?? '---'}</TableCell>
                  <TableCell padding="checkbox">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setEditingOverride({ scenarioId: activeScenario.id, override: { ...ov } })
                      }
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* ---- Create Scenario Dialog ---- */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Scenario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Scenario Name"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newScenarioName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Edit Override Dialog ---- */}
      <Dialog
        open={editingOverride !== null}
        onClose={() => setEditingOverride(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Override</DialogTitle>
        <DialogContent>
          {editingOverride && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editingOverride.override.start_date ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      start_date: e.target.value || null,
                    },
                  })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={editingOverride.override.due_date ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      due_date: e.target.value || null,
                    },
                  })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Assignee ID (override)"
                value={editingOverride.override.assignee_id ?? ''}
                onChange={(e) =>
                  setEditingOverride({
                    ...editingOverride,
                    override: {
                      ...editingOverride.override,
                      assignee_id: e.target.value || null,
                    },
                  })
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingOverride(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOverride}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
