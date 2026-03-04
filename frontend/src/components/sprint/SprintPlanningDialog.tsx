import { useState, useCallback } from 'react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCreateSprint } from '@/hooks/useSprints'

interface SprintPlanningDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
}

const inputClass =
  'w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border'

export default function SprintPlanningDialog({
  open,
  onClose,
  projectId,
}: SprintPlanningDialogProps) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const createSprint = useCreateSprint()

  const resetForm = useCallback(() => {
    setName('')
    setGoal('')
    setStartDate('')
    setEndDate('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !startDate || !endDate) return
    await createSprint.mutateAsync({
      project_id: projectId,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      goal: goal.trim() || undefined,
    })
    handleClose()
  }, [name, goal, startDate, endDate, projectId, createSprint, handleClose])

  const isValid = name.trim() && startDate && endDate && endDate >= startDate

  return (
    <Dialog open={open} onClose={() => handleClose()} title="Create Sprint" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Sprint Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Goal</label>
          <textarea
            className={inputClass}
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should this sprint accomplish?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6 border-t-0 px-0">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || createSprint.isPending}
          loading={createSprint.isPending}
        >
          Create Sprint
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
