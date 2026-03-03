import { useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Stack from '@mui/material/Stack'
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Add Cost Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Category */}
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  {COST_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Amount */}
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
                <TextField
                  {...field}
                  label="Amount"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, step: '0.01' }}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />

            {/* Date */}
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                />
              )}
            />

            {/* Issue (optional autocomplete) */}
            <Controller
              name="issue_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={issueOptions}
                  getOptionLabel={(opt) => opt.label}
                  value={
                    issueOptions.find((o) => o.id === field.value) ?? null
                  }
                  onChange={(_e, newVal) => field.onChange(newVal?.id ?? '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Issue (optional)" fullWidth />
                  )}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Add Cost'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
