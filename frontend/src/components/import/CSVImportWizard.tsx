import { useState, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import {
  useImportPreview,
  useStartImport,
  useTaskProgress,
  type ColumnPreview,
} from '@/hooks/useImportExport'
import ColumnMapper, {
  autoDetectMapping,
  DEFAULT_ISSUE_FIELDS,
} from '@/components/import/ColumnMapper'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CSVImportWizardProps {
  projectId: string
}

const STEPS = ['Upload CSV', 'Map Columns', 'Preview', 'Import']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CSVImportWizard({ projectId }: CSVImportWizardProps) {
  const previewMutation = useImportPreview()
  const importMutation = useStartImport()

  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ColumnPreview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importTaskId, setImportTaskId] = useState<string | null>(null)

  const { task: importTask, isPolling } = useTaskProgress(importTaskId)

  // --- Step 1: Upload ---

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      setFile(f)

      previewMutation.mutate(
        { projectId, file: f },
        {
          onSuccess: (data) => {
            setPreview(data)
            // Auto-detect column mapping
            const autoMap = autoDetectMapping(data.csv_columns, DEFAULT_ISSUE_FIELDS)
            setMapping(autoMap)
            setActiveStep(1)
          },
        },
      )
    },
    [projectId, previewMutation],
  )

  // --- Step 2: Map Columns ---

  const handleMappingDone = useCallback(() => {
    setActiveStep(2)
  }, [])

  // --- Step 3: Preview mapped rows ---

  const previewRows = useMemo(() => {
    if (!preview) return []
    return preview.sample_rows.slice(0, 5).map((row) => {
      const mapped: Record<string, string> = {}
      for (const [csvCol, fieldName] of Object.entries(mapping)) {
        if (row[csvCol] !== undefined) {
          mapped[fieldName] = row[csvCol]
        }
      }
      return mapped
    })
  }, [preview, mapping])

  const mappedFieldNames = useMemo(
    () => Object.values(mapping).filter(Boolean),
    [mapping],
  )

  const handleStartImport = useCallback(() => {
    if (!preview) return
    // Use file name as a proxy for file_id (backend would associate via the preview upload)
    importMutation.mutate(
      {
        project_id: projectId,
        file_id: file?.name ?? 'uploaded',
        mapping,
      },
      {
        onSuccess: (data) => {
          setImportTaskId(data.task_id)
          setActiveStep(3)
        },
      },
    )
  }, [preview, projectId, file, mapping, importMutation])

  // --- Render ---

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Upload */}
      {activeStep === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CloudUploadIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload a CSV File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a CSV file with issue data to import into this project.
          </Typography>

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending ? 'Analyzing...' : 'Choose File'}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileSelect}
            />
          </Button>

          {file && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {file.name} ({Math.round(file.size / 1024)} KB)
            </Typography>
          )}

          {previewMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to parse CSV. Please check the file format.
            </Alert>
          )}
        </Box>
      )}

      {/* Step 2: Column Mapping */}
      {activeStep === 1 && preview && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {preview.total_rows} rows and {preview.csv_columns.length} columns.
            Map each CSV column to an issue field.
          </Typography>

          <ColumnMapper
            csvColumns={preview.csv_columns}
            issueFields={DEFAULT_ISSUE_FIELDS}
            mapping={mapping}
            onMappingChange={setMapping}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleMappingDone}
              disabled={Object.keys(mapping).length === 0}
            >
              Next: Preview
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Preview */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Preview (first {previewRows.length} rows)
          </Typography>

          <TableContainer sx={{ mb: 3, maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {mappedFieldNames.map((field) => (
                    <TableCell key={field}>
                      <Typography variant="caption" fontWeight={600}>
                        {field.replace(/_/g, ' ')}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {mappedFieldNames.map((field) => (
                      <TableCell key={field}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {row[field] ?? '—'}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleStartImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Starting...' : 'Start Import'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 4: Import progress */}
      {activeStep === 3 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          {isPolling && (
            <>
              <Typography variant="h6" gutterBottom>
                Importing...
              </Typography>
              <LinearProgress
                variant={importTask?.progress ? 'determinate' : 'indeterminate'}
                value={importTask?.progress ?? 0}
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {importTask?.processed_rows ?? 0} of {importTask?.total_rows ?? '?'} rows processed
              </Typography>
            </>
          )}

          {!isPolling && importTask?.status === 'completed' && (
            <>
              <CheckCircleOutlineIcon
                sx={{ fontSize: 56, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h6" color="success.main" gutterBottom>
                Import Complete
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {importTask.processed_rows} issues imported successfully.
              </Typography>
              {importTask.errors.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2">
                    {importTask.errors.length} warning(s):
                  </Typography>
                  {importTask.errors.slice(0, 5).map((err, i) => (
                    <Typography key={i} variant="caption" display="block">
                      {err}
                    </Typography>
                  ))}
                </Alert>
              )}
            </>
          )}

          {!isPolling && importTask?.status === 'failed' && (
            <>
              <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main', mb: 1 }} />
              <Typography variant="h6" color="error" gutterBottom>
                Import Failed
              </Typography>
              {importTask.errors.map((err, i) => (
                <Chip
                  key={i}
                  label={err}
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ m: 0.5 }}
                />
              ))}
            </>
          )}
        </Box>
      )}
    </Paper>
  )
}
