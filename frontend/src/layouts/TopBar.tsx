import { Menu, Sun, Moon, Bell, Search, Sparkles } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'

interface TopBarProps {
  onMenuClick: () => void
  onAIToggle?: () => void
  aiPanelOpen?: boolean
}

export default function TopBar({ onMenuClick, onAIToggle, aiPanelOpen }: TopBarProps) {
  const themeMode = useUiStore((s) => s.themeMode)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <header className="sticky top-0 z-[--z-sticky] bg-white/80 dark:bg-surface-100/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-200">
      <div className="flex items-center gap-2 h-14 px-4">
        {/* Menu toggle */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Search trigger */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[--radius-sm] border border-surface-200 text-text-tertiary text-sm hover:border-surface-300 hover:text-text-secondary transition-colors flex-1 max-w-sm">
          <Search size={16} />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] font-medium bg-surface-100 dark:bg-surface-200 px-1.5 py-0.5 rounded">
            Ctrl K
          </kbd>
        </button>

        <div className="flex-1 md:flex-none" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
            aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* AI Copilot toggle */}
          {onAIToggle && (
            <button
              onClick={onAIToggle}
              className={`p-2 rounded-[--radius-sm] transition-colors ${
                aiPanelOpen
                  ? 'bg-[#009688]/10 text-[#009688]'
                  : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
              }`}
              aria-label={aiPanelOpen ? 'Close AI assistant' : 'Open AI assistant'}
            >
              <Sparkles size={18} />
            </button>
          )}

          {/* Notifications */}
          <button
            className="relative p-2 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* User avatar */}
          <button
            className="ml-1 w-8 h-8 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center hover:bg-primary-600 transition-colors"
            aria-label="User menu"
          >
            DU
          </button>
        </div>
      </div>
    </header>
  )
}
