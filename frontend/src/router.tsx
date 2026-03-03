import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import AppShell from '@/layouts/AppShell'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const RoadmapsPage = lazy(() => import('@/pages/RoadmapsPage'))
const DashboardsPage = lazy(() => import('@/pages/DashboardsPage'))
const WikiPage = lazy(() => import('@/pages/WikiPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function LazyFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
}

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'projects', element: withSuspense(ProjectsPage) },
      { path: 'roadmaps', element: withSuspense(RoadmapsPage) },
      { path: 'dashboards', element: withSuspense(DashboardsPage) },
      { path: 'wiki', element: withSuspense(WikiPage) },
      { path: 'settings', element: withSuspense(SettingsPage) },
      { path: '*', element: withSuspense(NotFoundPage) },
    ],
  },
])
