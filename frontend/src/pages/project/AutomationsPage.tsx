import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import type { AutomationRule } from '@/types/api'
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
} from '@/hooks/useAutomations'
import AutomationBuilder, {
  type AutomationBuilderOutput,
} from '@/components/automations/AutomationBuilder'
import ExecutionLog from '@/components/automations/ExecutionLog'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AutomationsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const { data: rules, isLoading } = useAutomations(projectId)
  const createMutation = useCreateAutomation(projectId)
  const updateMutation = useUpdateAutomation(projectId)
  const deleteMutation = useDeleteAutomation(projectId)

  const [showBuilder, setShowBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleCreate = useCallback(
    (output: AutomationBuilderOutput) => {
      createMutation.mutate(output, {
        onSuccess: () => setShowBuilder(false),
      })
    },
    [createMutation],
  )

  const handleUpdate = useCallback(
    (output: AutomationBuilderOutput) => {
      if (!editingRule) return
      updateMutation.mutate(
        { id: editingRule.id, body: output },
        { onSuccess: () => setEditingRule(null) },
      )
    },
    [editingRule, updateMutation],
  )

  const handleToggle = useCallback(
    (rule: AutomationRule) => {
      updateMutation.mutate({
        id: rule.id,
        body: { is_enabled: !rule.is_enabled },
      })
    },
    [updateMutation],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id))
    },
    [],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-text-primary">Automations</h2>
          {rules && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary">
              {rules.length} rule{rules.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingRule(null)
            setShowBuilder(true)
          }}
        >
          New Automation
        </Button>
      </div>

      {/* Builder for creating */}
      {showBuilder && !editingRule && (
        <div className="mb-6">
          <AutomationBuilder
            onSave={handleCreate}
            onCancel={() => setShowBuilder(false)}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-lg" />
          ))}
        </div>
      )}

      {/* Rule list */}
      {!isLoading && rules?.length === 0 && !showBuilder && (
        <div className="p-12 rounded-xl bg-white dark:bg-dark-surface border border-surface-200 dark:border-dark-border text-center">
          <Zap className="h-12 w-12 text-text-tertiary mx-auto mb-2" />
          <h3 className="text-lg font-medium text-text-secondary mb-1">
            No automations yet
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Create your first automation to streamline your workflow.
          </p>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowBuilder(true)}
          >
            Create Automation
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rules?.map((rule) => (
          <div
            key={rule.id}
            className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface dark:border-dark-border"
          >
            <div className={cn('p-4', expandedId === rule.id && 'pb-0')}>
              {/* Editing view */}
              {editingRule?.id === rule.id ? (
                <AutomationBuilder
                  rule={rule}
                  onSave={handleUpdate}
                  onCancel={() => setEditingRule(null)}
                />
              ) : (
                <>
                  {/* Summary row */}
                  <div className="flex items-center gap-3">
                    <button
                      role="switch"
                      aria-checked={rule.is_enabled}
                      title={rule.is_enabled ? 'Enabled' : 'Disabled'}
                      onClick={() => handleToggle(rule)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0',
                        rule.is_enabled ? 'bg-primary-500' : 'bg-surface-300',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                          rule.is_enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {rule.name}
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-amber-300 text-amber-700 dark:text-amber-400">
                          When: {rule.trigger_type.replace(/_/g, ' ')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 dark:text-green-400">
                          Then: {rule.action_type.replace(/_/g, ' ')}
                        </span>
                        {rule.execution_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary">
                            {rule.execution_count} execution{rule.execution_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      title="Edit"
                      className="p-1.5 rounded-md text-text-secondary hover:bg-surface-100 transition-colors"
                      onClick={() => {
                        setShowBuilder(false)
                        setEditingRule(rule)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      title="Delete"
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      title={expandedId === rule.id ? 'Collapse' : 'Execution Log'}
                      className="p-1.5 rounded-md text-text-secondary hover:bg-surface-100 transition-colors"
                      onClick={() => toggleExpand(rule.id)}
                    >
                      {expandedId === rule.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded: execution log */}
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      expandedId === rule.id ? 'max-h-[9999px] mt-4 mb-2' : 'max-h-0',
                    )}
                  >
                    <p className="text-sm font-medium text-text-primary mb-2">
                      Execution History
                    </p>
                    <ExecutionLog ruleId={rule.id} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
