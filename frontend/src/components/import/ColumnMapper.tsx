import { useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IssueField {
  value: string
  label: string
  required?: boolean
}

interface ColumnMapperProps {
  csvColumns: string[]
  issueFields: IssueField[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ISSUE_FIELDS: IssueField[] = [
  { value: 'summary', label: 'Summary', required: true },
  { value: 'description', label: 'Description' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'issue_type', label: 'Issue Type' },
  { value: 'labels', label: 'Labels' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'estimated_hours', label: 'Estimated Hours' },
  { value: 'story_points', label: 'Story Points' },
]

// ---------------------------------------------------------------------------
// Auto-detect logic
// ---------------------------------------------------------------------------

function computeSimilarity(a: string, b: string): number {
  const normalA = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalB = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (normalA === normalB) return 1
  if (normalA.includes(normalB) || normalB.includes(normalA)) return 0.7
  // Simple character overlap
  const setA = new Set(normalA)
  const setB = new Set(normalB)
  const intersection = [...setA].filter((c) => setB.has(c)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

export function autoDetectMapping(
  csvColumns: string[],
  issueFields: IssueField[],
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const used = new Set<string>()

  for (const col of csvColumns) {
    let bestField = ''
    let bestScore = 0.5 // Minimum threshold

    for (const field of issueFields) {
      if (used.has(field.value)) continue
      const score = Math.max(
        computeSimilarity(col, field.value),
        computeSimilarity(col, field.label),
      )
      if (score > bestScore) {
        bestScore = score
        bestField = field.value
      }
    }

    if (bestField) {
      mapping[col] = bestField
      used.add(bestField)
    }
  }

  return mapping
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ColumnMapper({
  csvColumns,
  issueFields: issueFieldsProp,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const issueFields = issueFieldsProp.length > 0 ? issueFieldsProp : DEFAULT_ISSUE_FIELDS

  const mappedFieldValues = useMemo(
    () => new Set(Object.values(mapping)),
    [mapping],
  )

  const handleChange = useCallback(
    (csvCol: string, fieldValue: string) => {
      const next = { ...mapping }
      if (fieldValue === '') {
        delete next[csvCol]
      } else {
        next[csvCol] = fieldValue
      }
      onMappingChange(next)
    },
    [mapping, onMappingChange],
  )

  const mappedCount = Object.keys(mapping).length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Column Mapping
        </Typography>
        <Chip
          label={`${mappedCount} of ${csvColumns.length} mapped`}
          size="small"
          color={mappedCount > 0 ? 'primary' : 'default'}
          variant="outlined"
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {csvColumns.map((col) => {
          const isMapped = !!mapping[col]
          return (
            <Box
              key={col}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: isMapped ? 'action.selected' : 'background.paper',
                border: '1px solid',
                borderColor: isMapped ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
              }}
            >
              {/* CSV column name */}
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {isMapped && (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 16, color: 'primary.main' }}
                  />
                )}
                <Typography variant="body2" fontWeight={isMapped ? 600 : 400}>
                  {col}
                </Typography>
              </Box>

              {/* Arrow */}
              <ArrowForwardIcon
                sx={{ fontSize: 16, color: 'text.disabled' }}
              />

              {/* Issue field dropdown */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Issue Field</InputLabel>
                <Select
                  value={mapping[col] ?? ''}
                  label="Issue Field"
                  onChange={(e: SelectChangeEvent) => handleChange(col, e.target.value)}
                >
                  <MenuItem value="">
                    <em>Skip this column</em>
                  </MenuItem>
                  {issueFields.map((f) => (
                    <MenuItem
                      key={f.value}
                      value={f.value}
                      disabled={mappedFieldValues.has(f.value) && mapping[col] !== f.value}
                    >
                      {f.label}
                      {f.required && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="error"
                          sx={{ ml: 0.5 }}
                        >
                          *
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export { DEFAULT_ISSUE_FIELDS }
