import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Slider from '@mui/material/Slider'
import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import StatusTransitionDropdown from '@/components/issue/StatusTransitionDropdown'
import { useIssueUpdate } from '@/hooks/useIssueDetail'
import { useProjectStore } from '@/stores/projectStore'
import { PRIORITY_COLORS } from '@/utils/formatters'
import type { Issue, User, Label, WorkflowStatus } from '@/types/api'

interface IssueFieldsPanelProps {
  issue: Issue
  members?: User[]
  labels?: Label[]
}

type EditingField = string | null

interface InlineFieldProps {
  label: string
  value: React.ReactNode
  editingField: EditingField
  fieldKey: string
  onStartEdit: (key: string) => void
  onCancel: () => void
  editContent: React.ReactNode
}

function InlineField({
  label,
  value,
  editingField,
  fieldKey,
  onStartEdit,
  onCancel,
  editContent,
}: InlineFieldProps) {
  const isEditing = editingField === fieldKey

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      {isEditing ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box sx={{ flex: 1 }}>{editContent}</Box>
          <Tooltip title="Cancel">
            <IconButton size="small" onClick={onCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            borderRadius: 1,
            px: 0.5,
            py: 0.25,
            mx: -0.5,
            '&:hover': {
              bgcolor: 'action.hover',
              '& .edit-icon': { opacity: 1 },
            },
          }}
          onClick={() => onStartEdit(fieldKey)}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>{value}</Box>
          <EditIcon
            className="edit-icon"
            sx={{ fontSize: 14, opacity: 0, color: 'text.secondary', transition: 'opacity 0.15s' }}
          />
        </Box>
      )}
    </Box>
  )
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const

export default function IssueFieldsPanel({
  issue,
  members = [],
  labels = [],
}: IssueFieldsPanelProps) {
  const [editingField, setEditingField] = useState<EditingField>(null)
  const updateMutation = useIssueUpdate()
  const statuses = useProjectStore((s) => s.statuses)

  const saveField = useCallback(
    (field: string, value: unknown) => {
      updateMutation.mutate({ issueId: issue.id, body: { [field]: value } })
      setEditingField(null)
    },
    [issue.id, updateMutation],
  )

  const handleStartEdit = (key: string) => {
    setEditingField(key)
  }

  const handleCancel = () => {
    setEditingField(null)
  }

  const assignee = issue.assignee ?? members.find((m) => m.id === issue.assignee_id)
  const issueLabels = issue.labels ?? []

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {/* Status */}
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
          Status
        </Typography>
        <StatusTransitionDropdown
          currentStatusId={issue.status_id}
          statuses={statuses}
          onChange={(statusId) => saveField('status_id', statusId)}
        />
      </Box>

      {/* Assignee */}
      <InlineField
        label="Assignee"
        fieldKey="assignee"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          assignee ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={assignee.avatar_url ?? undefined}
                sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
              >
                {assignee.display_name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{assignee.display_name}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unassigned
            </Typography>
          )
        }
        editContent={
          <Select
            size="small"
            fullWidth
            value={issue.assignee_id ?? ''}
            onChange={(e) => saveField('assignee_id', e.target.value || null)}
            autoFocus
            onBlur={handleCancel}
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
        }
      />

      {/* Priority */}
      <InlineField
        label="Priority"
        fieldKey="priority"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <Chip
            label={issue.priority}
            size="small"
            sx={{
              bgcolor: PRIORITY_COLORS[issue.priority] ?? '#9e9e9e',
              color: '#fff',
              fontWeight: 500,
              textTransform: 'capitalize',
              fontSize: '0.75rem',
            }}
          />
        }
        editContent={
          <Select
            size="small"
            fullWidth
            value={issue.priority}
            onChange={(e) => saveField('priority', e.target.value)}
            autoFocus
            onBlur={handleCancel}
          >
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
        }
      />

      {/* Labels */}
      <InlineField
        label="Labels"
        fieldKey="labels"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          issueLabels.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {issueLabels.map((label) => (
                <Chip
                  key={label.id}
                  label={label.name}
                  size="small"
                  sx={{
                    bgcolor: label.color,
                    color: '#fff',
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              None
            </Typography>
          )
        }
        editContent={
          <Autocomplete
            multiple
            size="small"
            options={labels}
            getOptionLabel={(option) => option.name}
            defaultValue={issueLabels}
            onChange={(_e, newValue) => {
              saveField(
                'label_ids',
                newValue.map((l) => l.id),
              )
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
            renderInput={(params) => <TextField {...params} placeholder="Select labels" />}
          />
        }
      />

      {/* Due Date */}
      <InlineField
        label="Due Date"
        fieldKey="due_date"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <Typography variant="body2" color={issue.due_date ? 'text.primary' : 'text.secondary'}>
            {issue.due_date
              ? new Date(issue.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No date'}
          </Typography>
        }
        editContent={
          <TextField
            type="date"
            size="small"
            fullWidth
            defaultValue={issue.due_date ?? ''}
            onChange={(e) => saveField('due_date', e.target.value || null)}
            autoFocus
            slotProps={{ inputLabel: { shrink: true } }}
          />
        }
      />

      {/* Story Points */}
      <InlineField
        label="Story Points"
        fieldKey="story_points"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <Typography variant="body2" color={issue.story_points != null ? 'text.primary' : 'text.secondary'}>
            {issue.story_points ?? 'Not set'}
          </Typography>
        }
        editContent={
          <TextField
            type="number"
            size="small"
            fullWidth
            defaultValue={issue.story_points ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('story_points', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('story_points', val)
              }
            }}
            autoFocus
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        }
      />

      {/* Percent Complete */}
      <Box sx={{ py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
          Progress
        </Typography>
        <Box sx={{ px: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Slider
            size="small"
            value={issue.percent_complete}
            onChange={(_e, val) => {
              // Slider provides live update; we debounce via onChangeCommitted
            }}
            onChangeCommitted={(_e, val) => saveField('percent_complete', val)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}%`}
            min={0}
            max={100}
            step={5}
            sx={{ flex: 1 }}
          />
          <Typography variant="body2" fontWeight={500} sx={{ minWidth: 36 }}>
            {issue.percent_complete}%
          </Typography>
        </Box>
      </Box>

      {/* Estimated Hours */}
      <InlineField
        label="Estimated Hours"
        fieldKey="estimated_hours"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <Typography variant="body2" color={issue.estimated_hours != null ? 'text.primary' : 'text.secondary'}>
            {issue.estimated_hours != null ? `${issue.estimated_hours}h` : 'Not set'}
          </Typography>
        }
        editContent={
          <TextField
            type="number"
            size="small"
            fullWidth
            defaultValue={issue.estimated_hours ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('estimated_hours', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('estimated_hours', val)
              }
            }}
            autoFocus
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        }
      />

      {/* Actual Hours */}
      <InlineField
        label="Actual Hours"
        fieldKey="actual_hours"
        editingField={editingField}
        onStartEdit={handleStartEdit}
        onCancel={handleCancel}
        value={
          <Typography variant="body2" color={issue.actual_hours != null ? 'text.primary' : 'text.secondary'}>
            {issue.actual_hours != null ? `${issue.actual_hours}h` : 'Not set'}
          </Typography>
        }
        editContent={
          <TextField
            type="number"
            size="small"
            fullWidth
            defaultValue={issue.actual_hours ?? ''}
            onBlur={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              saveField('actual_hours', val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const val = target.value === '' ? null : Number(target.value)
                saveField('actual_hours', val)
              }
            }}
            autoFocus
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        }
      />
    </Box>
  )
}
