import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Sidebar, { EXPANDED_WIDTH, COLLAPSED_WIDTH } from '@/layouts/Sidebar'
import TopBar from '@/layouts/TopBar'
import { useUiStore } from '@/stores/uiStore'

export default function AppShell() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      toggleSidebar()
    }
  }, [isMobile, toggleSidebar])

  const sidebarWidth = isMobile ? 0 : collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${sidebarWidth}px)`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
        }}
      >
        <TopBar onMenuClick={handleMenuClick} />

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
