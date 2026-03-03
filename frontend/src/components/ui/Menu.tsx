import type { ReactNode } from 'react'
import {
  Menu as HeadlessMenu,
  MenuButton as HeadlessMenuButton,
  MenuItems as HeadlessMenuItems,
  MenuItem as HeadlessMenuItem,
} from '@headlessui/react'
import { cn } from '@/lib/cn'

/* ── Menu (root wrapper) ── */
export interface MenuProps {
  children: ReactNode
  className?: string
}

export function Menu({ children, className }: MenuProps) {
  return (
    <HeadlessMenu as="div" className={cn('relative inline-block text-left', className)}>
      {children}
    </HeadlessMenu>
  )
}

/* ── MenuButton ── */
export interface MenuButtonProps {
  children: ReactNode
  className?: string
}

export function MenuButton({ children, className }: MenuButtonProps) {
  return (
    <HeadlessMenuButton
      className={cn('inline-flex items-center focus:outline-none', className)}
    >
      {children}
    </HeadlessMenuButton>
  )
}

/* ── MenuItems (dropdown panel) ── */
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

export interface MenuItemsProps {
  children: ReactNode
  className?: string
  anchor?: AnchorTo
}

export function MenuItems({ children, className, anchor }: MenuItemsProps) {
  return (
    <HeadlessMenuItems
      transition
      anchor={anchor ?? 'bottom end'}
      className={cn(
        'z-[--z-dropdown] min-w-[180px] rounded-[--radius-md] border border-surface-200 bg-white py-1 shadow-lg',
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
    </HeadlessMenuItems>
  )
}

/* ── MenuItem ── */
export interface MenuItemProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: ReactNode
  destructive?: boolean
}

export function MenuItem({
  children,
  onClick,
  disabled = false,
  className,
  icon,
  destructive = false,
}: MenuItemProps) {
  return (
    <HeadlessMenuItem disabled={disabled}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary',
          'data-[focus]:bg-surface-100 dark:data-[focus]:bg-surface-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          destructive && 'text-error data-[focus]:bg-error-light data-[focus]:text-error',
          className
        )}
      >
        {icon && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        {children}
      </button>
    </HeadlessMenuItem>
  )
}

/* ── MenuDivider ── */
export function MenuDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('my-1 border-t border-surface-200 dark:border-surface-300', className)}
      role="separator"
    />
  )
}
