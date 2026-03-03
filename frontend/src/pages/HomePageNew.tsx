import QuickActions from '@/components/home/QuickActions'
import MyIssuesWidget from '@/components/home/MyIssuesWidget'
import OverdueWidget from '@/components/home/OverdueWidget'
import RecentActivityWidget from '@/components/home/RecentActivityWidget'
import FavoritesWidget from '@/components/home/FavoritesWidget'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function HomePageNew() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          {getGreeting()}
        </h1>
        <p className="text-base text-text-secondary">
          {formatTodayDate()}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Row 1: Quick Actions - full width */}
        <div className="col-span-12">
          <QuickActions />
        </div>

        {/* Row 2: My Issues (8 cols) + Overdue (4 cols) */}
        <div className="col-span-12 md:col-span-8">
          <MyIssuesWidget />
        </div>
        <div className="col-span-12 md:col-span-4">
          <OverdueWidget />
        </div>

        {/* Row 3: Recent Activity (6 cols) + Favorites (6 cols) */}
        <div className="col-span-12 md:col-span-6">
          <RecentActivityWidget />
        </div>
        <div className="col-span-12 md:col-span-6">
          <FavoritesWidget />
        </div>
      </div>
    </div>
  )
}
