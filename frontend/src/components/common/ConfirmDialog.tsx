import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

type Severity = 'info' | 'warning' | 'danger'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  severity?: Severity
  confirmText?: string
  cancelText?: string
  confirmValue?: string
}

const severityColors: Record<Severity, { bg: string; border: string; btn: string }> = {
  info: { bg: 'transparent', border: 'divider', btn: 'primary' },
  warning: { bg: 'rgba(255, 167, 38, 0.08)', border: 'warning.main', btn: 'warning' },
  danger: { bg: 'rgba(244, 67, 54, 0.08)', border: 'error.main', btn: 'error' },
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  severity = 'info',
  confirmText,
  cancelText = 'Cancel',
  confirmValue,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const colors = severityColors[severity]
  const needsTyping = !!confirmValue
  const isConfirmEnabled = !needsTyping || inputValue === confirmValue

  const defaultConfirmText =
    confirmText ?? (severity === 'danger' ? 'Delete' : severity === 'warning' ? 'Confirm' : 'OK')

  useEffect(() => {
    if (!open) setInputValue('')
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: colors.bg,
            border: severity !== 'info' ? '1px solid' : 'none',
            borderColor: colors.border,
            mb: needsTyping ? 2 : 0,
          }}
        >
          <Typography variant="body2">{message}</Typography>
        </Box>
        {needsTyping && (
          <TextField
            fullWidth
            size="small"
            placeholder={`Type "${confirmValue}" to confirm`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={colors.btn as 'primary' | 'warning' | 'error'}
          disabled={!isConfirmEnabled}
        >
          {defaultConfirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
