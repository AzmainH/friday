import { useEffect, useState, useRef, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

interface UndoToastProps {
  open: boolean
  message: string
  onUndo: () => void
  onClose: () => void
  duration?: number
}

export default function UndoToast({
  open,
  message,
  onUndo,
  onClose,
  duration = 10_000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!open) {
      cleanup()
      setProgress(100)
      return
    }

    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        cleanup()
        onClose()
      }
    }, 50)

    return cleanup
  }, [open, duration, onClose, cleanup])

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={(_e, reason) => {
        if (reason !== 'clickaway') onClose()
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 8,
          minWidth: 320,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1 }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {message}
          </Typography>
          <Button size="small" color="primary" onClick={onUndo} sx={{ fontWeight: 700 }}>
            Undo
          </Button>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 3 }} />
      </Box>
    </Snackbar>
  )
}
