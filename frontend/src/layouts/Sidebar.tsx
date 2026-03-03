import { useLocation, NavLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import HomeIcon from '@mui/icons-material/Home'
import FolderIcon from '@mui/icons-material/Folder'
import TimelineIcon from '@mui/icons-material/Timeline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ArticleIcon from '@mui/icons-material/Article'
import SettingsIcon from '@mui/icons-material/Settings'
import WorkIcon from '@mui/icons-material/Work'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useUiStore } from '@/stores/uiStore'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 64

const navItems = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  { label: 'Projects', path: '/projects', icon: <FolderIcon /> },
  { label: 'Roadmaps', path: '/roadmaps', icon: <TimelineIcon /> },
  { label: 'Portfolio', path: '/portfolio', icon: <WorkIcon /> },
  { label: 'Releases', path: '/releases', icon: <NewReleasesIcon /> },
  { label: 'Dashboards', path: '/dashboards', icon: <DashboardIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { label: 'Wiki', path: '/wiki', icon: <ArticleIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1 : 2.5,
          py: 2,
          minHeight: 64,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: 2,
            background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
          }}
        >
          {collapsed ? 'F' : 'FRIDAY'}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map(({ label, path, icon }) => {
          const isActive =
            path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

          return (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              selected={isActive}
              onClick={isMobile ? onMobileClose : undefined}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'initial',
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': { backgroundColor: 'action.selected' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: isActive ? 'primary.main' : 'text.secondary',
                }}
              >
                {icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={label} />}
            </ListItemButton>
          )
        })}
      </List>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <IconButton onClick={toggleSidebar} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: EXPANDED_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH }
