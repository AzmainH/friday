import type { ReactNode } from 'react'
import {
  Popover as HeadlessPopover,
  PopoverButton as HeadlessPopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
} from '@headlessui/react'
import { cn } from '@/lib/cn'

/* ── Popover (root wrapper) ── */
export interface PopoverProps {
  children: ReactNode
  className?: string
}

export function Popover({ children, className }: PopoverProps) {
  return (
    <HeadlessPopover className={cn('relative', className)}>
      {children}
    </HeadlessPopover>
  )
}

/* ── PopoverButton ── */
export interface PopoverButtonProps {
  children: ReactNode
  className?: string
}

export function PopoverButton({ children, className }: PopoverButtonProps) {
  return (
    <HeadlessPopoverButton
      className={cn('inline-flex items-center focus:outline-none', className)}
    >
      {children}
    </HeadlessPopoverButton>
  )
}

/* ── PopoverPanel ── */
type AnchorTo =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top start'
  | 'top end'
  | 'right start'
  | 'right end'
  | 'bottom start'
  | 'bottom end'
  | 'left start'
  | 'left end'

export interface PopoverPanelProps {
  children: ReactNode
  className?: string
  anchor?: AnchorTo
}

export function PopoverPanel({ children, className, anchor }: PopoverPanelProps) {
  return (
    <HeadlessPopoverPanel
      transition
      anchor={anchor ?? 'bottom start'}
      className={cn(
        'z-[--z-dropdown] mt-2 rounded-[--radius-md] border border-surface-200 bg-white p-4 shadow-lg',
        'focus:outline-none',
        'dark:border-surface-300 dark:bg-surface-100',
        // Transition
        'transition duration-150 ease-out',
        'data-[closed]:scale-95 data-[closed]:opacity-0 data-[closed]:-translate-y-1',
        'data-[enter]:ease-out data-[leave]:ease-in',
        className
      )}
    >
      {children}
    </HeadlessPopoverPanel>
  )
}
