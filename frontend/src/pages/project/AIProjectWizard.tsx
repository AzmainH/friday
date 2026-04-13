import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import {
  Sparkles, FileText, Loader2, Eye, Lock, CheckCircle2,
} from 'lucide-react'
import PlanPreview from '@/components/project-generator/PlanPreview'
import RefinementChat from '@/components/project-generator/RefinementChat'
import {
  useGeneratePlan,
  useRefinePlan,
  useApplyPlan,
  useLockBaseline,
} from '@/hooks/useNLProjectGenerator'
import type { ProjectPlanResponse } from '@/hooks/useNLProjectGenerator'
import { useOrgStore } from '@/stores/orgStore'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  'Describe',
  'Generating',
  'Review & Refine',
  'Confirm',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIProjectWizard() {
  const navigate = useNavigate()
  const currentWorkspaceId = useOrgStore((s) => s.currentWorkspaceId)

  // Wizard state
  const [activeStep, setActiveStep] = useState(0)
  const [description, setDescription] = useState('')
  const [projectName, setProjectName] = useState('')
  const [plan, setPlan] = useState<ProjectPlanResponse | null>(null)
  const [previousPlan, setPreviousPlan] = useState<ProjectPlanResponse | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [appliedProjectId, setAppliedProjectId] = useState<string | null>(null)

  // Mutations
  const generatePlan = useGeneratePlan()
  const refinePlan = useRefinePlan(appliedProjectId ?? 'draft')
  const applyPlan = useApplyPlan()
  const lockBaseline = useLockBaseline(appliedProjectId ?? '')

  // ---------------------------------------------------------------------------
  // Step 1 -> Step 2: Generate plan
  // ---------------------------------------------------------------------------

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return

    setActiveStep(1)
    setGenerationError(null)

    try {
      const result = await generatePlan.mutateAsync({
        description: description.trim(),
      })
      setPlan(result)
      setPreviousPlan(null)
      // Auto-derive project name from the first sentence of description
      if (!projectName) {
        const firstSentence = description.split(/[.!?\n]/)[0].trim()
        setProjectName(
          firstSentence.length > 60
            ? firstSentence.slice(0, 57) + '...'
            : firstSentence,
        )
      }
      setActiveStep(2)
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to generate plan. Please try again.',
      )
      setActiveStep(0)
    }
  }, [description, projectName, generatePlan])

  // ---------------------------------------------------------------------------
  // Step 3: Refine plan
  // ---------------------------------------------------------------------------

  const handleRefine = useCallback(
    async (corrections: string) => {
      if (!plan) return

      try {
        const result = await refinePlan.mutateAsync({
          plan_id: '00000000-0000-0000-0000-000000000000',
          corrections,
        })
        setPreviousPlan(plan)
        setPlan(result)
      } catch {
        // Refinement failed silently - user can retry
      }
    },
    [plan, refinePlan],
  )

  // ---------------------------------------------------------------------------
  // Step 4: Apply plan & lock baseline
  // ---------------------------------------------------------------------------

  const handleApplyAndLock = useCallback(async () => {
    if (!plan || !currentWorkspaceId) return

    setActiveStep(3)

    try {
      // Apply the plan
      const result = await applyPlan.mutateAsync({
        plan,
        workspace_id: currentWorkspaceId,
        project_name: projectName || 'AI Generated Project',
      })

      setAppliedProjectId(result.project_id)

      // Lock the baseline
      try {
        await lockBaseline.mutateAsync({
          project_id: result.project_id,
          name: 'Initial AI Baseline',
        })
      } catch {
        // Baseline lock is non-critical
      }

      // Navigate to the new project
      setTimeout(() => {
        navigate(`/projects/${result.project_id}/board`)
      }, 2000)
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to create project. Please try again.',
      )
      setActiveStep(2)
    }
  }, [plan, currentWorkspaceId, projectName, applyPlan, lockBaseline, navigate])

  // ---------------------------------------------------------------------------
  // Render: Step Indicator
  // ---------------------------------------------------------------------------

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors',
                idx < activeStep && 'bg-primary-500 text-white',
                idx === activeStep && 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/40',
                idx > activeStep && 'bg-surface-200 text-text-tertiary dark:bg-surface-200',
              )}
            >
              {idx < activeStep ? <CheckCircle2 size={16} /> : idx + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-sm font-medium hidden sm:inline',
                idx === activeStep ? 'text-text-primary' : 'text-text-tertiary',
              )}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-3',
                  idx < activeStep ? 'bg-primary-500' : 'bg-surface-200',
                )}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 1 - Describe
  // ---------------------------------------------------------------------------

  function renderDescribeStep() {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-text-primary">
              Describe Your Project
            </h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Tell Friday about your project in natural language. Include goals,
            constraints, team size, timeline expectations, and any other relevant
            details. The AI will generate a complete project plan.
          </p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              'Example: Build a customer portal that allows users to view their orders, ' +
              'track shipments, and manage returns. The team has 2 backend engineers ' +
              'and 1 frontend developer. We need to launch the MVP within 6 weeks.'
            }
            rows={8}
            label="Project Description"
          />
          {generationError && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-[--radius-sm]">
              {generationError}
            </div>
          )}
        </Card>
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || generatePlan.isPending}
            loading={generatePlan.isPending}
            leftIcon={<Sparkles size={16} />}
          >
            Generate Plan
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 2 - Loading
  // ---------------------------------------------------------------------------

  function renderLoadingStep() {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="text-primary-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Generating Your Project Plan
            </h3>
            <p className="text-sm text-text-secondary text-center max-w-md">
              Friday is analyzing your description and creating a structured plan
              with deliverables, tasks, roles, and timeline.
            </p>
          </div>
        </Card>
        {/* Skeleton preview of what's coming */}
        <Card>
          <Skeleton height={16} width="40%" rounded="sm" className="mb-4" />
          <SkeletonText lines={3} />
        </Card>
        <Card>
          <Skeleton height={16} width="30%" rounded="sm" className="mb-4" />
          <div className="space-y-2">
            <Skeleton height={36} rounded="sm" />
            <Skeleton height={36} rounded="sm" />
            <Skeleton height={36} rounded="sm" />
          </div>
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 3 - Review & Refine
  // ---------------------------------------------------------------------------

  function renderReviewStep() {
    if (!plan) return null

    return (
      <div className="space-y-6">
        {/* Project name input */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">
              Project Name
            </h3>
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={cn(
              'w-full rounded-[--radius-sm] border bg-white px-3 py-2 text-sm',
              'text-text-primary placeholder:text-text-tertiary',
              'transition-colors duration-150',
              'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              'dark:bg-surface-100 dark:border-surface-200 dark:text-text-primary',
              'border-surface-200',
            )}
            placeholder="Enter project name..."
          />
        </Card>

        {/* Plan preview */}
        <PlanPreview plan={plan} />

        {/* Refinement chat */}
        <RefinementChat
          currentPlan={plan}
          previousPlan={previousPlan}
          onSubmitCorrections={handleRefine}
          isRefining={refinePlan.isPending}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setActiveStep(0)}
          >
            Start Over
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={generatePlan.isPending}
              loading={generatePlan.isPending}
            >
              Regenerate
            </Button>
            <Button
              onClick={handleApplyAndLock}
              disabled={applyPlan.isPending || !projectName.trim()}
              loading={applyPlan.isPending}
              leftIcon={<Lock size={16} />}
            >
              Create Project & Lock Baseline
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 4 - Confirmation
  // ---------------------------------------------------------------------------

  function renderConfirmStep() {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Project Created Successfully
          </h3>
          <p className="text-sm text-text-secondary text-center max-w-md mb-1">
            Your project "{projectName}" has been created with{' '}
            {plan?.tasks.length ?? 0} tasks and an initial baseline has been locked.
          </p>
          <p className="text-xs text-text-tertiary">
            Redirecting to your project board...
          </p>
        </div>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const stepRenderers = [
    renderDescribeStep,
    renderLoadingStep,
    renderReviewStep,
    renderConfirmStep,
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles size={24} className="text-primary-500" />
        <h1 className="text-2xl font-bold text-text-primary">
          AI Project Wizard
        </h1>
      </div>
      <p className="text-sm text-text-secondary mb-8">
        Describe your project in plain English and let Friday generate a
        complete project plan with tasks, roles, and timelines.
      </p>

      {renderStepIndicator()}

      <div className="mb-8">
        {stepRenderers[activeStep]()}
      </div>
    </div>
  )
}
