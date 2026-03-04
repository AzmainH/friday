import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloudUpload,
  CheckCircle,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  X,
  ArrowLeft,
  Layers,
  Users,
  Milestone,
  ListTree,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { useOrgStore } from '@/stores/orgStore'
import {
  useUploadDocuments,
  useAnalysisResult,
  useCreateFromDocuments,
  useDocTaskProgress,
  type DocumentAnalysisResult,
  type DocumentImportConfig,
} from '@/hooks/useDocumentImport'
import WBSTreePreview from '@/components/document-import/WBSTreePreview'
import ResourceMapper from '@/components/document-import/ResourceMapper'
import StatusMapper, {
  getDefaultStatusMapping,
} from '@/components/document-import/StatusMapper'

const STEPS = [
  'Upload',
  'Analyzing',
  'Project Info',
  'Map & Review',
  'Confirm',
  'Creating',
]

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx']

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
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
              {index < activeStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden md:block',
                index <= activeStep ? 'text-text-primary' : 'text-text-secondary',
              )}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-px w-6 flex-shrink-0',
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
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-50 rounded-[--radius-md] border border-surface-200">
      <Icon className="h-5 w-5 text-primary-500" />
      <div>
        <div className="text-lg font-bold text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary">{label}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------

export default function DocumentImportWizard() {
  const navigate = useNavigate()
  const { currentWorkspaceId } = useOrgStore()

  const uploadMutation = useUploadDocuments()
  const createMutation = useCreateFromDocuments()

  const [activeStep, setActiveStep] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [analysisTaskId, setAnalysisTaskId] = useState<string | null>(null)
  const [creationTaskId, setCreationTaskId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null)

  // Project info form
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [projectName, setProjectName] = useState('')
  const [keyPrefix, setKeyPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [existingProjectId, setExistingProjectId] = useState('')

  // Mappings
  const [resourceMapping, setResourceMapping] = useState<Record<string, string | null>>({})
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({})
  const [createMilestones, setCreateMilestones] = useState(true)

  // Polling
  const { task: analysisTask } = useDocTaskProgress(analysisTaskId)
  const { task: creationTask, isPolling: isCreating } = useDocTaskProgress(creationTaskId)

  const { refetch: fetchAnalysisResult } = useAnalysisResult(analysisTaskId)

  // When analysis completes, fetch result and move to step 2
  useEffect(() => {
    if (analysisTask?.status === 'completed' && !analysis) {
      fetchAnalysisResult().then(({ data }) => {
        if (data) {
          setAnalysis(data)
          // Pre-fill form
          setProjectName(data.project_name ?? '')
          setKeyPrefix(
            data.project_name
              ? data.project_name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 5)
              : '',
          )
          setDescription(data.project_description ?? '')
          // Pre-fill mappings
          const rm: Record<string, string | null> = {}
          for (const r of data.resources) {
            rm[r.document_name] = r.matched_user_id
          }
          setResourceMapping(rm)
          setStatusMapping(getDefaultStatusMapping(data.statuses_found))
          setActiveStep(2)
        }
      })
    }
  }, [analysisTask?.status, analysis, fetchAnalysisResult])

  // --- File handling ---

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'))
      return ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXTENSIONS.includes(ext)
    })
    setFiles((prev) => [...prev, ...valid])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(() => {
    if (files.length === 0) return
    uploadMutation.mutate(
      { files },
      {
        onSuccess: (data) => {
          setAnalysisTaskId(data.task_id)
          setActiveStep(1)
        },
      },
    )
  }, [files, uploadMutation])

  // --- Creation ---

  const handleCreate = useCallback(() => {
    if (!analysisTaskId) return
    const config: DocumentImportConfig = {
      analysis_task_id: analysisTaskId,
      mode,
      project_name: mode === 'new' ? projectName : undefined,
      key_prefix: mode === 'new' ? keyPrefix : undefined,
      description: mode === 'new' ? description : undefined,
      workspace_id: currentWorkspaceId ?? undefined,
      existing_project_id: mode === 'existing' ? existingProjectId : undefined,
      resource_mapping: resourceMapping,
      status_mapping: statusMapping,
      create_milestones: createMilestones,
    }
    createMutation.mutate(config, {
      onSuccess: (data) => {
        setCreationTaskId(data.task_id)
        setActiveStep(5)
      },
    })
  }, [
    analysisTaskId,
    mode,
    projectName,
    keyPrefix,
    description,
    currentWorkspaceId,
    existingProjectId,
    resourceMapping,
    statusMapping,
    createMilestones,
    createMutation,
  ])

  const createdProjectId = useMemo(() => {
    if (creationTask?.status === 'completed' && creationTask.result_summary_json) {
      return (creationTask.result_summary_json as Record<string, unknown>).project_id as string
    }
    return null
  }, [creationTask])

  // --- Render ---

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="p-1.5 rounded-[--radius-sm] hover:bg-surface-100"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Import from Documents</h1>
      </div>

      <StepIndicator steps={STEPS} activeStep={activeStep} />

      <div className="bg-white dark:bg-dark-surface border border-surface-200 rounded-[--radius-md] p-6">
        {/* Step 0: Upload */}
        {activeStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Upload Programme Documents
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Upload your programme overview (.docx) and/or project plan (.xlsx). The system
              will analyze them and extract project structure, tasks, milestones, and team members.
            </p>

            {/* Drop zone */}
            <label className="block">
              <div
                className={cn(
                  'border-2 border-dashed border-surface-300 rounded-[--radius-md]',
                  'p-8 text-center cursor-pointer',
                  'hover:border-primary-400 hover:bg-primary-50/30 transition-colors',
                )}
              >
                <CloudUpload className="h-12 w-12 mx-auto text-text-secondary/40 mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-text-tertiary">
                  Accepts .docx (programme overview) and .xlsx (project plan)
                </p>
              </div>
              <input
                type="file"
                accept=".docx,.xlsx"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 px-3 py-2 bg-surface-50 rounded-[--radius-sm] border border-surface-200"
                  >
                    {f.name.endsWith('.docx') ? (
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-text-primary truncate">{f.name}</span>
                    <span className="text-xs text-text-tertiary">
                      {Math.round(f.size / 1024)} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1 rounded hover:bg-surface-200"
                    >
                      <X className="h-4 w-4 text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={files.length === 0 || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Analyze Documents'}
              </Button>
            </div>

            {uploadMutation.isError && (
              <div className="mt-4 rounded-[--radius-sm] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Upload failed. Please check the file format and try again.
              </div>
            )}
          </div>
        )}

        {/* Step 1: Analysis Progress */}
        {activeStep === 1 && (
          <div className="text-center py-8">
            {analysisTask?.status === 'failed' ? (
              <>
                <AlertCircle className="h-14 w-14 mx-auto text-red-500 mb-3" />
                <h3 className="text-lg font-medium text-red-600 mb-2">Analysis Failed</h3>
                <p className="text-sm text-text-secondary mb-4">
                  {analysisTask.error_message ?? 'An unexpected error occurred.'}
                </p>
                <Button variant="ghost" onClick={() => setActiveStep(0)}>
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Analyzing Documents...
                </h3>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden mb-4 max-w-md mx-auto">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${analysisTask?.progress_pct ?? 10}%` }}
                  />
                </div>
                <p className="text-sm text-text-secondary">
                  {(analysisTask?.progress_pct ?? 0) < 30
                    ? 'Extracting document content...'
                    : (analysisTask?.progress_pct ?? 0) < 70
                      ? 'Analyzing project structure with AI...'
                      : 'Matching team members...'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 2: Project Info */}
        {activeStep === 2 && analysis && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Project Information</h2>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={ListTree} label="Tasks" value={analysis.total_tasks} />
              <StatCard icon={Milestone} label="Milestones" value={analysis.milestone_count} />
              <StatCard icon={Users} label="Team Members" value={analysis.resource_count} />
              <StatCard icon={Layers} label="WBS Levels" value={analysis.hierarchy_levels} />
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div className="mb-4 rounded-[--radius-sm] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <p className="font-semibold mb-1">Warnings:</p>
                {analysis.warnings.map((w, i) => (
                  <p key={i} className="text-xs">{w}</p>
                ))}
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setMode('new')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-[--radius-md] border text-sm font-medium transition-colors',
                  mode === 'new'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 text-text-secondary hover:bg-surface-50',
                )}
              >
                Create New Project
              </button>
              <button
                onClick={() => setMode('existing')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-[--radius-md] border text-sm font-medium transition-colors',
                  mode === 'existing'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 text-text-secondary hover:bg-surface-50',
                )}
              >
                Import into Existing Project
              </button>
            </div>

            {mode === 'new' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-300 rounded-[--radius-sm] bg-white dark:bg-dark-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="e.g. Build in Five"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Key Prefix *
                    </label>
                    <input
                      type="text"
                      value={keyPrefix}
                      onChange={(e) => setKeyPrefix(e.target.value.toUpperCase().slice(0, 5))}
                      maxLength={5}
                      className="w-full px-3 py-2 text-sm border border-surface-300 rounded-[--radius-sm] bg-white dark:bg-dark-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="e.g. B5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Dates
                    </label>
                    <p className="text-sm text-text-secondary mt-1">
                      {analysis.start_date ?? 'N/A'} &mdash; {analysis.end_date ?? 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-surface-300 rounded-[--radius-sm] bg-white dark:bg-dark-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                    placeholder="Project description..."
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Select Existing Project
                </label>
                <input
                  type="text"
                  value={existingProjectId}
                  onChange={(e) => setExistingProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-surface-300 rounded-[--radius-sm] bg-white dark:bg-dark-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Enter project ID"
                />
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setActiveStep(3)}
                disabled={mode === 'new' ? !projectName || !keyPrefix : !existingProjectId}
              >
                Next: Review Mappings
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Map & Review */}
        {activeStep === 3 && analysis && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Review & Map</h2>

            {/* Status mapping */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Status Mapping</h3>
              <p className="text-xs text-text-secondary mb-3">
                Map document statuses to Friday workflow categories.
              </p>
              <StatusMapper
                statuses={analysis.statuses_found}
                mapping={statusMapping}
                onMappingChange={setStatusMapping}
              />
            </div>

            {/* Resource mapping */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Team Member Mapping</h3>
              <p className="text-xs text-text-secondary mb-3">
                Match document names to existing Friday users.
              </p>
              <ResourceMapper
                resources={analysis.resources}
                mapping={resourceMapping}
                onMappingChange={setResourceMapping}
              />
            </div>

            {/* Milestones toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createMilestones}
                  onChange={(e) => setCreateMilestones(e.target.checked)}
                  className="rounded border-surface-300"
                />
                <span className="text-sm text-text-primary">Create milestones from document</span>
                <span className="text-xs text-text-tertiary">
                  ({analysis.milestone_count} found)
                </span>
              </label>
            </div>

            {/* Task preview */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Task Hierarchy Preview
              </h3>
              <WBSTreePreview tasks={analysis.tasks_preview} maxVisible={50} />
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setActiveStep(4)}>
                Next: Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {activeStep === 4 && analysis && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Confirm Import</h2>

            <div className="bg-surface-50 rounded-[--radius-md] border border-surface-200 p-5 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Mode:</span>{' '}
                  <span className="font-medium text-text-primary">
                    {mode === 'new' ? 'Create New Project' : 'Import into Existing'}
                  </span>
                </div>
                {mode === 'new' && (
                  <>
                    <div>
                      <span className="text-text-secondary">Project:</span>{' '}
                      <span className="font-medium text-text-primary">{projectName}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Key:</span>{' '}
                      <span className="font-medium text-primary-500">{keyPrefix}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-text-secondary">Tasks to create:</span>{' '}
                  <span className="font-bold text-text-primary">{analysis.total_tasks}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Milestones:</span>{' '}
                  <span className="font-bold text-text-primary">
                    {createMilestones ? analysis.milestone_count : 0}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Team members mapped:</span>{' '}
                  <span className="font-bold text-text-primary">
                    {Object.values(resourceMapping).filter(Boolean).length} /{' '}
                    {analysis.resource_count}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Statuses:</span>{' '}
                  <span className="font-bold text-text-primary">
                    {analysis.statuses_found.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Starting...' : 'Create Project'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Creation Progress */}
        {activeStep === 5 && (
          <div className="text-center py-8">
            {isCreating && (
              <>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Creating Project...
                </h3>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden mb-4 max-w-md mx-auto">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${creationTask?.progress_pct ?? 5}%` }}
                  />
                </div>
                <p className="text-sm text-text-secondary">
                  {(creationTask?.progress_pct ?? 0) < 15
                    ? 'Setting up project...'
                    : (creationTask?.progress_pct ?? 0) < 25
                      ? 'Creating workflow and issue types...'
                      : (creationTask?.progress_pct ?? 0) < 85
                        ? `Creating issues... (${creationTask?.progress_pct}%)`
                        : (creationTask?.progress_pct ?? 0) < 95
                          ? 'Creating dependencies...'
                          : 'Finalizing...'}
                </p>
              </>
            )}

            {!isCreating && creationTask?.status === 'completed' && (
              <>
                <CheckCircle className="h-14 w-14 mx-auto text-green-500 mb-3" />
                <h3 className="text-lg font-medium text-green-600 mb-2">
                  Project Created Successfully!
                </h3>
                {creationTask.result_summary_json && (
                  <div className="text-sm text-text-secondary mb-4 space-y-1">
                    <p>
                      {(creationTask.result_summary_json as Record<string, number>).issues_created ?? 0} issues created
                    </p>
                    <p>
                      {(creationTask.result_summary_json as Record<string, number>).milestones_created ?? 0} milestones
                      created
                    </p>
                    <p>
                      {(creationTask.result_summary_json as Record<string, number>).dependencies_created ?? 0} dependencies
                      created
                    </p>
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" onClick={() => navigate('/projects')}>
                    All Projects
                  </Button>
                  {createdProjectId && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/projects/${createdProjectId}/board`)}
                    >
                      Go to Project
                    </Button>
                  )}
                </div>
              </>
            )}

            {!isCreating && creationTask?.status === 'failed' && (
              <>
                <AlertCircle className="h-14 w-14 mx-auto text-red-500 mb-3" />
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Import Failed
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {creationTask.error_message ?? 'An unexpected error occurred.'}
                </p>
                <Button variant="ghost" onClick={() => setActiveStep(4)}>
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
