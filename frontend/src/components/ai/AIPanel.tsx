import { useState, useCallback } from 'react'
import { Sparkles, Calendar, AlertTriangle, FileBarChart, Circle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTriggerAI, useAITaskStatus, type AITaskType } from '@/hooks/useAI'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIPanelProps {
  projectId: string
}

interface AIAction {
  type: AITaskType
  label: string
  description: string
  icon: React.ReactNode
  colorClass: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_ACTIONS: AIAction[] = [
  {
    type: 'smart_schedule',
    label: 'Smart Schedule',
    description: 'Optimize task scheduling based on priorities, dependencies, and team capacity.',
    icon: <Calendar size={20} />,
    colorClass: 'bg-[#009688]',
  },
  {
    type: 'risk_prediction',
    label: 'Risk Prediction',
    description: 'Identify potential risks and bottlenecks in your current sprint or project.',
    icon: <AlertTriangle size={20} />,
    colorClass: 'bg-[#009688]',
  },
  {
    type: 'project_summary',
    label: 'Project Summary',
    description: 'Generate a comprehensive summary of project status, progress, and key metrics.',
    icon: <FileBarChart size={20} />,
    colorClass: 'bg-[#3574D4]',
  },
]

// ---------------------------------------------------------------------------
// Result renderers
// ---------------------------------------------------------------------------

function ScheduleResult({ data }: { data: Record<string, unknown> }) {
  const suggestions = (data.suggestions as Array<Record<string, unknown>>) ?? []
  return (
    <div>
      <p className="text-sm font-semibold mb-1">
        Scheduling Suggestions
      </p>
      {suggestions.length > 0 ? (
        <div className="flex flex-col">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <div className="mt-1.5 shrink-0">
                <Circle size={8} className="text-[#009688] fill-[#009688]" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium block">{s.issue_key as string}</span>
                <span className="text-xs text-[#6B6B6B] block">{s.recommendation as string}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B6B6B]">
          {(data.summary as string) ?? 'Schedule looks optimal.'}
        </p>
      )}
    </div>
  )
}

function RiskResult({ data }: { data: Record<string, unknown> }) {
  const risks = (data.risks as Array<Record<string, unknown>>) ?? []
  return (
    <div>
      <p className="text-sm font-semibold mb-1">
        Identified Risks
      </p>
      {risks.length > 0 ? (
        <div className="flex flex-col">
          {risks.map((r, i) => {
            const severityColor =
              (r.severity as string) === 'high'
                ? 'text-red-500'
                : (r.severity as string) === 'medium'
                  ? 'text-amber-500'
                  : 'text-[#6B6B6B]'

            const badgeStyle =
              (r.severity as string) === 'high'
                ? 'border-red-300 text-red-600'
                : (r.severity as string) === 'medium'
                  ? 'border-amber-300 text-amber-600'
                  : 'border-surface-300 text-[#6B6B6B]'

            return (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="mt-1 shrink-0">
                  <AlertTriangle size={16} className={severityColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{r.title as string}</span>
                  <span className="text-xs text-[#6B6B6B] block">{r.description as string}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
                  {r.severity as string}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[#6B6B6B]">
          {(data.summary as string) ?? 'No significant risks detected.'}
        </p>
      )}
    </div>
  )
}

function SummaryResult({ data }: { data: Record<string, unknown> }) {
  const summary = typeof data.summary === 'string' ? data.summary : null
  const metrics =
    data.metrics && typeof data.metrics === 'object'
      ? (data.metrics as Record<string, unknown>)
      : null

  return (
    <div>
      <p className="text-sm font-semibold mb-1">
        Project Summary
      </p>
      {summary && (
        <p className="text-sm mb-2 whitespace-pre-wrap">
          {summary}
        </p>
      )}
      {metrics && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(metrics).map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-[#6B6B6B]"
            >
              {key.replace(/_/g, ' ')}: {String(val)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AIResultDisplay({
  taskType,
  data,
}: {
  taskType: AITaskType
  data: Record<string, unknown>
}) {
  switch (taskType) {
    case 'smart_schedule':
      return <ScheduleResult data={data} />
    case 'risk_prediction':
      return <RiskResult data={data} />
    case 'project_summary':
      return <SummaryResult data={data} />
    default:
      return (
        <p className="text-sm text-[#6B6B6B]">
          {JSON.stringify(data, null, 2)}
        </p>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIPanel({ projectId }: AIPanelProps) {
  const triggerMutation = useTriggerAI()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeTaskType, setActiveTaskType] = useState<AITaskType | null>(null)
  const { status, result, isPolling } = useAITaskStatus(activeTaskId)

  const handleTrigger = useCallback(
    (taskType: AITaskType) => {
      triggerMutation.mutate(
        { project_id: projectId, task_type: taskType },
        {
          onSuccess: (data) => {
            setActiveTaskId(data.task_id)
            setActiveTaskType(taskType)
          },
        },
      )
    },
    [projectId, triggerMutation],
  )

  const handleReset = useCallback(() => {
    setActiveTaskId(null)
    setActiveTaskType(null)
  }, [])

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={24} className="text-[#009688]" />
        <h2 className="text-lg font-semibold">
          AI Assistant
        </h2>
      </div>

      {/* Action cards */}
      <div className="flex flex-col gap-2 mb-3">
        {AI_ACTIONS.map((action) => (
          <div
            key={action.type}
            className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface cursor-pointer transition-colors hover:border-[#009688]"
            onClick={() => handleTrigger(action.type)}
          >
            <div className="flex items-center gap-2 p-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-md text-white ${action.colorClass}`}
              >
                {action.icon}
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold block">
                  {action.label}
                </span>
                <span className="text-xs text-[#6B6B6B]">
                  {action.description}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / results area */}
      {(isPolling || result) && (
        <>
          <hr className="border-surface-200 mb-2" />

          {isPolling && (
            <div className="flex items-center gap-2 py-3 justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-surface-300 border-t-primary-500" />
              <p className="text-sm text-[#6B6B6B]">
                {status === 'pending'
                  ? 'Queued, waiting to start...'
                  : 'Analyzing your project...'}
              </p>
            </div>
          )}

          {!isPolling && result && (
            <div>
              {result.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-2">
                  {result.error ?? 'AI task failed. Please try again.'}
                </div>
              )}

              {result.status === 'completed' && result.result && activeTaskType && (
                <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4">
                  <AIResultDisplay taskType={activeTaskType} data={result.result} />
                </div>
              )}

              <div className="flex justify-center mt-2">
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Clear Results
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
