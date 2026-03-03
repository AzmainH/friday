import { useState, useCallback, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from '@/layouts/Sidebar'
import TopBar from '@/layouts/TopBar'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/cn'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 64

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

const pageTransition = {
  duration: 0.15,
  ease: 'easeOut' as const,
}

export default function AppShell() {
  const isMobile = useIsMobile()
  const location = useLocation()
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
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-[margin-left] duration-[225ms] ease-[cubic-bezier(0.4,0,0.6,1)]',
        )}
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <TopBar onMenuClick={handleMenuClick} />

        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname.split('/').slice(0, 3).join('/')}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH, useIsMobile }
