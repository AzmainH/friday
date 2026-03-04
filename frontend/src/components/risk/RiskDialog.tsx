import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCreateRisk, useUpdateRisk } from '@/hooks/useRisks'
import type { Risk } from '@/hooks/useRisks'

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'resource', label: 'Resource' },
  { value: 'budget', label: 'Budget' },
  { value: 'scope', label: 'Scope' },
  { value: 'external', label: 'External' },
  { value: 'quality', label: 'Quality' },
]

const LEVELS = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
]

const STATUSES = [
  { value: 'identified', label: 'Identified' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'mitigating', label: 'Mitigating' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

const selectClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border appearance-none'

interface RiskDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  risk?: Risk | null
}

export default function RiskDialog({ open, onClose, projectId, risk }: RiskDialogProps) {
  const isEdit = !!risk

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('technical')
  const [probability, setProbability] = useState('medium')
  const [impact, setImpact] = useState('medium')
  const [status, setStatus] = useState('identified')
  const [dueDate, setDueDate] = useState('')
  const [mitigationPlan, setMitigationPlan] = useState('')
  const [contingencyPlan, setContingencyPlan] = useState('')

  const createRisk = useCreateRisk()
  const updateRisk = useUpdateRisk()

  // Populate form when editing
  useEffect(() => {
    if (risk) {
      setTitle(risk.title)
      setDescription(risk.description ?? '')
      setCategory(risk.category)
      setProbability(risk.probability)
      setImpact(risk.impact)
      setStatus(risk.status)
      setDueDate(risk.due_date ?? '')
      setMitigationPlan(risk.mitigation_plan ?? '')
      setContingencyPlan(risk.contingency_plan ?? '')
    } else {
      setTitle('')
      setDescription('')
      setCategory('technical')
      setProbability('medium')
      setImpact('medium')
      setStatus('identified')
      setDueDate('')
      setMitigationPlan('')
      setContingencyPlan('')
    }
  }, [risk, open])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      probability,
      impact,
      status,
      due_date: dueDate || null,
      mitigation_plan: mitigationPlan.trim() || null,
      contingency_plan: contingencyPlan.trim() || null,
    }

    if (isEdit && risk) {
      await updateRisk.mutateAsync({ riskId: risk.id, body })
    } else {
      await createRisk.mutateAsync({ project_id: projectId, ...body })
    }
    onClose()
  }, [
    title,
    description,
    category,
    probability,
    impact,
    status,
    dueDate,
    mitigationPlan,
    contingencyPlan,
    isEdit,
    risk,
    projectId,
    createRisk,
    updateRisk,
    onClose,
  ])

  const isPending = createRisk.isPending || updateRisk.isPending

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      title={isEdit ? 'Edit Risk' : 'Add Risk'}
      size="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Risk title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the risk..."
          />
        </div>

        {/* Category, Status, Due Date */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
            <select
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
            <select
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Due Date</label>
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Probability and Impact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Probability</label>
            <select
              className={selectClass}
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Impact</label>
            <select
              className={selectClass}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mitigation Plan */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Mitigation Plan
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={mitigationPlan}
            onChange={(e) => setMitigationPlan(e.target.value)}
            placeholder="How will this risk be mitigated?"
          />
        </div>

        {/* Contingency Plan */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Contingency Plan
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={contingencyPlan}
            onChange={(e) => setContingencyPlan(e.target.value)}
            placeholder="What is the fallback if the risk materializes?"
          />
        </div>
      </div>

      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim() || isPending} loading={isPending}>
          {isEdit ? 'Save Changes' : 'Add Risk'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
