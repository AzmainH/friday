import { useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import PublicIcon from '@mui/icons-material/Public'
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

  // Menu state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  // Save dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [viewDescription, setViewDescription] = useState('')
  const [isShared, setIsShared] = useState(false)

  // Derived lists
  const userViews = views?.filter((v) => !v.is_shared) ?? []
  const sharedViews = views?.filter((v) => v.is_shared) ?? []

  // Handlers
  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleOpenSaveDialog = () => {
    handleCloseMenu()
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
      {/* Trigger button */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<BookmarkBorderIcon />}
        onClick={handleOpenMenu}
      >
        Views
      </Button>

      {/* Dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        slotProps={{ paper: { sx: { minWidth: 260, maxHeight: 400 } } }}
      >
        {/* -- My Views section -- */}
        {userViews.length > 0 && (
          <ListSubheader sx={{ lineHeight: '32px' }}>My views</ListSubheader>
        )}
        {userViews.map((view) => (
          <MenuItem key={view.id} dense>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <BookmarkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={view.name}
              secondary={view.description}
              secondaryTypographyProps={{ noWrap: true }}
            />
            <IconButton
              size="small"
              edge="end"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(view.id)
              }}
              aria-label={`Delete view ${view.name}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))}

        {/* -- Shared Views section -- */}
        {sharedViews.length > 0 && (
          <ListSubheader sx={{ lineHeight: '32px' }}>
            Shared views
          </ListSubheader>
        )}
        {sharedViews.map((view) => (
          <MenuItem key={view.id} dense>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PublicIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={view.name}
              secondary={view.description}
              secondaryTypographyProps={{ noWrap: true }}
            />
          </MenuItem>
        ))}

        {/* Empty state */}
        {!isLoading && (views?.length ?? 0) === 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No saved views yet.
            </Typography>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        <Divider />

        {/* Save current view */}
        <MenuItem onClick={handleOpenSaveDialog}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Save current view" />
        </MenuItem>
      </Menu>

      {/* ---- Save View Dialog ---- */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Save current view</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            size="small"
            fullWidth
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
          />
          <TextField
            label="Description (optional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={viewDescription}
            onChange={(e) => setViewDescription(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
              />
            }
            label="Share with team"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!viewName.trim() || saveViewMutation.isPending}
          >
            {saveViewMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SavedViewSelector
