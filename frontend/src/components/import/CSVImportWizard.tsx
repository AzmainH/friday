import { useState, useCallback, useMemo } from 'react'
import { CloudUpload, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
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
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, index) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors',
                index < activeStep && 'bg-primary-500 text-white',
                index === activeStep && 'bg-primary-500 text-white ring-2 ring-primary-500/30',
                index > activeStep && 'bg-surface-100 text-text-secondary',
              )}
            >
              {index < activeStep ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden sm:block',
                index <= activeStep ? 'text-text-primary' : 'text-text-secondary',
              )}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-px w-8 flex-shrink-0',
                index < activeStep ? 'bg-primary-500' : 'bg-surface-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

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
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-6">
      <StepIndicator steps={STEPS} activeStep={activeStep} />

      {/* Step 1: Upload */}
      {activeStep === 0 && (
        <div className="text-center py-8">
          <CloudUpload className="h-14 w-14 mx-auto text-text-secondary/40 mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Upload a CSV File
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Select a CSV file with issue data to import into this project.
          </p>

          <label>
            <Button
              variant="primary"
              leftIcon={<CloudUpload className="h-4 w-4" />}
              disabled={previewMutation.isPending}
              onClick={() => {
                // Trigger the hidden file input
                const input = document.getElementById('csv-upload-input')
                input?.click()
              }}
            >
              {previewMutation.isPending ? 'Analyzing...' : 'Choose File'}
            </Button>
            <input
              id="csv-upload-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {file && (
            <p className="text-xs text-text-secondary mt-2">
              {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}

          {previewMutation.isError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to parse CSV. Please check the file format.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {activeStep === 1 && preview && (
        <div>
          <p className="text-sm text-text-secondary mb-4">
            Found {preview.total_rows} rows and {preview.csv_columns.length} columns.
            Map each CSV column to an issue field.
          </p>

          <ColumnMapper
            csvColumns={preview.csv_columns}
            issueFields={DEFAULT_ISSUE_FIELDS}
            mapping={mapping}
            onMappingChange={setMapping}
          />

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="primary"
              onClick={handleMappingDone}
              disabled={Object.keys(mapping).length === 0}
            >
              Next: Preview
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {activeStep === 2 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Preview (first {previewRows.length} rows)
          </h4>

          <div className="overflow-x-auto mb-6 max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 sticky top-0">
                <tr>
                  {mappedFieldNames.map((field) => (
                    <th key={field} className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                      {field.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {mappedFieldNames.map((field) => (
                      <td key={field} className="px-4 py-2 border-t border-surface-200">
                        <span className="block max-w-[200px] truncate text-sm">
                          {row[field] ?? '\u2014'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="primary"
              onClick={handleStartImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Starting...' : 'Start Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Import progress */}
      {activeStep === 3 && (
        <div className="text-center py-6">
          {isPolling && (
            <>
              <h3 className="text-lg font-medium text-text-primary mb-4">
                Importing...
              </h3>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: importTask?.progress ? `${importTask.progress}%` : '30%' }}
                />
              </div>
              <p className="text-sm text-text-secondary">
                {importTask?.processed_rows ?? 0} of {importTask?.total_rows ?? '?'} rows processed
              </p>
            </>
          )}

          {!isPolling && importTask?.status === 'completed' && (
            <>
              <CheckCircle className="h-14 w-14 mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-medium text-green-600 mb-2">
                Import Complete
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                {importTask.processed_rows} issues imported successfully.
              </p>
              {importTask.errors.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">
                  <p className="font-semibold mb-1">
                    {importTask.errors.length} warning(s):
                  </p>
                  {importTask.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {!isPolling && importTask?.status === 'failed' && (
            <>
              <AlertCircle className="h-14 w-14 mx-auto text-red-500 mb-2" />
              <h3 className="text-lg font-medium text-red-600 mb-4">
                Import Failed
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {importTask.errors.map((err, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700"
                  >
                    {err}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
