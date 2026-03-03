import { useNavigate } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import SearchIcon from '@mui/icons-material/Search'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import { useSearchStore } from '@/stores/searchStore'

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color: string
}

export default function QuickActions() {
  const navigate = useNavigate()
  const openSearch = useSearchStore((s) => s.open)

  const actions: QuickAction[] = [
    {
      label: 'Create Issue',
      icon: <AddCircleOutlineIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/issues/new'),
      color: '#2196f3',
    },
    {
      label: 'Create Project',
      icon: <CreateNewFolderIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/projects/new'),
      color: '#4caf50',
    },
    {
      label: 'Search',
      icon: <SearchIcon sx={{ fontSize: 32 }} />,
      onClick: openSearch,
      color: '#ff9800',
    },
    {
      label: 'View Board',
      icon: <ViewKanbanIcon sx={{ fontSize: 32 }} />,
      onClick: () => navigate('/projects'),
      color: '#9c27b0',
    },
  ]

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            mt: 1,
          }}
        >
          {actions.map((action) => (
            <Box
              key={action.label}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <IconButton
                onClick={action.onClick}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: `${action.color}14`,
                  color: action.color,
                  '&:hover': {
                    bgcolor: `${action.color}28`,
                  },
                }}
              >
                {action.icon}
              </IconButton>
              <Typography variant="caption" color="text.secondary" textAlign="center">
                {action.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
