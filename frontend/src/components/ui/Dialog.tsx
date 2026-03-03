import type { ReactNode } from 'react'
import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export interface DialogProps {
  open: boolean
  onClose: (value: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: DialogSize
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: DialogProps) {
  return (
    <HeadlessDialog open={open} onClose={onClose} className="relative z-[--z-modal]">
      {/* Backdrop */}
      <DialogBackdrop
        transition
        className={cn(
          'fixed inset-0 bg-black/30 backdrop-blur-sm',
          'transition duration-200 ease-out',
          'data-[closed]:opacity-0'
        )}
      />

      {/* Centering container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={cn(
            'w-full rounded-[--radius-xl] bg-white shadow-2xl',
            'dark:bg-surface-100',
            sizeClasses[size],
            // Transition
            'transition duration-200 ease-out',
            'data-[closed]:scale-95 data-[closed]:opacity-0',
            className
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-300">
              <DialogTitle className="text-lg font-semibold text-text-primary">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={() => onClose(false)}
                className={cn(
                  'rounded-[--radius-sm] p-1.5 text-text-secondary',
                  'hover:bg-surface-100 hover:text-text-primary',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  'dark:hover:bg-surface-200'
                )}
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          )}

          {/* Description */}
          {description && (
            <Description className="px-6 pt-4 text-sm text-text-secondary">
              {description}
            </Description>
          )}

          {/* Body */}
          <div className="px-6 py-4">{children}</div>
        </DialogPanel>
      </div>
    </HeadlessDialog>
  )
}

/* ── Footer sub-component for action buttons ── */
export interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-surface-200 px-6 py-4',
        'dark:border-surface-300',
        className
      )}
    >
      {children}
    </div>
  )
}
