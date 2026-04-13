import { useState } from 'react'
import { X, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  useConfirmStatusUpdate,
  type ParsedStatusUpdate,
  type TaskMatch,
} from '@/hooks/useNLStatusParser'
import StatusUpdateInput from './StatusUpdateInput'
import ParsedUpdateReview from './ParsedUpdateReview'

type PanelStep = 'input' | 'review' | 'confirmed'

interface StatusUpdatePanelProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export default function StatusUpdatePanel({
  isOpen,
  onClose,
  projectId,
}: StatusUpdatePanelProps) {
  const [step, setStep] = useState<PanelStep>('input')
  const [parsedResult, setParsedResult] = useState<ParsedStatusUpdate | null>(null)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const confirmMutation = useConfirmStatusUpdate()

  const handleParsed = (result: ParsedStatusUpdate) => {
    setParsedResult(result)
    setStep('review')
  }

  const handleConfirm = (confirmed: TaskMatch[]) => {
    confirmMutation.mutate(
      { projectId, confirmedUpdates: confirmed },
      {
        onSuccess: (data) => {
          setConfirmedCount(data.updated_count)
          setStep('confirmed')
        },
      },
    )
  }

  const handleRejectAll = () => {
    setParsedResult(null)
    setStep('input')
  }

  const handleReset = () => {
    setStep('input')
    setParsedResult(null)
    setConfirmedCount(0)
    confirmMutation.reset()
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[520px] z-50',
          'bg-white dark:bg-surface-100 border-l border-surface-200',
          'shadow-xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary-500" />
            <h2 className="text-sm font-semibold text-text-primary">
              Natural Language Status Update
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
            aria-label="Close status update panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-surface-200 shrink-0">
          {(['input', 'review', 'confirmed'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={cn(
                    'w-8 h-px',
                    step === s || (['review', 'confirmed'].indexOf(step) >= i)
                      ? 'bg-primary-500'
                      : 'bg-surface-300',
                  )}
                />
              )}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                  step === s
                    ? 'bg-primary-600 text-white'
                    : (['input', 'review', 'confirmed'].indexOf(step) > i)
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'bg-surface-200 text-text-tertiary',
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  'text-xs',
                  step === s ? 'text-text-primary font-medium' : 'text-text-tertiary',
                )}
              >
                {s === 'input' && 'Write'}
                {s === 'review' && 'Review'}
                {s === 'confirmed' && 'Done'}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {step === 'input' && (
            <StatusUpdateInput projectId={projectId} onParsed={handleParsed} />
          )}

          {step === 'review' && parsedResult && (
            <div className="flex flex-col gap-4">
              {/* Raw text preview */}
              <div className="rounded-lg border border-surface-200 bg-surface-100 dark:bg-surface-200 px-3 py-2">
                <p className="text-xs font-medium text-text-secondary mb-1">
                  Your update
                </p>
                <p className="text-sm text-text-primary">
                  {parsedResult.raw_text}
                </p>
              </div>

              <ParsedUpdateReview
                matches={parsedResult.matches}
                onConfirm={handleConfirm}
                onRejectAll={handleRejectAll}
                isConfirming={confirmMutation.isPending}
              />

              {confirmMutation.isError && (
                <p className="text-sm text-red-500">
                  Failed to apply updates. Please try again.
                </p>
              )}
            </div>
          )}

          {step === 'confirmed' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <CheckCircle2 size={48} className="text-green-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text-primary">
                  Updates Applied
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {confirmedCount} task{confirmedCount !== 1 ? 's' : ''} updated
                  successfully.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium',
                    'border border-surface-200 text-text-secondary',
                    'hover:bg-surface-100 transition-colors',
                  )}
                >
                  Submit Another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium',
                    'bg-primary-600 text-white hover:bg-primary-700 transition-colors',
                  )}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
