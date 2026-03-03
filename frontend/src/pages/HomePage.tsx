import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Welcome to FRIDAY
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your enterprise project management hub. Use the sidebar to navigate between modules.
        </Typography>
      </Box>

      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Phase 1C is live. The shell is ready — projects, roadmaps, dashboards, and wiki modules
          are coming next.
        </Typography>
      </Box>
    </Container>
  )
}
