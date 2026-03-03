import { useCallback, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCreateCostEntry } from '@/hooks/useBudget'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COST_CATEGORIES = [
  'Labor',
  'Software',
  'Hardware',
  'Infrastructure',
  'Consulting',
  'Travel',
  'Training',
  'Other',
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostEntryFormValues {
  category: string
  amount: string
  description: string
  date: string
  issue_id: string
}

interface IssueOption {
  id: string
  label: string
}

interface CostEntryFormProps {
  open: boolean
  onClose: () => void
  projectId: string
  issueOptions?: IssueOption[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CostEntryForm({
  open,
  onClose,
  projectId,
  issueOptions = [],
}: CostEntryFormProps) {
  const createCost = useCreateCostEntry()
  const [issueSearch, setIssueSearch] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CostEntryFormValues>({
    defaultValues: {
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      issue_id: '',
    },
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (values: CostEntryFormValues) => {
      await createCost.mutateAsync({
        project_id: projectId,
        category: values.category,
        amount: parseFloat(values.amount),
        description: values.description || null,
        date: values.date,
        issue_id: values.issue_id || null,
      })
      handleClose()
    },
    [createCost, projectId, handleClose],
  )

  const filteredIssues = useMemo(() => {
    if (!issueSearch) return issueOptions
    const q = issueSearch.toLowerCase()
    return issueOptions.filter((o) => o.label.toLowerCase().includes(q))
  }, [issueOptions, issueSearch])

  const inputClass =
    'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'
  const labelClass = 'block text-sm font-medium text-text-primary mb-1'
  const errorClass = 'text-xs text-red-500 mt-1'

  return (
    <Dialog open={open} onClose={() => handleClose()} title="Add Cost Entry" size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5">
          {/* Category */}
          <div>
            <label className={labelClass}>Category *</label>
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <select {...field} className={inputClass}>
                  <option value="">Select a category</option>
                  {COST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && (
              <span className={errorClass}>{errors.category.message}</span>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={labelClass}>Amount *</label>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Amount is required',
                validate: (v) =>
                  (!isNaN(parseFloat(v)) && parseFloat(v) > 0) ||
                  'Enter a positive number',
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                />
              )}
            />
            {errors.amount && (
              <span className={errorClass}>{errors.amount.message}</span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  className={inputClass}
                  placeholder="Optional description"
                />
              )}
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>Date *</label>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <input {...field} type="date" className={inputClass} />
              )}
            />
            {errors.date && (
              <span className={errorClass}>{errors.date.message}</span>
            )}
          </div>

          {/* Issue (optional) */}
          <div>
            <label className={labelClass}>Issue (optional)</label>
            <Controller
              name="issue_id"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Search issues..."
                    value={
                      field.value
                        ? issueOptions.find((o) => o.id === field.value)?.label ?? issueSearch
                        : issueSearch
                    }
                    onChange={(e) => {
                      setIssueSearch(e.target.value)
                      if (!e.target.value) field.onChange('')
                    }}
                    onFocus={() => setIssueSearch('')}
                  />
                  {issueSearch && filteredIssues.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border border-surface-200 rounded-lg bg-white dark:bg-dark-surface shadow-lg">
                      {filteredIssues.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-dark-border"
                          onClick={() => {
                            field.onChange(opt.id)
                            setIssueSearch('')
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 border-t-0 px-0">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Cost'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
