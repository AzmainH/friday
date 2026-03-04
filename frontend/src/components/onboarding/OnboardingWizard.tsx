import { useState } from 'react'
import { Rocket, Building2, FolderKanban, PartyPopper, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const ONBOARDING_KEY = 'friday-onboarding-complete'

const STEPS = [
  { label: 'Welcome', icon: Rocket },
  { label: 'Workspace', icon: Building2 },
  { label: 'Project', icon: FolderKanban },
  { label: 'Complete', icon: PartyPopper },
] as const

interface OnboardingWizardProps {
  onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  function handleComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onComplete()
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-surface-100">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 px-6 pt-6">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i <= step
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 text-text-tertiary dark:bg-surface-200'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-colors ${
                    i < step ? 'bg-primary-500' : 'bg-surface-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {step === 0 && (
            <div className="text-center">
              <Rocket className="mx-auto h-14 w-14 text-primary-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to Friday</h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                Your enterprise project management hub. Track issues, plan sprints,
                manage budgets, and collaborate with your team -- all in one place.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <Building2 className="mx-auto h-12 w-12 text-primary-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-text-primary text-center mb-1">
                Set up your workspace
              </h2>
              <p className="text-sm text-text-secondary text-center mb-6">
                Give your workspace a name so your team can find it.
              </p>
              <Input
                label="Workspace name"
                placeholder="e.g. Acme Engineering"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <FolderKanban className="mx-auto h-12 w-12 text-primary-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-text-primary text-center mb-1">
                Create your first project
              </h2>
              <p className="text-sm text-text-secondary text-center mb-6">
                Projects hold your issues, sprints, and documents.
              </p>
              <div className="space-y-4">
                <Input
                  label="Project name"
                  placeholder="e.g. Platform Redesign"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
                <Input
                  label="Key prefix"
                  placeholder="e.g. PLAT"
                  hint="Used for issue IDs like PLAT-123"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase().slice(0, 6))}
                />
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  onClick={handleNext}
                >
                  Or use a template
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <PartyPopper className="mx-auto h-14 w-14 text-primary-500 mb-4" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-text-primary mb-2">You're all set!</h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-6">
                Your workspace is ready. Here are some things to explore:
              </p>
              <div className="grid grid-cols-1 gap-2 text-left max-w-xs mx-auto">
                <FeatureLink label="Board View" description="Visualize work with Kanban boards" />
                <FeatureLink label="Sprint Planning" description="Plan and track iterative delivery" />
                <FeatureLink label="Reports" description="Generate project analytics" />
                <FeatureLink label="Knowledge Base" description="Document decisions and share knowledge" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-200 px-8 py-4 dark:border-surface-300">
          <div>
            {step > 0 && step < 3 && (
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                type="button"
                className="text-sm text-text-tertiary hover:text-text-secondary"
                onClick={handleSkip}
              >
                Skip
              </button>
            )}
            {step < 3 ? (
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={handleNext}>
                {step === 0 ? 'Get Started' : 'Next'}
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete}>
                Start Using Friday
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureLink({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-300">
      <div className="h-2 w-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  )
}
