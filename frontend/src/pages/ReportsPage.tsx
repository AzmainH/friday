import { useState, useCallback, useMemo } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import BarChartIcon from '@mui/icons-material/BarChart'
import { formatDateTime } from '@/utils/formatters'
import ReportViewer from '@/components/reports/ReportViewer'
import {
  useSavedReports,
  useRunReport,
  useCreateReport,
  useDeleteReport,
  type ReportType,
  type ReportConfig,
  type ReportResult,
  type SavedReport,
} from '@/hooks/useReports'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'velocity', label: 'Velocity' },
  { value: 'burndown', label: 'Burndown' },
  { value: 'burnup', label: 'Burn-Up' },
  { value: 'cumulative_flow', label: 'Cumulative Flow' },
  { value: 'cycle_time', label: 'Cycle Time' },
  { value: 'throughput', label: 'Throughput' },
  { value: 'workload', label: 'Workload' },
  { value: 'custom', label: 'Custom' },
]

const GROUP_BY_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
  { value: 'issue_type', label: 'Issue Type' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'label', label: 'Label' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  // Saved reports list
  const { data: savedReports, isLoading: reportsLoading, error: reportsError } = useSavedReports()
  const deleteReport = useDeleteReport()
  const createReport = useCreateReport()

  // Report runner state
  const [selectedType, setSelectedType] = useState<ReportType | ''>('')
  const [config, setConfig] = useState<ReportConfig>({})
  const [runConfig, setRunConfig] = useState<{ type: ReportType; config: ReportConfig } | null>(null)

  // Run report query — only fires when runConfig is set
  const {
    data: reportResult,
    isLoading: reportRunning,
    error: reportError,
  } = useRunReport(
    runConfig?.type,
    runConfig?.config,
  )

  // Save report dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  // Selected saved report (to view details)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)

  const selectedSavedReport = useMemo(
    () => savedReports?.find((r) => r.id === selectedSavedId) ?? null,
    [savedReports, selectedSavedId],
  )

  // ---------- Handlers ----------

  const handleRunReport = useCallback(() => {
    if (!selectedType) return
    setRunConfig({ type: selectedType as ReportType, config })
    setSelectedSavedId(null)
  }, [selectedType, config])

  const handleRunSavedReport = useCallback((report: SavedReport) => {
    setSelectedType(report.report_type)
    setConfig(report.config_json)
    setRunConfig({ type: report.report_type, config: report.config_json })
    setSelectedSavedId(report.id)
  }, [])

  const handleDeleteReport = useCallback(
    (id: string) => {
      deleteReport.mutate(id)
      if (selectedSavedId === id) {
        setSelectedSavedId(null)
      }
    },
    [deleteReport, selectedSavedId],
  )

  const handleSaveReport = useCallback(() => {
    if (!selectedType || !saveName.trim()) return
    createReport.mutate(
      {
        name: saveName.trim(),
        report_type: selectedType as ReportType,
        config_json: config,
      },
      {
        onSuccess: () => {
          setSaveDialogOpen(false)
          setSaveName('')
        },
      },
    )
  }, [selectedType, saveName, config, createReport])

  const handleConfigChange = useCallback(
    (field: keyof ReportConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig((prev) => ({ ...prev, [field]: e.target.value }))
    },
    [],
  )

  // ---------- Render ----------

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Reports
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left sidebar: saved reports */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Saved Reports
            </Typography>
          </Box>

          {reportsLoading ? (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : reportsError ? (
            <Alert severity="error" sx={{ m: 1 }}>
              Failed to load reports
            </Alert>
          ) : savedReports && savedReports.length > 0 ? (
            <List dense disablePadding>
              {savedReports.map((report) => (
                <ListItemButton
                  key={report.id}
                  selected={selectedSavedId === report.id}
                  onClick={() => handleRunSavedReport(report)}
                  sx={{ py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BarChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={report.name}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={report.report_type.replace(/_/g, ' ')}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(report.updated_at)}
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true }}
                  />
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteReport(report.id)
                    }}
                    aria-label={`Delete report ${report.name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No saved reports yet.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Main content area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Config form */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Run New Report
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 2,
              }}
            >
              {/* Report type */}
              <TextField
                select
                label="Report Type"
                size="small"
                fullWidth
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ReportType | '')}
              >
                <MenuItem value="">
                  <em>Select a type...</em>
                </MenuItem>
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Group by */}
              <TextField
                select
                label="Group By"
                size="small"
                fullWidth
                value={config.group_by ?? ''}
                onChange={handleConfigChange('group_by')}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {GROUP_BY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Date from */}
              <TextField
                label="Date From"
                type="date"
                size="small"
                fullWidth
                value={config.date_from ?? ''}
                onChange={handleConfigChange('date_from')}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {/* Date to */}
              <TextField
                label="Date To"
                type="date"
                size="small"
                fullWidth
                value={config.date_to ?? ''}
                onChange={handleConfigChange('date_to')}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              {/* Project ID */}
              <TextField
                label="Project ID"
                size="small"
                fullWidth
                placeholder="Optional"
                value={config.project_id ?? ''}
                onChange={handleConfigChange('project_id')}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunReport}
                disabled={!selectedType || reportRunning}
              >
                {reportRunning ? 'Running...' : 'Run Report'}
              </Button>

              {reportResult && (
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={() => {
                    setSaveName('')
                    setSaveDialogOpen(true)
                  }}
                >
                  Save Report
                </Button>
              )}
            </Box>
          </Paper>

          <Divider sx={{ mb: 3 }} />

          {/* Report results */}
          {reportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to run report. Please check your configuration and try again.
            </Alert>
          )}

          {reportRunning ? (
            <Box>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: 2 }} />
            </Box>
          ) : reportResult ? (
            <ReportViewer
              reportType={runConfig?.type ?? 'custom'}
              data={reportResult}
            />
          ) : (
            <Box
              sx={{
                py: 8,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <BarChartIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                Select a report type and click "Run Report" to see results.
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                Or select a saved report from the sidebar.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Save report dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Save Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Report Name"
            fullWidth
            size="small"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            sx={{ mt: 1 }}
            placeholder="e.g., Sprint Velocity Q1"
          />
          {selectedType && (
            <Box sx={{ mt: 1.5 }}>
              <Chip
                label={selectedType.replace(/_/g, ' ')}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveReport}
            disabled={!saveName.trim() || createReport.isPending}
          >
            {createReport.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
