import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function RoadmapsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Roadmaps
      </Typography>
      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Coming soon — timeline views, milestones, and strategic planning.
        </Typography>
      </Box>
    </Container>
  )
}
