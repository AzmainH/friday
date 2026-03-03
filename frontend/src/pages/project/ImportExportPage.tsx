import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { useStartExport, useTaskProgress } from '@/hooks/useImportExport'
import CSVImportWizard from '@/components/import/CSVImportWizard'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportExportPageProps {
  projectId: string
}

interface ImportExportHistoryEntry {
  id: string
  type: 'import' | 'export'
  format: string
  status: string
  row_count: number | null
  created_at: string
  download_url: string | null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useImportExportHistory(projectId: string) {
  return useQuery<ImportExportHistoryEntry[]>({
    queryKey: ['import-export-history', projectId],
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/import-export/history`)
      return data.data ?? data
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportExportPage({ projectId }: ImportExportPageProps) {
  const [activeTab, setActiveTab] = useState(0) // 0=Import, 1=Export
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportTaskId, setExportTaskId] = useState<string | null>(null)

  const exportMutation = useStartExport()
  const { task: exportTask, isPolling: exportPolling } = useTaskProgress(exportTaskId)
  const { data: history } = useImportExportHistory(projectId)

  const handleStartExport = useCallback(() => {
    exportMutation.mutate(
      { project_id: projectId, format: exportFormat },
      {
        onSuccess: (data) => {
          setExportTaskId(data.task_id)
        },
      },
    )
  }, [projectId, exportFormat, exportMutation])

  const handleDownload = useCallback(() => {
    if (exportTask?.download_url) {
      window.open(exportTask.download_url, '_blank')
    }
  }, [exportTask])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ImportExportIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Import & Export
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="Import" icon={<FileUploadIcon />} iconPosition="start" />
        <Tab label="Export" icon={<FileDownloadIcon />} iconPosition="start" />
      </Tabs>

      {/* Import tab */}
      {activeTab === 0 && <CSVImportWizard projectId={projectId} />}

      {/* Export tab */}
      {activeTab === 1 && (
        <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Export Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Download all issues from this project in your preferred format.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportFormat}
                  label="Format"
                  onChange={(e: SelectChangeEvent) =>
                    setExportFormat(e.target.value as 'csv' | 'json')
                  }
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleStartExport}
                disabled={exportMutation.isPending || exportPolling}
              >
                {exportPolling ? 'Exporting...' : 'Start Export'}
              </Button>
            </Box>

            {/* Export progress */}
            {exportPolling && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant={exportTask?.progress ? 'determinate' : 'indeterminate'}
                  value={exportTask?.progress ?? 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Processing...
                </Typography>
              </Box>
            )}

            {/* Export result */}
            {!exportPolling && exportTask?.status === 'completed' && (
              <Alert
                severity="success"
                action={
                  exportTask.download_url ? (
                    <Button size="small" onClick={handleDownload}>
                      Download
                    </Button>
                  ) : undefined
                }
                sx={{ mb: 2 }}
                icon={<CheckCircleOutlineIcon />}
              >
                Export complete! {exportTask.processed_rows} issues exported.
              </Alert>
            )}

            {!exportPolling && exportTask?.status === 'failed' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Export failed. Please try again.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              History
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rows</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{formatDateTime(entry.created_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.type}
                          size="small"
                          color={entry.type === 'import' ? 'primary' : 'info'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" textTransform="uppercase">
                          {entry.format}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={
                            entry.status === 'completed'
                              ? 'success'
                              : entry.status === 'failed'
                                ? 'error'
                                : 'warning'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{entry.row_count ?? '—'}</TableCell>
                      <TableCell>
                        {entry.download_url && (
                          <Button
                            size="small"
                            startIcon={<FileDownloadIcon />}
                            href={entry.download_url}
                            target="_blank"
                          >
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
