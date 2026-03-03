import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { cn } from '@/lib/cn'

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

const severityStyles: Record<Severity, { box: string; btn: string }> = {
  info: { box: '', btn: 'bg-primary-500 hover:bg-primary-600 text-white' },
  warning: {
    box: 'bg-warning-light border border-warning',
    btn: 'bg-warning hover:bg-amber-600 text-white',
  },
  danger: {
    box: 'bg-error-light border border-error',
    btn: 'bg-error hover:bg-red-600 text-white',
  },
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
  const styles = severityStyles[severity]
  const needsTyping = !!confirmValue
  const isConfirmEnabled = !needsTyping || inputValue === confirmValue

  const defaultConfirmText =
    confirmText ?? (severity === 'danger' ? 'Delete' : severity === 'warning' ? 'Confirm' : 'OK')

  useEffect(() => {
    if (!open) setInputValue('')
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[--z-modal]">
      <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white dark:bg-surface-100 rounded-[--radius-xl] shadow-2xl">
          <DialogTitle className="text-lg font-semibold text-text-primary px-6 pt-5 pb-2">
            {title}
          </DialogTitle>
          <div className="px-6 pb-4">
            <div className={cn('p-3 rounded-[--radius-sm]', styles.box, needsTyping && 'mb-3')}>
              <p className="text-sm text-text-secondary">{message}</p>
            </div>
            {needsTyping && (
              <input
                type="text"
                className="w-full rounded-[--radius-sm] border border-surface-200 bg-white dark:bg-surface-100 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder={`Type "${confirmValue}" to confirm`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="flex justify-end gap-2 px-6 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-100 rounded-[--radius-sm] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={!isConfirmEnabled}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-[--radius-sm] transition-colors',
                styles.btn,
                !isConfirmEnabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {defaultConfirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
