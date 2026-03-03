import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {getGreeting()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {formatTodayDate()}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Row 1: Quick Actions - full width */}
        <Grid size={12}>
          <QuickActions />
        </Grid>

        {/* Row 2: My Issues (8 cols) + Overdue (4 cols) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MyIssuesWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <OverdueWidget />
        </Grid>

        {/* Row 3: Recent Activity (6 cols) + Favorites (6 cols) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <RecentActivityWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FavoritesWidget />
        </Grid>
      </Grid>
    </Container>
  )
}
