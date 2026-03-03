import type { ReactNode } from 'react'
import {
  TabGroup,
  TabList as HeadlessTabList,
  Tab as HeadlessTab,
  TabPanels as HeadlessTabPanels,
  TabPanel as HeadlessTabPanel,
} from '@headlessui/react'
import { cn } from '@/lib/cn'

/* ── Tabs (root wrapper using TabGroup) ── */
export interface TabsProps {
  children: ReactNode
  className?: string
  defaultIndex?: number
  selectedIndex?: number
  onChange?: (index: number) => void
}

export function Tabs({
  children,
  className,
  defaultIndex,
  selectedIndex,
  onChange,
}: TabsProps) {
  return (
    <TabGroup
      defaultIndex={defaultIndex}
      selectedIndex={selectedIndex}
      onChange={onChange}
      className={className}
    >
      {children}
    </TabGroup>
  )
}

/* ── TabList ── */
export interface TabListProps {
  children: ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  return (
    <HeadlessTabList
      className={cn(
        'flex gap-0 border-b border-surface-200 dark:border-surface-300',
        className
      )}
    >
      {children}
    </HeadlessTabList>
  )
}

/* ── Tab ── */
export interface TabProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function Tab({ children, className, disabled }: TabProps) {
  return (
    <HeadlessTab
      disabled={disabled}
      className={cn(
        'px-4 py-2.5 text-sm font-medium focus:outline-none',
        'border-b-2 border-transparent',
        'text-text-secondary hover:text-text-primary',
        'data-[selected]:border-primary-500 data-[selected]:text-primary-600',
        'dark:data-[selected]:text-primary-400 dark:data-[selected]:border-primary-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </HeadlessTab>
  )
}

/* ── TabPanels ── */
export interface TabPanelsProps {
  children: ReactNode
  className?: string
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return (
    <HeadlessTabPanels className={className}>
      {children}
    </HeadlessTabPanels>
  )
}

/* ── TabPanel ── */
export interface TabPanelProps {
  children: ReactNode
  className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
  return (
    <HeadlessTabPanel className={cn('pt-4', className)}>
      {children}
    </HeadlessTabPanel>
  )
}
