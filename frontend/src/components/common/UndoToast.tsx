import { useEffect, useState, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

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

  if (!open) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[--z-toast]">
      <div
        className={cn(
          'bg-white dark:bg-surface-100 rounded-[--radius-md] shadow-xl min-w-[320px] overflow-hidden',
          'border border-surface-200 dark:border-surface-200',
        )}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <p className="flex-1 text-sm text-text-primary">{message}</p>
          <button
            onClick={onUndo}
            className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-[--radius-xs] text-text-tertiary hover:bg-surface-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-[3px] bg-surface-100 dark:bg-surface-200">
          <div
            className="h-full bg-primary-500 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
