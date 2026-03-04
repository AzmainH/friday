import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  handler: () => void
  scope: 'global' | 'project'
  section: 'Navigation' | 'Project Views' | 'Actions' | 'Lists' | 'Other'
  display: string // human-readable key label, e.g. "g then p"
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const [showHelp, setShowHelp] = useState(false)

  // "g then X" combo tracking
  const pendingG = useRef(false)
  const pendingTimer = useRef<ReturnType<typeof setTimeout>>()

  // Build shortcuts list (stable across renders via navigate/projectId deps)
  const shortcuts: Shortcut[] = [
    // Navigation
    {
      key: '/',
      description: 'Focus search',
      scope: 'global',
      section: 'Navigation',
      display: '/',
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-search-input]',
        )
        searchInput?.focus()
      },
    },
    {
      key: 'p',
      description: 'Go to Projects',
      scope: 'global',
      section: 'Navigation',
      display: 'g then p',
      handler: () => navigate('/projects'),
    },
    {
      key: 's',
      description: 'Go to Settings',
      scope: 'global',
      section: 'Navigation',
      display: 'g then s',
      handler: () => navigate('/settings'),
    },
    {
      key: 'h',
      description: 'Go to Home',
      scope: 'global',
      section: 'Navigation',
      display: 'g then h',
      handler: () => navigate('/'),
    },
    // Project Views (only when in project context)
    {
      key: 'b',
      description: 'Board view',
      scope: 'project',
      section: 'Project Views',
      display: 'b',
      handler: () => {
        if (projectId) navigate(`/projects/${projectId}/board`)
      },
    },
    {
      key: 't',
      description: 'Table view',
      scope: 'project',
      section: 'Project Views',
      display: 't',
      handler: () => {
        if (projectId) navigate(`/projects/${projectId}/table`)
      },
    },
    // Actions
    {
      key: 'c',
      description: 'Create issue',
      scope: 'project',
      section: 'Actions',
      display: 'c',
      handler: () => {
        // Dispatch a custom event that the create-issue dialog can listen for
        window.dispatchEvent(new CustomEvent('friday:create-issue'))
      },
    },
    // Other
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      scope: 'global',
      section: 'Other',
      display: '?',
      handler: () => setShowHelp((v) => !v),
    },
  ]

  // "g then X" navigation shortcuts (p, s, h)
  const gComboKeys = new Set(['p', 's', 'h'])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()

      // Handle "g then X" combo
      if (pendingG.current && gComboKeys.has(key)) {
        e.preventDefault()
        pendingG.current = false
        clearTimeout(pendingTimer.current)

        const shortcut = shortcuts.find(
          (s) => s.key === key && s.section === 'Navigation' && s.display.startsWith('g then'),
        )
        shortcut?.handler()
        return
      }

      // Start "g" combo
      if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        pendingG.current = true
        clearTimeout(pendingTimer.current)
        pendingTimer.current = setTimeout(() => {
          pendingG.current = false
        }, 800)
        return
      }

      // Reset pending g on any other key
      pendingG.current = false

      // Match single-key shortcuts
      for (const shortcut of shortcuts) {
        // Skip "g then X" shortcuts here
        if (shortcut.display.startsWith('g then')) continue

        if (
          e.key === shortcut.key &&
          !!e.ctrlKey === !!shortcut.ctrl &&
          !!e.shiftKey === !!shortcut.shift &&
          !!e.metaKey === !!shortcut.meta
        ) {
          // For project-scoped shortcuts, only fire if in project context
          if (shortcut.scope === 'project' && !projectId) continue

          e.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [navigate, projectId, showHelp],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(pendingTimer.current)
  }, [])

  return { showHelp, setShowHelp, shortcuts }
}
