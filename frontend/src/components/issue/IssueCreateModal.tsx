import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Autocomplete from '@mui/material/Autocomplete'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { createIssue } from '@/api/issues'
import { useProjectStore } from '@/stores/projectStore'
import { PRIORITY_COLORS } from '@/utils/formatters'
import type { Issue, User, Label } from '@/types/api'

const issueSchema = z.object({
  issue_type_id: z.string().min(1, 'Issue type is required'),
  summary: z.string().min(1, 'Summary is required').max(500, 'Summary must be 500 characters or less'),
  description: z.string().optional(),
  priority: z.string().default('medium'),
  assignee_id: z.string().nullable().optional(),
  label_ids: z.array(z.string()).optional(),
  due_date: z.string().nullable().optional(),
  estimated_hours: z.number().nullable().optional(),
  story_points: z.number().nullable().optional(),
  parent_id: z.string().nullable().optional(),
})

type IssueFormValues = z.infer<typeof issueSchema>

interface IssueCreateModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  parentId?: string
  members?: User[]
  labels?: Label[]
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const

export default function IssueCreateModal({
  open,
  onClose,
  projectId,
  parentId,
  members = [],
  labels = [],
}: IssueCreateModalProps) {
  const qc = useQueryClient()
  const issueTypes = useProjectStore((s) => s.issueTypes)
  const [description, setDescription] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issue_type_id: '',
      summary: '',
      description: '',
      priority: 'medium',
      assignee_id: null,
      label_ids: [],
      due_date: null,
      estimated_hours: null,
      story_points: null,
      parent_id: parentId ?? null,
    },
  })

  const createMutation = useMutation<Issue, Error, Record<string, unknown>>({
    mutationFn: (body) => createIssue(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    setDescription('')
    onClose()
  }

  const onSubmit = (data: IssueFormValues) => {
    const body: Record<string, unknown> = {
      ...data,
      description: description || null,
      estimated_hours: data.estimated_hours ?? null,
      story_points: data.story_points ?? null,
      due_date: data.due_date || null,
      assignee_id: data.assignee_id || null,
      parent_id: data.parent_id || null,
    }
    createMutation.mutate(body)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {parentId ? 'Create Sub-task' : 'Create Issue'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          {/* Issue Type */}
          <Controller
            name="issue_type_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={!!errors.issue_type_id}>
                <InputLabel>Issue Type</InputLabel>
                <Select {...field} label="Issue Type">
                  {issueTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon && (
                          <Typography fontSize="1rem">{type.icon}</Typography>
                        )}
                        <Typography variant="body2">{type.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.issue_type_id && (
                  <FormHelperText>{errors.issue_type_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Summary */}
          <Controller
            name="summary"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Summary"
                fullWidth
                size="small"
                error={!!errors.summary}
                helperText={errors.summary?.message}
                placeholder="Enter a brief summary of the issue"
                autoFocus
              />
            )}
          />

          {/* Description */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Description
            </Typography>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Add a description..."
              minHeight={120}
            />
          </Box>

          {/* Priority + Assignee row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select {...field} label="Priority">
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: PRIORITY_COLORS[p],
                            }}
                          />
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {p}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="assignee_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label="Assignee"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {members.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={member.avatar_url ?? undefined}
                            sx={{ width: 20, height: 20, fontSize: '0.65rem' }}
                          >
                            {member.display_name.charAt(0)}
                          </Avatar>
                          {member.display_name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>

          {/* Labels */}
          <Controller
            name="label_ids"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                size="small"
                options={labels}
                getOptionLabel={(option) => option.name}
                value={labels.filter((l) => (field.value ?? []).includes(l.id))}
                onChange={(_e, newValue) => {
                  field.onChange(newValue.map((l) => l.id))
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index })
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        sx={{ bgcolor: option.color, color: '#fff', fontSize: '0.7rem' }}
                        {...tagProps}
                      />
                    )
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Labels" placeholder="Select labels" />
                )}
              />
            )}
          />

          {/* Due Date + Story Points + Estimated Hours row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Due Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />

            <Controller
              name="story_points"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Story Points"
                  type="number"
                  size="small"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value)
                    field.onChange(val)
                  }}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
              )}
            />

            <Controller
              name="estimated_hours"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Estimated Hours"
                  type="number"
                  size="small"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value)
                    field.onChange(val)
                  }}
                  slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                />
              )}
            />
          </Stack>

          {/* Parent ID (for subtasks) */}
          {parentId && (
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Parent Issue"
                  size="small"
                  fullWidth
                  value={field.value ?? ''}
                  disabled
                  helperText="This issue will be created as a sub-task"
                />
              )}
            />
          )}

          {createMutation.isError && (
            <Typography variant="body2" color="error">
              Failed to create issue. Please try again.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : undefined}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Issue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
