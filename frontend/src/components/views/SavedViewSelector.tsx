import { useState, type FC } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuDivider,
} from '@/components/ui/Menu'
import { Bookmark, Globe, Trash2, Plus, Loader2 } from 'lucide-react'
import type { FilterState } from '@/hooks/useFilterState'
import type { ViewType } from '@/components/views/ViewSwitcher'
import {
  useSavedViews,
  useSaveView,
  useDeleteView,
} from '@/hooks/useSavedViews'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedViewSelectorProps {
  projectId: string
  currentFilters: FilterState
  currentView: ViewType
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SavedViewSelector: FC<SavedViewSelectorProps> = ({
  projectId,
  currentFilters,
  currentView,
}) => {
  const { data: views, isLoading } = useSavedViews(projectId)
  const saveViewMutation = useSaveView()
  const deleteViewMutation = useDeleteView()

  // Save dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [viewDescription, setViewDescription] = useState('')
  const [isShared, setIsShared] = useState(false)

  // Derived lists
  const userViews = views?.filter((v) => !v.is_shared) ?? []
  const sharedViews = views?.filter((v) => v.is_shared) ?? []

  // Handlers
  const handleOpenSaveDialog = () => {
    setViewName('')
    setViewDescription('')
    setIsShared(false)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!viewName.trim()) return

    saveViewMutation.mutate(
      {
        projectId,
        name: viewName.trim(),
        description: viewDescription.trim() || null,
        is_shared: isShared,
        filters_json: currentFilters as unknown as Record<string, unknown>,
        sort_json: { view: currentView },
      },
      {
        onSuccess: () => setDialogOpen(false),
      },
    )
  }

  const handleDelete = (viewId: string) => {
    deleteViewMutation.mutate({ projectId, viewId })
  }

  return (
    <>
      {/* Trigger with dropdown */}
      <Menu>
        <MenuButton className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium',
          'rounded-[--radius-sm] border border-surface-200 transition-colors',
          'bg-white text-text-secondary hover:bg-surface-50 hover:text-text-primary',
          'dark:bg-surface-100 dark:hover:bg-surface-200',
        )}>
          <Bookmark size={16} />
          Views
        </MenuButton>

        <MenuItems className="min-w-[260px] max-h-[400px] overflow-auto">
          {/* -- My Views section -- */}
          {userViews.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
              My views
            </div>
          )}
          {userViews.map((view) => (
            <MenuItem key={view.id}>
              <div className="flex items-center gap-2 w-full">
                <Bookmark size={14} className="shrink-0 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{view.name}</div>
                  {view.description && (
                    <div className="text-xs text-text-tertiary truncate">{view.description}</div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(view.id)
                  }}
                  className="shrink-0 p-1 rounded text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label={`Delete view ${view.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </MenuItem>
          ))}

          {/* -- Shared Views section -- */}
          {sharedViews.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
              Shared views
            </div>
          )}
          {sharedViews.map((view) => (
            <MenuItem key={view.id}>
              <div className="flex items-center gap-2 w-full">
                <Globe size={14} className="shrink-0 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{view.name}</div>
                  {view.description && (
                    <div className="text-xs text-text-tertiary truncate">{view.description}</div>
                  )}
                </div>
              </div>
            </MenuItem>
          ))}

          {/* Empty state */}
          {!isLoading && (views?.length ?? 0) === 0 && (
            <div className="px-3 py-2">
              <p className="text-sm text-text-secondary">No saved views yet.</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-3">
              <Loader2 size={16} className="animate-spin text-text-tertiary" />
            </div>
          )}

          <MenuDivider />

          {/* Save current view */}
          <MenuItem
            onClick={handleOpenSaveDialog}
            icon={<Plus size={14} />}
          >
            Save current view
          </MenuItem>
        </MenuItems>
      </Menu>

      {/* ---- Save View Dialog ---- */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Save current view"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            autoFocus
            label="Name"
            placeholder="My view"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
          />
          <Textarea
            label="Description (optional)"
            placeholder="Describe this view..."
            rows={2}
            value={viewDescription}
            onChange={(e) => setViewDescription(e.target.value)}
          />
          <Switch
            checked={isShared}
            onChange={setIsShared}
            label="Share with team"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!viewName.trim() || saveViewMutation.isPending}
            loading={saveViewMutation.isPending}
          >
            {saveViewMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}

export default SavedViewSelector
