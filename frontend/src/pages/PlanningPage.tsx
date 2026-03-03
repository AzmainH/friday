import { lazy, Suspense } from 'react'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { cn } from '@/lib/cn'

const RoadmapsContent = lazy(() => import('@/pages/RoadmapsPageNew'))
const PortfolioContent = lazy(() => import('@/pages/PortfolioPage'))
const ReleasesContent = lazy(() => import('@/pages/ReleasesPage'))

const TABS = ['Roadmaps', 'Portfolio', 'Releases'] as const

export default function PlanningPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Planning</h1>
      <p className="text-sm text-text-secondary mb-6">Manage roadmaps, portfolio overview, and releases.</p>

      <TabGroup>
        <TabList className="flex gap-1 border-b border-surface-200 mb-6">
          {TABS.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  'px-4 py-2 text-sm font-medium outline-none transition-colors -mb-px border-b-2',
                  selected
                    ? 'border-primary-500 text-primary-700'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel>
            <Suspense fallback={<div className="flex justify-center py-12"><div className="skeleton-shimmer h-8 w-48 rounded" /></div>}>
              <RoadmapsContent />
            </Suspense>
          </TabPanel>
          <TabPanel>
            <Suspense fallback={<div className="flex justify-center py-12"><div className="skeleton-shimmer h-8 w-48 rounded" /></div>}>
              <PortfolioContent />
            </Suspense>
          </TabPanel>
          <TabPanel>
            <Suspense fallback={<div className="flex justify-center py-12"><div className="skeleton-shimmer h-8 w-48 rounded" /></div>}>
              <ReleasesContent />
            </Suspense>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
