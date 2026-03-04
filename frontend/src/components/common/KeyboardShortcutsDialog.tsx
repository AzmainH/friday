import { Dialog } from '@/components/ui/Dialog'
import type { Shortcut } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onClose: () => void
  shortcuts: Shortcut[]
}

const SECTION_ORDER = ['Navigation', 'Project Views', 'Actions', 'Other'] as const

export default function KeyboardShortcutsDialog({
  open,
  onClose,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const grouped = shortcuts.reduce<Record<string, Shortcut[]>>((acc, s) => {
    const section = s.section
    if (!acc[section]) acc[section] = []
    acc[section].push(s)
    return acc
  }, {})

  return (
    <Dialog open={open} onClose={() => onClose()} title="Keyboard Shortcuts" size="md">
      <div className="space-y-5">
        {SECTION_ORDER.map((section) => {
          const items = grouped[section]
          if (!items || items.length === 0) return null
          return (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                {section}
              </h3>
              <div className="space-y-1.5">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.display + shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-text-primary">{shortcut.description}</span>
                    <KeyBadge display={shortcut.display} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}

function KeyBadge({ display }: { display: string }) {
  // Handle compound keys like "g then p"
  const parts = display.split(' then ')
  return (
    <span className="flex items-center gap-1">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-xs text-text-tertiary">then</span>}
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-surface-100 dark:bg-surface-200 font-mono text-xs text-text-secondary border border-surface-200">
            {part}
          </kbd>
        </span>
      ))}
    </span>
  )
}
