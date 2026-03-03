import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

export interface SelectOption {
  value: string
  label: string
}

export interface TableCellProps {
  /** Current display value. */
  value: string | number | null
  /** Called when the user commits an edit. */
  onChange: (newValue: string | number | null) => void
  /** Input type for the editing control. */
  type: 'text' | 'select' | 'number' | 'date'
  /** Options for select type. */
  options?: SelectOption[]
  /** If true, the cell is not editable. */
  disabled?: boolean
}

export default function TableCell({ value, onChange, type, options = [], disabled = false }: TableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft whenever the external value changes while not editing
  useEffect(() => {
    if (!editing) {
      setDraft(value != null ? String(value) : '')
    }
  }, [value, editing])

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text') {
        inputRef.current.select()
      }
    }
  }, [editing, type])

  const startEditing = useCallback(() => {
    if (!disabled) {
      setEditing(true)
    }
  }, [disabled])

  const commit = useCallback(() => {
    setEditing(false)
    if (draft === (value != null ? String(value) : '')) return
    if (type === 'number') {
      const n = draft === '' ? null : Number(draft)
      onChange(n != null && isNaN(n) ? value : n)
    } else {
      onChange(draft || null)
    }
  }, [draft, value, type, onChange])

  const cancel = useCallback(() => {
    setDraft(value != null ? String(value) : '')
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    },
    [commit, cancel],
  )

  // --- Render ---

  if (!editing) {
    return (
      <Box
        onClick={startEditing}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          px: 1,
          py: 0.5,
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0.5,
          '&:hover': disabled
            ? {}
            : { bgcolor: 'action.hover' },
        }}
      >
        <Typography variant="body2" noWrap>
          {value != null ? String(value) : '\u2014'}
        </Typography>
      </Box>
    )
  }

  if (type === 'select') {
    return (
      <Select
        size="small"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setEditing(false)
          onChange(e.target.value)
        }}
        onBlur={cancel}
        inputRef={inputRef}
        open
        fullWidth
        sx={{ minWidth: 100 }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    )
  }

  return (
    <TextField
      inputRef={inputRef}
      size="small"
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': { py: 0, fontSize: '0.875rem' },
      }}
    />
  )
}
