import { type ReactNode } from 'react'
import { useLocation, NavLink, useParams } from 'react-router-dom'
import {
  Home,
  FolderKanban,
  Map,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  List,
  GanttChart,
  Milestone,
  DollarSign,
  Scale,
  Users,
  Clock,
  BarChart3,
  Zap,
  ShieldCheck,
  FileInput,
  ArrowLeftRight,
  Cog,
  X,
  IterationCw,
  Shield,
  Plug,
} from 'lucide-react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/cn'
import { useIsMobile } from '@/layouts/AppShell'

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 64

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const primaryNav: NavItem[] = [
  { label: 'Home', path: '/', icon: <Home size={20} /> },
  { label: 'Projects', path: '/projects', icon: <FolderKanban size={20} /> },
  { label: 'Planning', path: '/planning', icon: <Map size={20} /> },
  { label: 'Knowledge', path: '/knowledge', icon: <BookOpen size={20} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
]

const projectNav: NavItem[] = [
  { label: 'Board', path: 'board', icon: <LayoutDashboard size={18} /> },
  { label: 'List', path: 'table', icon: <List size={18} /> },
  { label: 'Timeline', path: 'timeline', icon: <GanttChart size={18} /> },
  { label: 'Milestones', path: 'milestones', icon: <Milestone size={18} /> },
  { label: 'Budget', path: 'budget', icon: <DollarSign size={18} /> },
  { label: 'Sprints', path: 'sprints', icon: <IterationCw size={18} /> },
  { label: 'Decisions', path: 'decisions', icon: <Scale size={18} /> },
  { label: 'Stakeholders', path: 'stakeholders', icon: <Users size={18} /> },
  { label: 'Risks', path: 'risks', icon: <Shield size={18} /> },
  { label: 'Time', path: 'time-tracking', icon: <Clock size={18} /> },
  { label: 'Dashboard', path: 'dashboard', icon: <BarChart3 size={18} /> },
  { label: 'Reports', path: 'reports', icon: <BarChart3 size={18} /> },
  { label: 'Automations', path: 'automations', icon: <Zap size={18} /> },
  { label: 'Approvals', path: 'approvals', icon: <ShieldCheck size={18} /> },
  { label: 'Intake', path: 'intake', icon: <FileInput size={18} /> },
  { label: 'Import/Export', path: 'import-export', icon: <ArrowLeftRight size={18} /> },
  { label: 'Integrations', path: 'integrations', icon: <Plug size={18} /> },
  { label: 'Settings', path: 'settings', icon: <Cog size={18} /> },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const isMobile = useIsMobile()
  const location = useLocation()
  const { projectId } = useParams()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  const isInProject = Boolean(projectId)
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center min-h-[56px] px-5 py-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <span
          className="font-bold tracking-[0.15em] text-lg select-none"
          style={{
            background: 'linear-gradient(135deg, #009688 0%, #004D40 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {collapsed ? 'F' : 'FRIDAY'}
        </span>
      </div>

      <div className="h-px bg-surface-200 dark:bg-surface-200 mx-3" />

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-2 px-2">
        <ul className="space-y-0.5">
          {primaryNav.map(({ label, path, icon }) => {
            const isActive =
              path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

            return (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={isMobile ? onMobileClose : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[--radius-sm] text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-50/70 text-primary-700 border-l-2 border-primary-500 dark:bg-primary-900/15 dark:text-primary-300 dark:border-primary-400'
                      : 'text-text-secondary hover:bg-surface-100/60 hover:text-text-primary dark:hover:bg-surface-200',
                  )}
                  title={collapsed ? label : undefined}
                >
                  <span className={cn(isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary')}>
                    {icon}
                  </span>
                  {!collapsed && label}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {/* Project contextual nav */}
        {isInProject && !collapsed && (
          <>
            <div className="h-px bg-surface-200 dark:bg-surface-200 my-3" />
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
              Project
            </p>
            <ul className="space-y-0.5">
              {projectNav.map(({ label, path, icon }) => {
                const fullPath = `/projects/${projectId}/${path}`
                const isActive = location.pathname === fullPath

                return (
                  <li key={path}>
                    <NavLink
                      to={fullPath}
                      onClick={isMobile ? onMobileClose : undefined}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-[--radius-sm] text-[13px] font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50/70 text-primary-700 border-l-2 border-primary-500 dark:bg-primary-900/15 dark:text-primary-300 dark:border-primary-400'
                          : 'text-text-secondary hover:bg-surface-100/60 hover:text-text-primary dark:hover:bg-surface-200',
                      )}
                    >
                      <span className={cn(isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary')}>
                        {icon}
                      </span>
                      {label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="h-px bg-surface-200 dark:bg-surface-200 mx-3" />

      {/* Collapse toggle */}
      <div className="flex justify-center py-2">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-[--radius-sm] text-text-tertiary hover:bg-surface-100 hover:text-text-secondary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <Dialog open={mobileOpen} onClose={onMobileClose} className="relative z-[--z-overlay]">
        <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
        <DialogPanel
          className="fixed inset-y-0 left-0 w-[240px] bg-white dark:bg-surface-100 shadow-xl transition-transform"
        >
          <button
            onClick={onMobileClose}
            className="absolute top-3 right-3 p-1 rounded-[--radius-sm] text-text-tertiary hover:bg-surface-100"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
          {sidebarContent}
        </DialogPanel>
      </Dialog>
    )
  }

  // Desktop: permanent sidebar
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 bg-surface-50 dark:bg-surface-100 border-r border-surface-200/60 dark:border-surface-200 overflow-x-hidden z-[--z-sticky]',
        'transition-[width] duration-[225ms] ease-[cubic-bezier(0.4,0,0.6,1)]',
      )}
      style={{ width }}
    >
      {sidebarContent}
    </aside>
  )
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH }
