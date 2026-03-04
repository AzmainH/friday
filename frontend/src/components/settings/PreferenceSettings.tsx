import { cn } from '@/lib/cn'
import { useUiStore } from '@/stores/uiStore'
import { Sun, Moon, Monitor, LayoutGrid, List, GanttChart } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

type ThemeOption = 'light' | 'dark'
type ViewOption = 'board' | 'list' | 'timeline'
type DateFormatOption = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
type ItemsPerPage = 25 | 50 | 100

const inputClass =
  'w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-surface text-text-primary outline-none transition-colors'
const labelClass = 'block text-sm font-medium text-text-primary mb-1'

interface RadioCardProps {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function RadioCard({ selected, onClick, icon, label }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors cursor-pointer',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600'
          : 'border-surface-200 bg-white dark:bg-dark-surface text-text-secondary hover:border-surface-300',
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export default function PreferenceSettings() {
  const themeMode = useUiStore((s) => s.themeMode)
  const setThemeMode = useUiStore((s) => s.setThemeMode)

  // Local state for preferences that aren't yet backed by a store
  const [defaultView, setDefaultView] = useState<ViewOption>('board')
  const [dateFormat, setDateFormat] = useState<DateFormatOption>('YYYY-MM-DD')
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(25)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Persist preferences (theme is already persisted via zustand/persist)
    // Other preferences would be saved to backend when endpoint is available
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Preferences</h2>
        <p className="text-sm text-text-secondary mt-1">
          Customize your display and interaction preferences.
        </p>
      </div>

      {/* Theme */}
      <div>
        <label className={labelClass}>Theme</label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <RadioCard
            selected={themeMode === 'light'}
            onClick={() => setThemeMode('light')}
            icon={<Sun className="h-5 w-5" />}
            label="Light"
          />
          <RadioCard
            selected={themeMode === 'dark'}
            onClick={() => setThemeMode('dark')}
            icon={<Moon className="h-5 w-5" />}
            label="Dark"
          />
          <RadioCard
            selected={false}
            onClick={() => {
              // System preference detection
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              setThemeMode(prefersDark ? 'dark' : 'light')
            }}
            icon={<Monitor className="h-5 w-5" />}
            label="System"
          />
        </div>
      </div>

      {/* Default project view */}
      <div>
        <label className={labelClass}>Default Project View</label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <RadioCard
            selected={defaultView === 'board'}
            onClick={() => setDefaultView('board')}
            icon={<LayoutGrid className="h-5 w-5" />}
            label="Board"
          />
          <RadioCard
            selected={defaultView === 'list'}
            onClick={() => setDefaultView('list')}
            icon={<List className="h-5 w-5" />}
            label="List"
          />
          <RadioCard
            selected={defaultView === 'timeline'}
            onClick={() => setDefaultView('timeline')}
            icon={<GanttChart className="h-5 w-5" />}
            label="Timeline"
          />
        </div>
      </div>

      {/* Date format */}
      <div>
        <label className={labelClass}>Date Format</label>
        <select
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value as DateFormatOption)}
          className={inputClass}
        >
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
        </select>
      </div>

      {/* Items per page */}
      <div>
        <label className={labelClass}>Items Per Page</label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value) as ItemsPerPage)}
          className={inputClass}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button type="button" variant="primary" size="md" onClick={handleSave}>
          Save Preferences
        </Button>
        {saved && <span className="text-sm text-green-600">Preferences saved</span>}
      </div>
    </div>
  )
}
