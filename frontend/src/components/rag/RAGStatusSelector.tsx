import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { RAG_COLORS } from '@/utils/formatters'

// ---- Types ----

type RAGValue = 'green' | 'amber' | 'red' | 'none'

const RAG_OPTIONS: { value: RAGValue; label: string }[] = [
  { value: 'green', label: 'Green - On Track' },
  { value: 'amber', label: 'Amber - At Risk' },
  { value: 'red', label: 'Red - Off Track' },
]

// ---- Props ----

interface RAGStatusSelectorProps {
  value: RAGValue
  onChange: (value: RAGValue) => void
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  disabled?: boolean
}

// ---- Size map ----

const SIZE_MAP = {
  small: 20,
  medium: 28,
  large: 36,
}

// ---- Component ----

export default function RAGStatusSelector({
  value,
  onChange,
  size = 'medium',
  showLabel = false,
  disabled = false,
}: RAGStatusSelectorProps) {
  const circleSize = SIZE_MAP[size]

  const handleClick = useCallback(
    (ragValue: RAGValue) => {
      if (disabled) return
      // If already selected, toggle to 'none'; otherwise select it
      onChange(value === ragValue ? 'none' : ragValue)
    },
    [value, onChange, disabled],
  )

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {RAG_OPTIONS.map(({ value: ragValue, label }) => {
        const isSelected = value === ragValue
        const color = RAG_COLORS[ragValue]

        return (
          <Tooltip key={ragValue} title={label} arrow>
            <Box
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => handleClick(ragValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick(ragValue)
                }
              }}
              sx={{
                width: circleSize,
                height: circleSize,
                borderRadius: '50%',
                bgcolor: color,
                cursor: 'pointer',
                border: '3px solid',
                borderColor: isSelected ? 'text.primary' : 'transparent',
                boxShadow: isSelected
                  ? `0 0 0 2px ${color}40`
                  : 'none',
                transition: 'all 0.15s ease-in-out',
                opacity: isSelected ? 1 : 0.5,
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            />
          </Tooltip>
        )
      })}

      {showLabel && (
        <Typography
          variant="body2"
          sx={{
            ml: 0.5,
            fontWeight: 600,
            color: value !== 'none' ? RAG_COLORS[value] : 'text.secondary',
            textTransform: 'capitalize',
          }}
        >
          {value === 'none' ? 'Not set' : value}
        </Typography>
      )}
    </Box>
  )
}
